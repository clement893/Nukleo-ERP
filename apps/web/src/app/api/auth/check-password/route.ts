import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PASSWORD = 'Template123123';
const PASSWORD_COOKIE = 'template_auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // DÃ©finir le cookie d'authentification (valide pour 30 jours)
      response.cookies.set(PASSWORD_COOKIE, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 jours
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vÃ©rification' },
      { status: 500 }
    );
  }
}