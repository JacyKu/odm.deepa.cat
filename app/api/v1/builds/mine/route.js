import { NextResponse } from 'next/server';
import { listBuildsByUser, getFavouriteState } from '../../../../../lib/sts-builds';
import { getDiscordUser } from '../../../../../lib/session';
import { getBuildTokenVersion } from '../../../../_src/utils/builder/buildUrlCodec';

export async function GET() {
    const user = await getDiscordUser();
    if (!user) {
        return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    }
    const builds = listBuildsByUser(user.id).map((b) => ({
        id: b.id,
        name: b.name || null,
        notes: b.notes || null,
        token: b.token,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        state: b.parsedState,
        isPublic: b.is_public === 1,
        anonymous: b.anonymous === 1,
        favouriteCount: getFavouriteState(b.id, user.id).count,
        url: `/b/v${getBuildTokenVersion(b.token) ?? ''}/${b.id}`,
    }));
    return NextResponse.json({ builds });
}
