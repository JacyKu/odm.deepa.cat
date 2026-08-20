import { buildLinkMetadata, BuildLinkPageView } from '../../../_src/components/buildLinkPage';

// Versioned short links: /b/v6/<id> etc. The token itself carries the real
// version byte; the URL segment just states what the link was minted with.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const p = await params;
    if (!/^v\d+$/.test(p.v)) {
        return { title: 'Monumenta Builder' };
    }
    return buildLinkMetadata(p.id);
}

export default async function BuildLinkPage({ params }) {
    const p = await params;
    if (!/^v\d+$/.test(p.v)) {
        return BuildLinkPageView(p.id);
    }
    return BuildLinkPageView(p.id);
}
