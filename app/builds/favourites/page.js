import FavouritesPage from '../../_src/components/favouritesPage';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Favourites',
    description: 'Your favourited Monumenta builds',
};

export default function MyFavouritesPage() {
    return <FavouritesPage />;
}
