import { redirect } from 'next/navigation';
import { buildLinkMetadata, BuildLinkPageView } from '../../_src/components/buildLinkPage';
import { stsBaseForHost } from '../../_src/utils/base';
import { headers } from 'next/headers';

// Short links: /b/<id> (legacy) and /b/v<version>/<id>. The token itself
// carries the real version byte; the URL segment just states what the link
// was minted with.
export const dynamic = 'force-dynamic';

function parseSlug(slug) {
    if (!slug || slug.length === 0) return null;
    const [first, second] = slug;
    // Versioned form: /b/v6/<id>
    if (/^v\d+$/.test(first) && second) {
        return { version: first, id: second };
    }
    // Legacy form: /b/<id>
    if (slug.length === 1) {
        return { version: null, id: first };
    }
    return null;
}

export async function generateMetadata({ params }) {
    const p = await params;
    const parsed = parseSlug(p.slug);
    if (!parsed) {
        return { title: 'Monumenta Builder' };
    }
    return buildLinkMetadata(parsed.id);
}

export default async function BuildLinkPage({ params }) {
    const p = await params;
    const parsed = parseSlug(p.slug);

    const headersList = await headers();
    const base = stsBaseForHost(headersList.get('host') || '');

    if (!parsed) {
        redirect(base + '/builder');
    }
    return BuildLinkPageView(parsed.id);
}
