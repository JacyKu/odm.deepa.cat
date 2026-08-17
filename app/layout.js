import { headers } from 'next/headers';
import './globals.css';
import { LanguageContextProvider } from './_src/components/languageContext';
import { LowResourceProvider } from './_src/components/lowResourceContext';
import Header from './_src/components/header';
import Footer from './_src/components/footer';
import SiteNav from '@deepa/shared/site-nav';

export const metadata = {
    title: {
        default: 'Spare the Sympathy',
        template: '%s - Spare the Sympathy',
    },
    description: 'Monumenta Items and Builds',
    metadataBase: new URL('https://sts.deepa.cat'),
    icons: { icon: '/favicon/favicon.ico' },
    openGraph: {
        siteName: 'Spare the Sympathy',
        type: 'website',
        title: 'Spare the Sympathy',
        description: 'Monumenta Items and Builds',
        images: [{ url: '/favicon/favicon.png' }],
    },
    twitter: {
        card: 'summary',
        title: 'Spare the Sympathy',
        description: 'Monumenta Items and Builds',
        images: ['/favicon/favicon.png'],
    },
};

export default async function StsLayout({ children }) {
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
                <SiteNav showBeta />
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
                    <LowResourceProvider>
                        <LanguageContextProvider>
                            <Header />
                            {children}
                            <Footer />
                        </LanguageContextProvider>
                    </LowResourceProvider>
                </div>
            </body>
        </html>
    );
}
