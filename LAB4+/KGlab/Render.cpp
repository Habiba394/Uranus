#include "Render.h"
#include "GUItextRectangle.h"
#include "MyShaders.h"
#include "Texture.h"

#include <windows.h>
#include <GL/gl.h>
#include <GL/glu.h>
#include <sstream>
#include <string>
#include <cmath>
#include <cstdio>

#include "debout.h"
#include "MyOGL.h"
extern OpenGL gl;
#include "Light.h"
Light light;
#include "Camera.h"
Camera camera;

extern PFNGLACTIVETEXTUREPROC glActiveTexture;

template <typename T, int M1, int N1, int M2, int N2>
void MatrixMultiply(const T* a, const T* b, T* c)
{
    for (int i = 0;i < M1;i++) for (int j = 0;j < N2;j++) {
        c[i * N2 + j] = T(0);
        for (int k = 0;k < N1;k++) c[i * N2 + j] += a[i * N1 + k] * b[k * N2 + j];
    }
}

// ============================================================
//  Variables globales
// ============================================================
Shader uranus_sh, ring_sh, umoon_sh, stars_sh;
GLUquadric* quadUranus = nullptr;
GLUquadric* quadMoon = nullptr;
GLUquadric* quadStars = nullptr;

bool  autoRotate = true;
float rotSpeed = 0.4f;

// ============================================================
//  Touches — arg.key est le Virtual Key Code Windows directement
// ============================================================
void switchModes(OpenGL* sender, KeyEventArg arg)
{
    switch (arg.key)
    {
    case 'R': autoRotate = !autoRotate;                      break;
    case 'Q': rotSpeed = min(rotSpeed + 0.1f, 4.0f);      break;
    case 'W': rotSpeed = max(rotSpeed - 0.1f, 0.0f);      break;
    }
}

// ============================================================
//  Anneau plat sans gluDisk
// ============================================================
void drawRingDisk(float innerR, float outerR, int segs)
{
    const float PI = 3.14159265f;
    glBegin(GL_TRIANGLE_STRIP);
    for (int i = 0; i <= segs; i++) {
        float a = 2.0f * PI * i / segs;
        float cx = cosf(a), cz = sinf(a);
        glNormal3f(0, 1, 0);
        glTexCoord3f(outerR * cx, 0, outerR * cz);
        glVertex3f(outerR * cx, 0, outerR * cz);
        glTexCoord3f(innerR * cx, 0, innerR * cz);
        glVertex3f(innerR * cx, 0, innerR * cz);
    }
    glEnd();
}

GuiTextRectangle text;

void initRender()
{
    auto tryLoad = [](Shader& sh, const char* v, const char* f) {
        sh.VshaderFileName = v;
        sh.FshaderFileName = f;
        FILE* f1 = nullptr, * f2 = nullptr;
        fopen_s(&f1, v, "r"); fopen_s(&f2, f, "r");
        if (f1 && f2) { fclose(f1); fclose(f2); sh.LoadShaderFromFile(); sh.Compile(); }
        else {
            if (f1) fclose(f1); if (f2) fclose(f2);
            MessageBoxA(0, (std::string("Manquant:\n") + v + "\n" + f).c_str(), "Shader!", MB_OK | MB_ICONERROR);
        }
        };

    tryLoad(uranus_sh, "shaders/uranus.vert", "shaders/uranus.frag");
    tryLoad(ring_sh, "shaders/ring.vert", "shaders/ring.frag");
    tryLoad(umoon_sh, "shaders/umoon.vert", "shaders/umoon.frag");
    tryLoad(stars_sh, "shaders/stars.vert", "shaders/stars.frag");

    quadUranus = gluNewQuadric();
    gluQuadricNormals(quadUranus, GLU_SMOOTH);

    quadMoon = gluNewQuadric();
    gluQuadricNormals(quadMoon, GLU_SMOOTH);

    quadStars = gluNewQuadric();
    gluQuadricNormals(quadStars, GLU_SMOOTH);
    gluQuadricOrientation(quadStars, GLU_INSIDE);

    // Camera
    camera.setPosition(2.0, 3.0, 9.0);
    gl.WheelEvent.reaction(&camera, &Camera::Zoom);
    gl.MouseMovieEvent.reaction(&camera, &Camera::MouseMovie);
    gl.MouseLeaveEvent.reaction(&camera, &Camera::MouseLeave);
    gl.MouseLdownEvent.reaction(&camera, &Camera::MouseStartDrag);
    gl.MouseLupEvent.reaction(&camera, &Camera::MouseStopDrag);

    // Lumiere
    light.SetPosition(8.0, 4.0, 6.0);
    gl.MouseMovieEvent.reaction(&light, &Light::MoveLight);
    gl.KeyDownEvent.reaction(&light, &Light::StartDrug);
    gl.KeyUpEvent.reaction(&light, &Light::StopDrug);

    // Touches — enregistrement APRES light pour eviter conflits
    gl.KeyDownEvent.reaction(switchModes);

    text.setSize(420, 100);
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
}

float view_matrix[16];
double full_time = 0.0;

