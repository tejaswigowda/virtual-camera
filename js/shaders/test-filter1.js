
const testFilter = `
const float TWO_PI = 6.283185307179586;
const float amount = 0.2;
const float speeed = 0.05;

vec2 rotate2D(vec2 position, float theta){
	mat2 m = mat2( cos(theta), -sin(theta), sin(theta), cos(theta) );
	return m * position;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 vUv = fragCoord/iResolution.xy;
	vec2 p = vUv;
	// Displace image by its own rg channel
	vec2 sPos = vUv;
	vec2 off = texture2D(iChannel0, sPos ).rg - 0.5;
	
	// rotate
	float ang = iTime * TWO_PI * speeed;
	off = rotate2D(off, ang);
	p += off * amount;
	
	vec4 col = texture2D(iChannel0, p);
	
	fragColor = col;
}
 `;

export { testFilter }