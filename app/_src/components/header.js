'use client';

import React from 'react';
import LanguageSelector from './languageSelector';
import TranslatableText from './translatableText';
import styles from '../styles/Header.module.css';
import Link from 'next/link';
import { getStsBase } from '../utils/base';
import { useLowResource } from './lowResourceContext';

function getPreferredTheme() {
    if (typeof window === 'undefined') return 'dark';
    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {
        // ignore
    }
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
}

const FONT_ORDER = ['ubuntu', 'minecraft', 'default'];
const FONT_LABELS = { ubuntu: 'Default', minecraft: 'Minecraft', default: 'Legacy' };

export default function Header() {
    const [theme, setTheme] = React.useState('dark');
    const [font, setFont] = React.useState('ubuntu');
    const [base, setBase] = React.useState('/sts');
    const { lowRes, toggle: toggleLowRes } = useLowResource();

    React.useEffect(() => {
        const current = document.documentElement.dataset.theme;
        if (current === 'light' || current === 'dark') {
            setTheme(current);
        } else {
            const preferred = getPreferredTheme();
            document.documentElement.dataset.theme = preferred;
            setTheme(preferred);
        }
        const storedFont = (() => {
            try {
                return localStorage.getItem('font');
            } catch (e) {
                return null;
            }
        })();
        if (FONT_ORDER.includes(storedFont)) {
            document.documentElement.dataset.font = storedFont;
            setFont(storedFont);
        }
        setBase(getStsBase());
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = nextTheme;
        setTheme(nextTheme);
        try {
            localStorage.setItem('theme', nextTheme);
        } catch (e) {
            // ignore
        }
    };

    const toggleFont = () => {
        const nextIndex = (FONT_ORDER.indexOf(font) + 1) % FONT_ORDER.length;
        const nextFont = FONT_ORDER[nextIndex];
        document.documentElement.dataset.font = nextFont;
        setFont(nextFont);
        try {
            localStorage.setItem('font', nextFont);
        } catch (e) {
            // ignore
        }
    };

    const nextFont = FONT_ORDER[(FONT_ORDER.indexOf(font) + 1) % FONT_ORDER.length];

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <div className={styles.left}>
                    <TranslatableText
                        identifier="header.selector.language"
                        className={styles.languageLabel}
                    ></TranslatableText>
                    <LanguageSelector className={styles.languageSelect} />
                </div>

                <nav className={styles.nav} aria-label="Primary">
                    <Link className={styles.navButton} href={base + '/items'}>
                        <TranslatableText identifier="index.pages.items.title" />
                    </Link>
                    <Link className={styles.navButton} href={base + '/builder'}>
                        <TranslatableText identifier="index.pages.builder.title" />
                    </Link>
                </nav>

                <div className={styles.right}>
                    <button
                        type="button"
                        className={styles.themeToggle}
                        onClick={toggleLowRes}
                        aria-label="Toggle low resource mode"
                        aria-pressed={lowRes}
                        title={lowRes ? 'Low resource mode on: item images hidden' : 'Low resource mode off'}
                    >
                        {lowRes ? 'Low res' : 'HD'}
                    </button>
                    <button
                        type="button"
                        className={styles.fontToggle}
                        onClick={toggleFont}
                        aria-label={`Font: ${FONT_LABELS[font]}`}
                        title={`Switch to ${FONT_LABELS[nextFont]} font`}
                    >
                        {FONT_LABELS[nextFont]}
                    </button>
                    <button
                        type="button"
                        className={styles.themeToggle}
                        onClick={toggleTheme}
                        aria-label="Toggle light/dark theme"
                        aria-pressed={theme === 'light'}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        {theme === 'dark' ? 'Light' : 'Dark'}
                    </button>
                </div>
            </div>
        </header>
    );
}
