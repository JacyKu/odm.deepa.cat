import BuildsPage from '../_src/components/buildsPage';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'My Builds',
    description: 'Your saved Monumenta builds',
};

export default function MyBuildsPage() {
    return <BuildsPage />;
}
