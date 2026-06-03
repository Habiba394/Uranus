uniform float Time;
uniform vec3  light_pos_v;

float hash(vec2 p){
    return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
}
float noise(vec2 p){
    vec2 i=floor(p); vec2 f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
    float v=0.0;
    v+=0.500*noise(p);
    v+=0.250*noise(p*2.03+vec2(1.7,9.2));
    v+=0.125*noise(p*4.11+vec2(8.3,2.8));
    v+=0.062*noise(p*8.53+vec2(3.1,5.4));
    v+=0.031*noise(p*17.1+vec2(6.7,1.2));
    return v;
}

void main(void)
{
    vec3 N   = normalize(gl_TexCoord[2].xyz);
    vec3 pos = gl_TexCoord[1].xyz;
    vec3 V   = normalize(-pos);
    vec3 L   = normalize(light_pos_v - pos);

    // Coordonnees spheriques
    float phi   = atan(N.z, N.x);
    float theta = asin(clamp(N.y,-1.0,1.0));
    vec2  uv    = vec2(phi/6.28318+0.5, theta/3.14159+0.5);

    // Tourbillons et nuages animes (comme vid6)
    vec2 uv1 = uv + vec2(Time*0.012, 0.0);
    vec2 uv2 = uv - vec2(Time*0.008, Time*0.004);
    float n1 = fbm(uv1*4.0);
    float n2 = fbm(uv2*6.0 + vec2(n1*2.0, n1*1.5));
    float n3 = fbm(uv*2.5  + vec2(n2*1.8, Time*0.006));

    // Bandes latitudinales (caracteristique Uranus)
    float band = sin(theta*6.0)*0.3 + sin(theta*14.0)*0.15;

    float pattern = clamp(n3*0.6 + n2*0.3 + band*0.1 + 0.5, 0.0, 1.0);

    // Palette Uranus : cyan electrique vif + nuages blancs (comme vid6)
    vec3 c0 = vec3(0.0,  0.65, 0.82);  // cyan profond
    vec3 c1 = vec3(0.15, 0.78, 0.92);  // cyan vif
    vec3 c2 = vec3(0.45, 0.90, 0.97);  // cyan clair
    vec3 c3 = vec3(0.80, 0.96, 1.00);  // blanc-cyan
    vec3 c4 = vec3(0.95, 0.98, 1.00);  // blanc nuages

    vec3 baseColor;
    if     (pattern < 0.25) baseColor = mix(c0, c1, pattern/0.25);
    else if(pattern < 0.50) baseColor = mix(c1, c2, (pattern-0.25)/0.25);
    else if(pattern < 0.75) baseColor = mix(c2, c3, (pattern-0.50)/0.25);
    else                    baseColor = mix(c3, c4, (pattern-0.75)/0.25);

    // Eclairage jour/nuit (comme Terre)
    float NdotL  = dot(N, L);
    float blend  = smoothstep(-0.25, 0.25, NdotL);
    float ambient = 0.04;

    vec3 color = mix(
        baseColor * ambient,                          // cote nuit SOMBRE
        baseColor * (ambient + (1.0-ambient)*max(NdotL,0.0)),  // cote jour
        blend
    );

    // Speculaire leger sur les nuages
    vec3 R   = reflect(-L, N);
    float spec = pow(max(dot(R,V),0.0), 50.0) * blend * 0.12;
    color += vec3(0.8, 0.95, 1.0) * spec;

    // Halo atmospherique bleu-cyan
    float rim = pow(1.0-max(dot(N,V),0.0), 2.5);
    float rimDay = clamp(NdotL + 0.6, 0.0, 1.0);
    color += vec3(0.0, 0.6, 0.9) * rim * rimDay * 0.8;

    gl_FragColor = vec4(color, 1.0);
}