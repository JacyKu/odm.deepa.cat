'use client';

import React from 'react';
import { getApps } from './apps.js';
import styles from './SiteNav.module.css';

// The top site nav shared by the platform and STS apps. App links come from
// the shared app registry so adding an app updates every app's nav.
export default function SiteNav({ showBeta }) {
    const apps = getApps();
    const [betaOpen, setBetaOpen] = React.useState(false);

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
                {showBeta && (
                    <button
                        type="button"
                        className={styles.betaPill}
                        onClick={() => setBetaOpen(true)}
                        title="This refactor is in public beta"
                    >
                        Public Beta
                    </button>
                )}
            </div>

            {betaOpen && (
                <div className={styles.betaOverlay} onClick={() => setBetaOpen(false)}>
                    <div
                        className={styles.betaDialog}
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <p>This refactor is in public beta, bugs will occur and stats might be miscalculated.</p>
                        <p>It should not yet be used as a replacement for Ode to Misery.</p>
                        <p>
                            Please report issues or feature requests on{' '}
                            <a
                                href="https://github.com/JacyKu/sts.deepa.cat/issues"
                                target="_blank"
                                rel="noreferrer"
                                className={styles.betaLink}
                            >
                                GitHub
                            </a>
                            .
                        </p>
                        <div className={styles.betaCloseRow}>
                            <button type="button" className={styles.betaClose} onClick={() => setBetaOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
