void main(void)
{
    vec3  N     = normalize(gl_TexCoord[2].xyz);
    vec3  pos   = gl_TexCoord[1].xyz;
    vec3  L     = normalize(vec3(5.0, 3.0, 4.0) - pos);
    vec3  V     = normalize(-pos);
    float NdotL = max(dot(N,L), 0.0);

    // Lunes d Uranus : gris-bleuté
    vec3 col = vec3(0.55, 0.60, 0.65);
    col *= 0.08 + 0.92 * NdotL;

    // Rim leger
    float rim = pow(1.0-max(dot(N,V),0.0), 3.0);
    col += vec3(0.4, 0.7, 0.9) * rim * 0.2;

    gl_FragColor = vec4(col, 1.0);
}