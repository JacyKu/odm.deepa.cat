import { NextResponse } from 'next/server';

export function proxy(request) {
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0].toLowerCase();

    globalThis.__deepaOdmBase = hostname ? '' : '';

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next|api|favicon.ico).*)'],
};
