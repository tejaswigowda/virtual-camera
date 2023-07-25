
const testFilter = `
#define TILINGS 20.0

float hexDist(in vec2 p) {
    p = abs(p);
    float edgeDist = dot(p, normalize(vec2(1.0, 1.73)));
    return max(edgeDist, p.x);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y * TILINGS;
    float unit = 2.0 * TILINGS / iResolution.y;

    vec2 rep = vec2(1.0, 1.73); // 1.73 ~ sqrt(3)
    vec2 hrep = 0.5 * rep;
    vec2 a = mod(uv, rep) - hrep;
    vec2 b = mod(uv - hrep, rep) - hrep;
    vec2 hexUv = dot(a, a) < dot(b, b) ? a : b;
    vec2 cellId = uv - hexUv;

    vec2 sampleUv = cellId / TILINGS;
    sampleUv.x *= iResolution.y / iResolution.x;
    float brightness = dot(texture2D(iChannel0, sampleUv + 0.5).rgb, vec3(1.0 / 3.0));
    fragColor = vec4(smoothstep(unit, 0.0, hexDist(hexUv) - brightness * 0.5));
}
 `;

export { testFilter }