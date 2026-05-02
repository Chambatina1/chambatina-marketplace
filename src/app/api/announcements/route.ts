import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const ann = await db.marketplaceAnnouncement.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, data: ann });
  } catch (error) {
    console.error('[Announcement] Error:', error);
    return NextResponse.json({ ok: false, error: 'Error' }, { status: 500 });
  }
}
