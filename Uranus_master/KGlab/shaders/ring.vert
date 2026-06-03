void main(void)
{
    gl_Position    = gl_ProjectionMatrix * gl_ModelViewMatrix * gl_Vertex;
    gl_TexCoord[1] = vec4((gl_ModelViewMatrix * gl_Vertex).xyz, 1.0);
    gl_TexCoord[2] = vec4(normalize(gl_NormalMatrix * gl_Normal), 1.0);
    gl_TexCoord[3] = vec4(gl_Vertex.xyz, 1.0);
}