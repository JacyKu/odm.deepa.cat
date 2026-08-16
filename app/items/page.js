import { Suspense } from 'react';
import { getItemData } from '../_src/utils/itemsData';
import ItemsPage from '../_src/components/itemsPage';
import ItemsSkeleton from '../_src/components/itemsSkeleton';

export const metadata = {
    title: 'Monumenta Items',
    description: 'Monumenta item finder',
    keywords: 'Monumenta, Minecraft, MMORPG, Items, Item Guide',
    openGraph: {
        title: 'Monumenta Items',
        description: 'Monumenta item finder',
        images: [{ url: '/favicon/favicon.png' }],
    },
    twitter: {
        title: 'Monumenta Items',
        description: 'Monumenta item finder',
        images: ['/favicon/favicon.png'],
    },
};

export default function Page() {
    return (
        <Suspense fallback={<ItemsSkeleton />}>
            <ItemsView />
        </Suspense>
    );
}

async function ItemsView() {
    const itemData = await getItemData();
    return <ItemsPage itemData={itemData} />;
}
