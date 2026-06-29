
uniform sampler2D uVelocity;
uniform vec2 texelSize;
varying vec2 vUv;
void main () {
	float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0)).y;
	float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0)).y;
	float T = texture2D(uVelocity, vUv + vec2(0, texelSize.y)).x;
	float B = texture2D(uVelocity, vUv - vec2(0, texelSize.y)).x;
	float vorticity = R - L - T + B;
	gl_FragColor = vec4(vorticity, 0.0, 0.0, 1.0);
}