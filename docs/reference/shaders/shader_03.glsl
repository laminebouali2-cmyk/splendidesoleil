precision highp float;

attribute vec4 color;

varying vec2 vUv;
varying vec2 vPieceCoord;
varying float vFaceTag;
varying float vFaceMask;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vScreenUv;

float hash11(float value) {
	return fract(sin(value) * 43758.5453123);
}

vec3 rotateX(vec3 pos, float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return vec3(
		pos.x,
		pos.y * c - pos.z * s,
		pos.y * s + pos.z * c
	);
}

vec3 rotateY(vec3 pos, float angle) {
	float s = sin(angle);
	float c = cos(angle);
	return vec3(
		pos.x * c + pos.z * s,
		pos.y,
		-pos.x * s + pos.z * c
	);
}

uniform float uEffectsCurve;
uniform float uEffectsScroll;
uniform float uEffectsThicknessEnabled;
uniform vec2 uBaseSize;
uniform float uScrollPos;
uniform float uVelocity;

void main() {
	vUv = uv;
	vPieceCoord = color.yz;
	vFaceTag = color.w;

	vec3 nPos = position.xyz;
	vec3 nrm = normal;

	float pieceX = (vPieceCoord.x * 2.0) - 1.0;
	float pieceY = (vPieceCoord.y * 2.0) - 1.0;
	float curveMask = 1.0 - pow(abs(pieceX), 1.8);
	vec2 centerVec = vec2(pieceX * 0.92, pieceY * 1.08);
	float centerDist = length(centerVec);
	float pieceSeed = hash11(vPieceCoord.x * 173.11 + vPieceCoord.y * 271.93);
	float randAngle = pieceSeed * PI * 2.0;
	vec2 randDir = vec2(cos(randAngle), sin(randAngle));
	vec2 radialDir = normalize(mix(randDir, centerDist > 0.0001 ? normalize(centerVec) : randDir, smoothstep(0.0, 0.18, centerDist)));
	nPos.z += curveMask * uEffectsCurve;

	float velocity = clamp(abs(uVelocity), 0.0, 160.0);
	float velocitySign = sign(uVelocity == 0.0 ? 1.0 : uVelocity);
	float spreadPhase = (centerDist * PI * 2.2) + (vPieceCoord.x * PI * 1.8) - (uScrollPos * 0.0028);
	float spreadWave = 0.82 + (0.18 * sin(spreadPhase));
	float spreadMask = mix(0.44, 1.0, smoothstep(0.0, 1.15, centerDist));
	float spread = velocity * uEffectsScroll * spreadMask * spreadWave;
	float depthLift = spread * (0.55 + (0.45 * curveMask));
	float scrollLift = velocitySign * spread * (0.22 + (0.18 * (1.0 - abs(pieceX))));
	vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
	float tangentOffset = spread * (pieceSeed - 0.5) * 0.12;
	vec3 pieceCenter = vec3(
		pieceX * uBaseSize.x * 0.5,
		pieceY * uBaseSize.y * 0.5,
		0.0
	);
	vec3 localPos = nPos - pieceCenter;
	float thicknessTiltBoost = mix(1.0, 7.0, clamp(uEffectsThicknessEnabled, 0.0, 1.0));
	float tiltAmount = abs(spread) * (0.0028 + (0.0038 * smoothstep(0.0, 1.1, centerDist))) * thicknessTiltBoost;
	float tiltX = -pieceY * tiltAmount;
	float tiltY = pieceX * tiltAmount;

	localPos = rotateX(localPos, tiltX);
	localPos = rotateY(localPos, tiltY);
	nrm = rotateX(nrm, tiltX);
	nrm = rotateY(nrm, tiltY);

	nPos = pieceCenter + localPos;
	nPos.xy += radialDir * vec2(spread * 0.34, spread * 0.26);
	nPos.xy += tangentDir * tangentOffset;
	nPos.y += scrollLift;
	nPos.z += (depthLift + (abs(spread) * (0.10 + (0.08 * centerDist)))) * mix(1.0, 1.8, clamp(uEffectsThicknessEnabled, 0.0, 1.0));

	vec4 mvPosition = modelViewMatrix * vec4(nPos, 1.0);
	vNormal = normalize(normalMatrix * nrm);
	vFaceMask = smoothstep(0.2, 0.8, abs(nrm.z));
	vViewDir = normalize(-mvPosition.xyz);

	vec4 clipPosition = projectionMatrix * mvPosition;
	gl_Position = clipPosition;
	vScreenUv = (clipPosition.xy / max(clipPosition.w, 0.0001)) * 0.5 + 0.5;
}