import { NextResponse } from 'next/server';
import { getBuild } from '../../../../../lib/odm-builds';

export async function GET(request, { params }) {
  const p = await params;
  const token = getBuild(p.id);
  if (!token) {
    return NextResponse.json({ error: 'build not found' }, { status: 404 });
  }

  // Keep the redirect working from both deepa.cat/odm/... and odm.deepa.cat/...
  const hostname = new URL(request.url).hostname.split('.');
  const base = hostname.length > 2 ? '' : '/odm';

  return NextResponse.redirect(new URL(base + '/builder/' + encodeURIComponent(token), request.url));
}
