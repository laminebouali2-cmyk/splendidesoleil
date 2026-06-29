
precision highp float;

uniform sampler2D tMap;
uniform float uAlpha;
uniform float uMaskProgress;
uniform float uMaskDirection;
uniform float uMaskSoftness;
uniform float uMaskBand;

varying vec2 vUv;

void main() {
	vec4 color = texture2D(tMap, vUv);
	float sourceAlpha = clamp(color.a, 0.0, 1.0);
	if ( sourceAlpha < 0.001 ) discard;

	float maskProgress = clamp(uMaskProgress, 0.0, 1.0);
	float maskSoftness = max(uMaskSoftness, 0.001);
	float maskY = uMaskDirection < 0.0 ? (1.0 - vUv.y) : vUv.y;
	float edge = mix(-maskSoftness, 1.0 + maskSoftness, maskProgress);
	float cover = 1.0 - smoothstep(edge - maskSoftness, edge, maskY);
	float visible = 1.0 - cover;
	float finalAlpha = sourceAlpha;
	vec3 finalRgb = mix(vec3(1.0), color.rgb, visible);

	gl_FragColor = vec4(finalRgb, finalAlpha);
}