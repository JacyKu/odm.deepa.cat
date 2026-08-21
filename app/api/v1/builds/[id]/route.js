import { NextResponse } from 'next/server';
import { getBuild, updateBuild, updateBuildState, deleteBuild } from '../../../../../lib/sts-builds';
import { getDiscordUser } from '../../../../../lib/session';
import { decodeBuildParam } from '../../../../_src/utils/builder/buildUrlCodec';
import { getItemData } from '../../../../_src/utils/itemsData';

export async function GET(request, { params }) {
    const p = await params;
    const row = getBuild(p.id);
    if (!row) {
        return NextResponse.json({ error: 'build not found' }, { status: 404 });
    }

    // Keep the redirect working from both deepa.cat/sts/... and sts.deepa.cat/...
    const hostname = new URL(request.url).hostname.split('.');
    const base = hostname.length > 2 ? '' : '/sts';

    return NextResponse.redirect(new URL(base + '/builder/' + encodeURIComponent(row.token), request.url));
}

export async function PATCH(request, { params }) {
    const p = await params;
    const user = await getDiscordUser();
    const body = await request.json().catch(() => null);

    // Editing a saved build keeps the same link: the state (token + infusions
    // + revelation) is written in place. Only the owner of an owned row, or
    // the creator (cookie) of an anonymous row, may do this — anyone else
    // gets a 403 so the client forks into a new build instead of overwriting
    // someone else's.
    if (body?.state) {
        const token = typeof body.state.token === 'string' ? body.state.token : '';
        if (!token || token.length > 2048) {
            return NextResponse.json({ error: 'invalid token' }, { status: 400 });
        }
        const itemData = await getItemData();
        if (!decodeBuildParam(token, itemData)) {
            return NextResponse.json({ error: 'invalid build' }, { status: 400 });
        }
        const update = {
            state: {
                token,
                infusions: body.state.infusions && typeof body.state.infusions === 'object' ? body.state.infusions : {},
                revelation: Boolean(body.state.revelation),
            },
        };
        if (body.name !== undefined && body.name !== null) {
            const name = typeof body.name === 'string' ? body.name.trim() : '';
            if (!name) return NextResponse.json({ error: 'invalid name' }, { status: 400 });
            update.name = name;
        }
        if (body.notes !== undefined && body.notes !== null) {
            update.notes = typeof body.notes === 'string' ? body.notes : '';
        }
        const creatorToken = request.cookies.get(`sts-build-owner-${p.id}`)?.value || null;
        if (!updateBuildState(p.id, user ? user.id : null, creatorToken, update)) {
            return NextResponse.json({ error: 'build not found or not yours' }, { status: 403 });
        }
        return NextResponse.json({ ok: true });
    }

    // Metadata-only update (name / notes) stays owner-only.
    if (!user) {
        return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    }
    const update = {};
    if (body?.name !== undefined) {
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name) {
            return NextResponse.json({ error: 'invalid name' }, { status: 400 });
        }
        update.name = name;
    }
    if (body?.notes !== undefined) {
        update.notes = typeof body.notes === 'string' ? body.notes : '';
    }
    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    }

    if (!updateBuild(p.id, user.id, update)) {
        return NextResponse.json({ error: 'build not found or not yours' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
    const p = await params;
    const user = await getDiscordUser();
    if (!user) {
        return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    }
    if (!deleteBuild(p.id, user.id)) {
        return NextResponse.json({ error: 'build not found or not yours' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
}
