precision highp float;

#ifndef DETAILS_QUALITY
	#define DETAILS_QUALITY 2
#endif

varying vec2 vUv;
varying float vTopFade;
uniform sampler2D tDiffuse;
uniform vec2 uUvScale;

uniform float uAlpha;
uniform float uEffectsAberration;
uniform float uEffectsBlurFade;
uniform float uEffectsBlurHorizontal;
uniform float uEffectsBlurVelocity;
uniform float uEffectsHorizontalProgress;

	uniform vec3 uColorA;
	uniform vec3 uColorB;
	uniform vec3 uColorC;
	uniform vec3 uColorD;

	uniform float uImageMix;
	uniform float uVelocity;

void main() {
	if ( uAlpha <= 0.00001 ) {
		gl_FragColor = vec4(0.0);
		return;
	}

	vec2 uvCover = vUv * uUvScale + (1.0 - uUvScale) * 0.5;
	vec2 uvGradient = uvCover;
	vec2 res = vec2(1.0, 1.0);

	float dist = distance(vec2(res.x * 0.5, res.y * 0.5), uvGradient.xy) * 2.0;
	vec3 grad = mix(
		mix(uColorA, uColorB, uvGradient.x),
		mix(uColorC, uColorD, uvGradient.y),
		dist * 0.5
	);

	float alphaBase = uAlpha * (1.0 - vTopFade);

	if ( uImageMix <= 0.00001 ) {
		gl_FragColor = vec4(grad, alphaBase);
		return;
	}

	float horizontalProgress = clamp(uEffectsHorizontalProgress, 0.0, 1.0);
	float fadeBlur = clamp(vTopFade * uEffectsBlurFade, 0.0, 0.08);
	float velocityBlur = clamp(abs(uVelocity) * uEffectsBlurVelocity * (1.0 - horizontalProgress), 0.0, 0.08);
	float horizontalBlur = clamp(abs(uVelocity) * uEffectsBlurHorizontal * horizontalProgress, 0.0, 0.08);
	float blurAmount = fadeBlur + velocityBlur + horizontalBlur;
	float velocityDir = sign(uVelocity);
	vec2 blurOffset = vec2(horizontalBlur, fadeBlur + velocityBlur);
	vec2 aberrationOffset = vec2(uEffectsAberration * vTopFade, 0.0);

	vec4 c = texture2D(tDiffuse, uvCover);
	vec3 image = c.rgb;

	if ( blurAmount > 0.00001 ) {
		vec2 dir = blurOffset * (velocityDir == 0.0 ? 1.0 : velocityDir);
		vec3 sampleCenter = c.rgb;

#if DETAILS_QUALITY <= 0
		vec3 sampleNearA = texture2D(tDiffuse, uvCover - dir * 0.7).rgb;
		vec3 sampleNearB = texture2D(tDiffuse, uvCover + dir * 0.7).rgb;
		vec3 blurred = (
			sampleCenter * 0.44
			+ sampleNearA * 0.28
			+ sampleNearB * 0.28
		);

		image = blurred;
#else
		vec3 sampleNearA = texture2D(tDiffuse, uvCover - dir * 0.5).rgb;
		vec3 sampleNearB = texture2D(tDiffuse, uvCover + dir * 0.5).rgb;
		vec3 sampleFarA = texture2D(tDiffuse, uvCover - dir).rgb;
		vec3 sampleFarB = texture2D(tDiffuse, uvCover + dir).rgb;
		vec3 blurred = (
			sampleCenter * 0.32
			+ sampleNearA * 0.24
			+ sampleNearB * 0.24
			+ sampleFarA * 0.10
			+ sampleFarB * 0.10
		);

		float chromaMix = clamp(vTopFade, 0.0, 1.0);
		if ( chromaMix > 0.00001 && abs(uEffectsAberration) > 0.00001 ) {
			vec3 chroma = vec3(
				texture2D(tDiffuse, uvCover + aberrationOffset).r,
				blurred.g,
				texture2D(tDiffuse, uvCover - aberrationOffset).b
			);

			image = mix(blurred, chroma, chromaMix);
		} else {
			image = blurred;
		}
#endif
	}

	vec3 rgb = mix(grad, image, uImageMix);
	float alpha = mix(1.0, c.a, uImageMix) * alphaBase;
	gl_FragColor = vec4(rgb, alpha);
}