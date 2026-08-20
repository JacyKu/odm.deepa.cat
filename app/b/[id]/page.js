import { buildLinkMetadata, BuildLinkPageView } from '../../_src/components/buildLinkPage';

// Legacy short links (no version segment). Kept working forever; new links
// use /b/v<version>/<id>.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const p = await params;
    return buildLinkMetadata(p.id);
}

export default async function BuildLinkPage({ params }) {
    const p = await params;
    return BuildLinkPageView(p.id);
}
