import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getBuild } from '../../../lib/sts-builds';
import { getDiscordUser } from '../../../lib/session';
import { getItemData, getSkillsData } from '../utils/itemsData';
import { getLinkPreviewTitle, getLinkPreviewDescription } from '../utils/buildPreview';
import BuilderPage from './builderPage';
import { stsBaseForHost } from '../utils/base';

export const dynamic = 'force-dynamic';

const keywords = 'Monumenta, Minecraft, MMORPG, Items, Builder';

// Shared metadata + page for /b/<id> and /b/v<version>/<id>. The version
// segment is informational (the token carries its own version byte); we just
// check it looks like "v<digits>" and prefer the canonical form when the
// stored token disagrees.
export async function buildLinkMetadata(id) {
    const row = getBuild(id);
    if (!row) {
        return { title: 'Monumenta Builder' };
    }

    const headersList = await headers();
    const requestHost = headersList.get('host') || 'deepa.cat';
    const [itemData, skillsData] = await Promise.all([getItemData(), getSkillsData()]);
    const title = row.name || getLinkPreviewTitle(row.token, itemData, null, skillsData);
    const description = getLinkPreviewDescription(row.token, itemData, skillsData, row.parsedState?.infusions);
    // The DB-backed image carries the delve infusions, which the token alone can't.
    const imageUrl = '/api/v1/og?id=' + id;

    return {
        metadataBase: new URL('https://' + requestHost),
        title,
        description,
        keywords,
        openGraph: {
            siteName: 'SPARE THE SYMPATHY',
            type: 'website',
            title,
            description,
            images: [{ url: imageUrl, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export async function BuildLinkPageView(id) {
    const row = getBuild(id);

    const headersList = await headers();
    const base = stsBaseForHost(headersList.get('host') || '');

    if (!row) {
        redirect(base + '/builder');
    }

    const itemData = await getItemData();
    // The build opens in place; saves update the DB row, they don't rewrite URLs.
    const user = await getDiscordUser();
    return (
        <BuilderPage
            build={row.token}
            itemData={itemData}
            savedState={row.parsedState}
            savedName={row.name}
            notes={row.notes}
            canEditNotes={Boolean(user && row.user_id && user.id === row.user_id)}
            buildId={id}
        />
    );
}
