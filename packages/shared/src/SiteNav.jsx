'use client';

import React from 'react';
import styles from './SiteNav.module.css';

// The single top bar shared by the platform and STS apps. The deepa.cat brand
// acts as the home button; app-specific nav links render via `center` and
// settings render via `children` on the right side.
export default function SiteNav({ showBeta, center, children }) {
    const [betaOpen, setBetaOpen] = React.useState(false);

    return (
        <nav className={styles.nav}>
            <div className={styles.left}>
                <a href="https://deepa.cat" className={styles.brand}>
                    deepa.cat
                </a>
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
            <div className={styles.center}>{center}</div>
            <div className={styles.right}>{children}</div>

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
