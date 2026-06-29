
				attribute float aFaceEdgeMask;
				varying vec3 vWorldPosition;
				varying vec3 vWorldNormal;
				varying vec3 vLocalPosition;
				varying vec4 vClipPosition;
				varying float vFaceEdgeMask;
				uniform float uCurveRadius;
				uniform float uCurveState;
				uniform float uBendDir;
				vec3 bendCylinder(vec3 p, float radius) {
					if (radius <= 0.0) return p;
					float theta = p.x / radius;
					float radial = radius + uBendDir * p.z;
					float bentX = sin(theta) * radial;
					float bentZ = uBendDir * cos(theta) * radial;
					return vec3(bentX, p.y, bentZ);
				}
				void main() {
					vec3 curvedPosition = mix(bendCylinder(position, uCurveRadius), position, uCurveState);
					vec4 worldPosition = modelMatrix * vec4(curvedPosition, 1.0);
					vWorldPosition = worldPosition.xyz;
					vWorldNormal = normalize(mat3(modelMatrix) * normal);
					vLocalPosition = curvedPosition;
					vClipPosition = projectionMatrix * viewMatrix * worldPosition;
					vFaceEdgeMask = aFaceEdgeMask;
					gl_Position = vClipPosition;
				}
			