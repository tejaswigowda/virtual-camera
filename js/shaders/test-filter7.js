
const testFilter = `
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 c = texture2D(iChannel0,uv);
    c = sin(uv.x*10.+c*cos(c*6.28+iTime+uv.x)*sin(c+uv.y+iTime)*6.28)*.5+.5;
    c.b+=length(c.rg);
	fragColor = c;
}
 `;

export { testFilter }