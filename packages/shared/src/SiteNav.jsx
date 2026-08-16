import { getApps } from './apps.js';
import styles from './SiteNav.module.css';

// The top site nav shared by the platform and ODM apps. App links come from
// the shared app registry so adding an app updates every app's nav.
export default function SiteNav() {
    const apps = getApps();

    return (
        <nav className={styles.nav}>
            <a href="https://deepa.cat" className={styles.brand}>
                deepa.cat
            </a>
            <div className={styles.links}>
                <a href="https://deepa.cat" className={styles.link}>
                    Home
                </a>
                {apps.map((app) => (
                    <a
                        key={app.slug}
                        href={app.subdomain ? `https://${app.subdomain}.deepa.cat` : '/' + app.slug}
                        className={styles.link}
                    >
                        {app.label}
                    </a>
                ))}
            </div>
        </nav>
    );
}
