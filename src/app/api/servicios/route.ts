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
    const userId = searchParams.get('userId');

    const where: any = { activo: true };
    if (tipo && TIPOS_VALIDOS.includes(tipo as any)) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (userId) where.userId = parseInt(userId);
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
    const { tipo, titulo, descripcion, categoria, ciudad, precio, contacto, imagenUrl, imagenUrls, userId } = body;

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ ok: false, error: 'Debes iniciar sesion' }, { status: 401 });
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

    const user = await db.marketplaceUser.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

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
        userId,
      },
      include: { user: { select: { id: true, nombre: true, direccion: true } } },
    });

    return NextResponse.json({ ok: true, data: listing }, { status: 201 });
  } catch (error) {
    console.error('[Servicios] Error creating:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear publicacion' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json({ ok: false, error: 'ID y userId requeridos' }, { status: 400 });
    }

    const existing = await db.marketplaceListing.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Publicacion no encontrada' }, { status: 404 });
    }

    const updateData: any = {};
    if (fields.titulo !== undefined) updateData.titulo = fields.titulo.trim().substring(0, 120);
    if (fields.descripcion !== undefined) updateData.descripcion = fields.descripcion?.trim()?.substring(0, 1000) || null;
    if (fields.categoria !== undefined) updateData.categoria = fields.categoria || 'general';
    if (fields.ciudad !== undefined) updateData.ciudad = fields.ciudad?.trim() || null;
    if (fields.precio !== undefined) updateData.precio = fields.precio?.trim() || null;
    if (fields.contacto !== undefined) updateData.contacto = fields.contacto?.trim() || null;
    if (fields.imagenUrl !== undefined) updateData.imagenUrl = typeof fields.imagenUrl === 'string' ? fields.imagenUrl.trim() || null : null;
    if (fields.imagenUrls !== undefined) {
      if (Array.isArray(fields.imagenUrls) && fields.imagenUrls.length > 0) {
        updateData.imagenUrls = JSON.stringify(fields.imagenUrls.slice(0, 3));
        updateData.imagenUrl = fields.imagenUrls[0];
      } else {
        updateData.imagenUrls = null;
      }
    }
    if (fields.tipo !== undefined && TIPOS_VALIDOS.includes(fields.tipo)) updateData.tipo = fields.tipo;

    const updated = await db.marketplaceListing.update({
      where: { id },
      data: updateData,
      include: { user: { select: { id: true, nombre: true, direccion: true } } },
    });

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Servicios] Error updating:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');
    const userId = parseInt(searchParams.get('userId') || '0');

    if (!id || !userId) {
      return NextResponse.json({ ok: false, error: 'ID y userId requeridos' }, { status: 400 });
    }

    const existing = await db.marketplaceListing.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Publicacion no encontrada' }, { status: 404 });
    }

    await db.marketplaceListing.update({ where: { id }, data: { activo: false } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Servicios] Error deleting:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar' }, { status: 500 });
  }
}
