import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, nombre, telefono } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: false, error: 'Email es requerido' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user = await db.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      if (user.isActive === false) {
        return NextResponse.json({ ok: false, error: 'Tu cuenta ha sido desactivada.' }, { status: 403 });
      }
      user = await db.user.update({
        where: { id: user.id },
        data: {
          updatedAt: new Date(),
          ...(nombre ? { nombre } : {}),
          ...(telefono ? { telefono } : {}),
        },
      });
    } else {
      user = await db.user.create({
        data: {
          nombre: nombre || cleanEmail.split('@')[0] || 'Usuario',
          email: cleanEmail,
          telefono: telefono || null,
        },
      });
    }

    const { password: _pw, ...userSafe } = user;
    return NextResponse.json({ ok: true, data: userSafe });
  } catch (error) {
    console.error('[Auth] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
