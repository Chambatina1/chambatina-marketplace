import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const CATEGORIAS = ['general','hogar','tecnologia','belleza','educacion','transporte','alimentos','construccion','arte','salud','legal','otros'] as const;
const TIPOS_VALIDOS = ['oferta', 'necesidad'] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const categoria = searchParams.get('categoria') || '';
    const search = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100);

    const where: any = { activo: true };
    if (tipo && TIPOS_VALIDOS.includes(tipo as any)) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      db.marketplaceListing.findMany({
        where,
        include: { user: { select: { id: true, nombre: true, direccion: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.marketplaceListing.count({ where }),
    ]);

    return NextResponse.json({ ok: true, data: listings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('[Servicios] Error fetching:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener servicios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, titulo, descripcion, categoria, ciudad, precio, contacto, imagenUrl, imagenUrls, nombre } = body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 1) {
      return NextResponse.json({ ok: false, error: 'Tu nombre es requerido' }, { status: 400 });
    }
    if (!contacto || typeof contacto !== 'string' || contacto.trim().length < 6) {
      return NextResponse.json({ ok: false, error: 'Telefono de contacto es requerido (min 6 digitos)' }, { status: 400 });
    }
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ ok: false, error: 'Tipo invalido' }, { status: 400 });
    }
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length < 3) {
      return NextResponse.json({ ok: false, error: 'Titulo minimo 3 caracteres' }, { status: 400 });
    }
    if (titulo.length > 120) {
      return NextResponse.json({ ok: false, error: 'Titulo maximo 120 caracteres' }, { status: 400 });
    }

    // Auto-create user with unique email from nombre + timestamp
    const cleanNombre = nombre.trim();
    const fakeEmail = `${cleanNombre.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}@mp.chambatina.com`;

    const user = await db.marketplaceUser.create({
      data: {
        nombre: cleanNombre,
        email: fakeEmail,
        telefono: contacto?.trim() || null,
      },
    });

    const listing = await db.marketplaceListing.create({
      data: {
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion?.trim()?.substring(0, 1000) || null,
        categoria: categoria || 'general',
        ciudad: ciudad?.trim() || null,
        precio: precio?.trim() || null,
        contacto: contacto?.trim() || null,
        imagenUrl: imagenUrl?.trim() || (Array.isArray(imagenUrls) && imagenUrls.length > 0 ? imagenUrls[0] : null),
        imagenUrls: Array.isArray(imagenUrls) && imagenUrls.length > 0 ? JSON.stringify(imagenUrls.slice(0, 3)) : null,
        userId: user.id,
      },
      include: { user: { select: { id: true, nombre: true, direccion: true } } },
    });

    return NextResponse.json({ ok: true, data: listing }, { status: 201 });
  } catch (error) {
    console.error('[Servicios] Error creating:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear publicacion' }, { status: 500 });
  }
}
