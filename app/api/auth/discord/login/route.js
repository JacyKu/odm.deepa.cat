import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { discordLoginUrl } from '../../../../../lib/session';

export async function GET(request) {
    const nextPath = new URL(request.url).searchParams.get('next') || '/builder';
    const state = crypto.randomBytes(16).toString('hex');

    (await cookies()).set('sts-oauth-state', JSON.stringify({ state, next: nextPath }), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10,
        path: '/',
    });

    const redirectUri = new URL('/api/auth/discord/callback', request.url).toString();
    const url = discordLoginUrl(state, redirectUri);
    return NextResponse.redirect(url);
}
