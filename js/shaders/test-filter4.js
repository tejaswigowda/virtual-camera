
const testFilter = `
vec4 WebCamPixelAt(vec2 pos) {
    return texture2D(iChannel0, pos);
}

// Abrbitrary color scale
vec3 palette (float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);
    return a + b*cos( 6.28318* (c*t+d) );
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
    float d = length(uv);
    vec3 col = WebCamPixelAt(fragCoord/iResolution.xy).xyz;
    col *= palette(d);
    d = sin(d*8. + (iTime*2.0))/16.;

    d = 0.05 / d;
    d = abs(d);
    col *= d; 
    fragColor = vec4 (col, 1.0);
}
 `;

export { testFilter }