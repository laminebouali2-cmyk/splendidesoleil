
				precision highp float;

				uniform vec2 iResolution;
				uniform float uProgress;
				uniform float uArcStrength;
				uniform float uDirection;
				uniform float uVisible;

				varying vec2 vUv;

					void main() {
						if ( uVisible < 0.5 ) discard;

						float progress = clamp(uProgress, 0.0, 1.0);
						float arcProgress = sin(progress * 3.141592653589793);
						float arcAspectScale = clamp(iResolution.x / max(iResolution.y, 1.0), 0.35, 1.0);
						float arc = sin(vUv.x * 3.141592653589793) * uArcStrength * arcAspectScale * arcProgress;
						float edge = progress + arc;
						float mask = uDirection > 0.0
							? step(vUv.y, edge)
							: step(edge, vUv.y);

						if ( mask < 0.5 ) discard;

					gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
				}
			