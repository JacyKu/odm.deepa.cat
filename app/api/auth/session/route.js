import { NextResponse } from 'next/server';
import { getDiscordUser, discordAvatarUrl } from '../../../../lib/session';

export async function GET() {
    const user = await getDiscordUser();
    return NextResponse.json({
        user: user
            ? {
                  id: user.id,
                  username: user.username,
                  globalName: user.globalName,
                  avatarUrl: discordAvatarUrl(user),
              }
            : null,
    });
}
