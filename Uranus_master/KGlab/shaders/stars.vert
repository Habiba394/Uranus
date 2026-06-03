varying vec3 vDir;

void main(void)
{
    vDir        = gl_Normal;
    gl_Position = gl_ProjectionMatrix * gl_ModelViewMatrix * gl_Vertex;
}