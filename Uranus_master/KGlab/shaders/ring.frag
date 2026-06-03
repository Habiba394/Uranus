uniform float InnerRadius;
uniform float OuterRadius;

void main(void)
{
    vec3 worldPos = gl_TexCoord[3].xyz;
    float dist = length(vec2(worldPos.x, worldPos.z));

    if(dist < InnerRadius || dist > OuterRadius) discard;

    float t = (dist - InnerRadius) / (OuterRadius - InnerRadius);

    // 7 anneaux fins comme dans la video
    float ringPattern = 0.0;
    float centers[7];
    float widths[7];
    centers[0]=0.06; widths[0]=0.022;
    centers[1]=0.16; widths[1]=0.025;
    centers[2]=0.28; widths[2]=0.028;
    centers[3]=0.42; widths[3]=0.032;
    centers[4]=0.57; widths[4]=0.028;
    centers[5]=0.72; widths[5]=0.025;
    centers[6]=0.87; widths[6]=0.022;

    for(int i=0; i<7; i++){
        float d = abs(t - centers[i]);
        if(d < widths[i])
            ringPattern = max(ringPattern, 1.0-smoothstep(0.0, widths[i], d));
    }

    if(ringPattern < 0.005) discard;

    // Gris-bleu comme dans la video originale
    vec3 rc = mix(vec3(0.20,0.22,0.26), vec3(0.65,0.68,0.72), ringPattern);
    gl_FragColor = vec4(rc, ringPattern * 0.82);
}