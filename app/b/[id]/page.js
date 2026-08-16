import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getBuild } from '../../../lib/odm-builds';
import { getItemData, getSkillsData } from '../../_src/utils/itemsData';
import { getLinkPreviewTitle, getLinkPreviewDescription } from '../../_src/utils/buildPreview';
import BuilderPage from '../../_src/components/builderPage';
import { odmBaseForHost } from '../../_src/utils/base';

export const dynamic = 'force-dynamic';

const keywords = 'Monumenta, Minecraft, MMORPG, Items, Builder';

export async function generateMetadata({ params }) {
    const p = await params;
    const build = getBuild(p.id);
    if (!build) {
        return { title: 'Monumenta Builder' };
    }

    const headersList = await headers();
    const requestHost = headersList.get('host') || 'deepa.cat';
    const [itemData, skillsData] = await Promise.all([getItemData(), getSkillsData()]);
    const title = getLinkPreviewTitle(build, itemData, null, skillsData);
    const description = getLinkPreviewDescription(build, itemData, skillsData);
    const imageUrl = '/api/v1/og?build=' + encodeURIComponent(build);

    return {
        metadataBase: new URL('https://' + requestHost),
        title,
        description,
        keywords,
        openGraph: {
            siteName: 'ODE TO MISERY',
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

export default async function BuildLinkPage({ params }) {
    const p = await params;
    const build = getBuild(p.id);

    const headersList = await headers();
    const base = odmBaseForHost(headersList.get('host') || '');

    if (!build) {
        redirect(base + '/builder');
    }

    const itemData = await getItemData();
    // The build opens in place; only edits rewrite the URL to the canonical token form.
    return <BuilderPage build={build} itemData={itemData} />;
}
