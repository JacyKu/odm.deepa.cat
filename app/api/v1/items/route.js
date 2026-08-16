import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'items', 'items.json');
    const raw = await fs.readFile(filePath, 'utf8');
    return new NextResponse(raw, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Unable to read items.json' }, { status: 500 });
  }
}
