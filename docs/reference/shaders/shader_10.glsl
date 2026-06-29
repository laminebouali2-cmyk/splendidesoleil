
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
uniform vec2 texelSize;
varying vec2 vUv;
void main () {
	float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0)).x;
	float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0)).x;
	float T = texture2D(uCurl, vUv + vec2(0, texelSize.y)).x;
	float B = texture2D(uCurl, vUv - vec2(0, texelSize.y)).x;
	float C = texture2D(uCurl, vUv).x;
	vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
	force /= length(force) + 0.0001;
	force *= curl * C;
	force.y *= -1.0;
	vec2 velocity = texture2D(uVelocity, vUv).xy;
	velocity += force * dt;
	gl_FragColor = vec4(velocity, 0.0, 1.0);
}