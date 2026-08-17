import { NextResponse } from 'next/server';
import { getBuild } from '../../../../../lib/sts-builds';

export async function GET(request, { params }) {
    const p = await params;
    const token = getBuild(p.id);
    if (!token) {
        return NextResponse.json({ error: 'build not found' }, { status: 404 });
    }

    // Keep the redirect working from both deepa.cat/sts/... and sts.deepa.cat/...
    const hostname = new URL(request.url).hostname.split('.');
    const base = hostname.length > 2 ? '' : '/sts';

    return NextResponse.redirect(new URL(base + '/builder/' + encodeURIComponent(token), request.url));
}
