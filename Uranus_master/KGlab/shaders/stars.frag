varying vec3 vDir;
uniform float Time;

float hash21(vec2 p){
    vec3 p3=fract(vec3(p.xyx)*vec3(0.1031,0.1030,0.0973));
    p3+=dot(p3,p3.yzx+33.33);
    return fract((p3.x+p3.y)*p3.z);
}

float noise(vec2 p){
    vec2 i=floor(p); vec2 f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),
               mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);
}

void main(void)
{
    vec3  dir   = normalize(vDir);
    float phi   = atan(dir.z, dir.x);
    float theta = asin(clamp(dir.y,-1.0,1.0));
    vec3  color = vec3(0.0, 0.0, 0.008);

    // ---- ETOILES ----
    vec2 grid = vec2(
        floor((phi+3.14159)/6.28318*700.0),
        floor((theta+1.5708)/3.14159*350.0)
    );
    float rnd = hash21(grid);
    if(rnd > 0.942)
    {
        float cW=6.28318/700.0, cH=3.14159/350.0;
        float sP=(grid.x+0.5+(hash21(grid+vec2(7.3,2.1))-0.5)*0.7)*cW-3.14159;
        float sT=(grid.y+0.5+(hash21(grid+vec2(1.7,9.5))-0.5)*0.7)*cH-1.5708;
        vec3  sD=vec3(cos(sT)*cos(sP),sin(sT),cos(sT)*sin(sP));
        float dist=length(dir-sD)*700.0;
        if(dist < 1.1)
        {
            float b=1.0-smoothstep(0.0,1.1,dist);
            float mag=hash21(grid+vec2(3.1,5.9));
            b *= 0.4+mag*0.6;
            b *= 0.88+0.12*sin(Time*(1.5+mag*7.0)+rnd*100.0);
            float ct=hash21(grid+vec2(9.2,1.3));
            vec3 sc = ct<0.15 ? vec3(0.75,0.85,1.0) :
                      ct<0.45 ? vec3(0.95,0.97,1.0) :
                      ct<0.78 ? vec3(1.0,1.0,0.92)  : vec3(1.0,0.88,0.6);
            color += sc*b*b*1.4;
        }
    }

    // ---- ETOILES FILANTES ----
    for(int s=0; s<3; s++)
    {
        float seed=float(s)*17.3+1.1;
        float period=8.0+float(s)*3.0;
        float tL=mod(Time*0.5+seed,period);
        float fade=smoothstep(0.0,0.4,tL)*smoothstep(2.0,1.0,tL);
        if(fade<0.01) continue;
        float a1=seed*2.1, a2=seed*1.3-float(s)*0.9;
        vec3 tDir=normalize(vec3(cos(a1)*cos(a2),sin(a2)*0.25,sin(a1)*cos(a2)));
        vec3 tStart=normalize(tDir+vec3(sin(seed)*0.3,cos(seed)*0.2,sin(seed+1.0)*0.25));
        vec3 tPos=normalize(tStart+tDir*tL*0.10);
        float d=length(dir-tPos);
        if(d<0.010) color+=vec3(0.75,0.88,1.0)*(1.0-d/0.010)*fade*2.0;
        for(int t=1;t<=6;t++){
            float tf=float(t)/6.0;
            vec3 tp=normalize(tStart+tDir*(tL-tf*0.35)*0.10);
            float dt=length(dir-tp);
            if(dt<0.005) color+=vec3(0.4,0.65,1.0)*(1.0-dt/0.005)*(1.0-tf)*fade;
        }
    }

    // ---- VOIE LACTEE (noise continu = ZERO rectangle) ----
    float galLat=abs(dir.y);
    float milky = noise(vec2(phi*1.5, dir.y*3.0));
    milky *= noise(vec2(phi*3.0+1.7, dir.y*5.0+0.8));
    milky *= smoothstep(0.65, 0.0, galLat);
    milky *= 0.18;
    color += vec3(0.05, 0.15, 0.55) * milky;

    // ---- GALAXIES (exp = ZERO rectangle) ----
    vec3 g1=normalize(vec3(cos(-0.3)*cos(1.8),sin(-0.3),cos(-0.3)*sin(1.8)));
    color += vec3(0.5,0.12,0.04)*exp(-(1.0-dot(dir,g1))*120.0)*0.4;

    vec3 g2=normalize(vec3(cos(0.15)*cos(-0.9),sin(0.15),cos(0.15)*sin(-0.9)));
    color += vec3(0.08,0.15,0.6)*exp(-(1.0-dot(dir,g2))*150.0)*0.35;

    vec3 g3=normalize(vec3(cos(0.4)*cos(2.8),sin(0.4),cos(0.4)*sin(2.8)));
    color += vec3(0.04,0.45,0.25)*exp(-(1.0-dot(dir,g3))*180.0)*0.30;

    vec3 g4=normalize(vec3(cos(-0.5)*cos(-2.1),sin(-0.5),cos(-0.5)*sin(-2.1)));
    color += vec3(0.5,0.08,0.35)*exp(-(1.0-dot(dir,g4))*160.0)*0.32;

    gl_FragColor = vec4(color, 1.0);
}