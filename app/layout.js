import { headers } from 'next/headers';
import './globals.css';
import { LanguageContextProvider } from './_src/components/languageContext';
import Header from './_src/components/header';
import Footer from './_src/components/footer';
import SiteNav from '@deepa/shared/site-nav';

export const metadata = {
    title: {
        default: 'Ode to Misery',
        template: '%s - Ode to Misery',
    },
    description: 'Monumenta Items and Builds',
    metadataBase: new URL('https://odm.deepa.cat'),
    icons: { icon: '/favicon/favicon.ico' },
    openGraph: {
        siteName: 'Ode to Misery',
        type: 'website',
        title: 'Ode to Misery',
        description: 'Monumenta Items and Builds',
        images: [{ url: '/favicon/favicon.png' }],
    },
    twitter: {
        card: 'summary',
        title: 'Ode to Misery',
        description: 'Monumenta Items and Builds',
        images: ['/favicon/favicon.png'],
    },
};

export default async function OdmLayout({ children }) {
    const headersList = await headers();
    const host = headersList.get('host') || '';
    const base = host ? '' : '';

    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <SiteNav />
                <link rel="stylesheet" href={base + '/spritesheets/_minecraft.css'} />
                <link rel="stylesheet" href={base + '/spritesheets/_itemsheet.css'} />
                <link rel="stylesheet" href={base + '/spritesheets/_charmsheet.css'} />
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css"
                    integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor"
                    crossOrigin="anonymous"
                />
                <div className="site-content" id="top">
                    <LanguageContextProvider>
                        <Header />
                        {children}
                        <Footer />
                    </LanguageContextProvider>
                </div>
            </body>
        </html>
    );
}