void Render(double delta_time)
{
    full_time += delta_time;
    float T = (float)full_time;

    camera.SetUpCamera();
    glGetFloatv(GL_MODELVIEW_MATRIX, view_matrix);
    light.SetUpLight();

    float lpos[4] = { (float)light.x(), (float)light.y(), (float)light.z(), 1.0f };
    float lpos_v[4] = { 0,0,0,0 };
    MatrixMultiply<float, 1, 4, 4, 4>(lpos, view_matrix, lpos_v);

    glDisable(GL_LIGHTING);
    glDisable(GL_TEXTURE_2D);
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_NORMALIZE);

    // ----------------------------------------------------------
    // 1. ETOILES (sphere interieure)
    // ----------------------------------------------------------
    glDepthMask(GL_FALSE);
    glDisable(GL_DEPTH_TEST);

    stars_sh.UseShader();
    glUniform1fARB(glGetUniformLocationARB(stars_sh.program, "Time"), T);

    glPushMatrix();
    glTranslated(camera.x(), camera.y(), camera.z());
    gluSphere(quadStars, 85.0f, 64, 64);
    glPopMatrix();

    glDepthMask(GL_TRUE);
    glEnable(GL_DEPTH_TEST);

    // ----------------------------------------------------------
    // 2. Systeme Uranus (inclinaison axiale 98 deg)
    // ----------------------------------------------------------
    float uranusRot = autoRotate ? T * rotSpeed * 10.0f : 0.0f;

    glPushMatrix();
    glRotatef(98.0f, 0, 0, 1);

    // Anneaux DERRIERE la planete
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
    glDisable(GL_DEPTH_TEST);

    ring_sh.UseShader();
    int loc;
    loc = glGetUniformLocationARB(ring_sh.program, "InnerRadius"); glUniform1fARB(loc, 1.35f);
    loc = glGetUniformLocationARB(ring_sh.program, "OuterRadius"); glUniform1fARB(loc, 2.9f);

    glEnable(GL_CLIP_PLANE0);
    double clipBack[4] = { 0.0, 0.0, -1.0, 0.0 };
    glClipPlane(GL_CLIP_PLANE0, clipBack);
    drawRingDisk(1.35f, 2.9f, 300);
    glDisable(GL_CLIP_PLANE0);

    glEnable(GL_DEPTH_TEST);
    glDisable(GL_BLEND);

    // Uranus sphere
    uranus_sh.UseShader();
    loc = glGetUniformLocationARB(uranus_sh.program, "Time");
    glUniform1fARB(loc, T);
    loc = glGetUniformLocationARB(uranus_sh.program, "light_pos_v");
    glUniform3fvARB(loc, 1, lpos_v);

    glPushMatrix();
    glRotatef(uranusRot, 0, 1, 0);
    gluSphere(quadUranus, 1.0f, 96, 96);
    glPopMatrix();

    // Anneaux DEVANT la planete
    glEnable(GL_BLEND);
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

    ring_sh.UseShader();
    loc = glGetUniformLocationARB(ring_sh.program, "InnerRadius"); glUniform1fARB(loc, 1.35f);
    loc = glGetUniformLocationARB(ring_sh.program, "OuterRadius"); glUniform1fARB(loc, 2.9f);

    glEnable(GL_CLIP_PLANE0);
    double clipFront[4] = { 0.0, 0.0, 1.0, 0.0 };
    glClipPlane(GL_CLIP_PLANE0, clipFront);
    drawRingDisk(1.35f, 2.9f, 300);
    glDisable(GL_CLIP_PLANE0);
    glDisable(GL_BLEND);

    // Lunes
    float moonData[5][3] = {
        {1.55f, 0.80f, 0.055f},
        {1.90f, 0.55f, 0.065f},
        {2.25f, 0.38f, 0.072f},
        {2.60f, 0.28f, 0.060f},
        {3.05f, 0.18f, 0.050f}
    };

    umoon_sh.UseShader();
    for (int m = 0; m < 5; m++) {
        float ma = T * moonData[m][1] * 15.0f;
        float mx = cosf(ma * 3.14159f / 180.0f) * moonData[m][0];
        float mz = sinf(ma * 3.14159f / 180.0f) * moonData[m][0];
        glPushMatrix();
        glTranslatef(mx, 0, mz);
        gluSphere(quadMoon, moonData[m][2], 16, 16);
        glPopMatrix();
    }

    glPopMatrix(); // fin rotation 98 deg

    // ----------------------------------------------------------
    // 3. HUD
    // ----------------------------------------------------------
    Shader::DontUseShaders();
    glLoadIdentity();
    camera.SetUpCamera();

    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
    glLoadIdentity();
    glOrtho(0, gl.getWidth() - 1, 0, gl.getHeight() - 1, 0, 1);
    glMatrixMode(GL_MODELVIEW);
    glPushMatrix();
    glLoadIdentity();

    std::wstringstream ss;
    ss << L"=== Uranus ===\n"
        << L"Q - Speed + : " << rotSpeed << L"\n"
        << L"W - Speed - : " << rotSpeed << L"\n"
        << L"R - Rotation : " << (autoRotate ? L"YES" : L"NO") << L"\n"
        << L"G - Light  | Mouse - Camera";

    text.setPosition(10, gl.getHeight() - 10 - 100);
    text.setText(ss.str().c_str());
    text.Draw();

    glMatrixMode(GL_PROJECTION);
    glPopMatrix();
    glMatrixMode(GL_MODELVIEW);
    glPopMatrix();
}