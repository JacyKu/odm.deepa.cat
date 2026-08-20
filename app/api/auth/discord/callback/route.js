import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeDiscordCode, getSession, discordRedirectUri } from '../../../../../lib/session';

export async function GET(request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const redirectUri = discordRedirectUri(request.url);

    const cookieStore = await cookies();
    const stored = cookieStore.get('sts-oauth-state');
    let nextPath = '/builder';
    if (stored) {
        try {
            const parsed = JSON.parse(stored.value);
            if (!state || parsed.state !== state) {
                return NextResponse.redirect(new URL('/builder?login=failed', request.url));
            }
            nextPath = typeof parsed.next === 'string' ? parsed.next : '/builder';
        } catch (e) {
            return NextResponse.redirect(new URL('/builder?login=failed', request.url));
        }
    }

    if (!code) {
        return NextResponse.redirect(new URL('/builder?login=failed', request.url));
    }

    try {
        const user = await exchangeDiscordCode(code, redirectUri);
        const session = await getSession();
        session.user = user;
        await session.save();
        cookieStore.delete('sts-oauth-state');
        return NextResponse.redirect(new URL(nextPath, request.url));
    } catch (e) {
        console.error('Discord OAuth callback failed:', e);
        return NextResponse.redirect(new URL('/builder?login=failed', request.url));
    }
}
