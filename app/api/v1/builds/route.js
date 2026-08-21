import { NextResponse } from 'next/server';
import { saveBuild } from '../../../../lib/sts-builds';
import { decodeBuildParam, getBuildTokenVersion } from '../../../_src/utils/builder/buildUrlCodec';
import { getItemData } from '../../../_src/utils/itemsData';
import { getDiscordUser } from '../../../../lib/session';

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const token = body?.token;
    if (!token || typeof token !== 'string' || token.length > 2048) {
        return NextResponse.json({ error: 'invalid token' }, { status: 400 });
    }

    // Reject strings that don't decode to a build.
    const itemData = await getItemData();
    if (!decodeBuildParam(token, itemData)) {
        return NextResponse.json({ error: 'invalid build' }, { status: 400 });
    }

    const user = await getDiscordUser();
    const state = {
        token,
        infusions: body.infusions && typeof body.infusions === 'object' ? body.infusions : {},
        revelation: Boolean(body.revelation),
    };
    const result = saveBuild({
        state,
        userId: user ? user.id : null,
        name: body.name || null,
        // Notes are a signed-in feature: anonymous saves never carry them.
        notes: user ? body.notes || null : null,
    });
    if (!result) {
        return NextResponse.json({ error: 'invalid build' }, { status: 400 });
    }
    const tokenVersion = getBuildTokenVersion(token) ?? '';
    const res = NextResponse.json({
        id: result.id,
        isNew: result.isNew,
        savedToAccount: Boolean(user),
        url: `/b/v${tokenVersion}/${result.id}`,
    });
    // Anonymous rows are editable in place only by the browser that created
    // them: hand out the creator token as an httpOnly cookie. (Set manually:
    // NextResponse.cookies.set is dropped by the dev server in Next 16.)
    if (!user && result.creatorToken) {
        const parts = [
            `sts-build-owner-${result.id}=${result.creatorToken}`,
            'Path=/',
            'HttpOnly',
            'SameSite=Lax',
            'Max-Age=31536000',
        ];
        if (process.env.NODE_ENV === 'production') parts.push('Secure');
        res.headers.set('Set-Cookie', parts.join('; '));
    }
    return res;
}
