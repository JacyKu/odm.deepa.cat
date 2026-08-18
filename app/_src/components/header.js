'use client';

import React from 'react';
import Select from 'react-select';
import TranslatableText from './translatableText';
import LoreToggle from './items/loreToggle';
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
const FONT_STACKS = {
    ubuntu: "'Ubuntu', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    minecraft: "'Minecraft', monospace",
    default:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const selectTheme = (theme) => ({
    ...theme,
    borderRadius: 0,
    colors: {
        ...theme.colors,
        primary: 'var(--text-1)',
        primary25: 'var(--surface-2)',
        neutral0: 'var(--glass-1)',
        neutral5: 'var(--glass-2)',
        neutral10: 'var(--glass-2)',
        neutral20: 'var(--control-border)',
        neutral30: 'var(--control-border-hover)',
        neutral60: 'var(--text-2)',
        neutral80: 'var(--text-1)',
    },
});

const selectStyles = {
    container: (base) => ({ ...base, width: '100%' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
};

function HeaderSelect({ options, value, onChange, instanceId, className, formatOptionLabel }) {
    return (
        <div className={className}>
            <Select
                instanceId={instanceId}
                name={instanceId}
                options={options}
                value={options.find((opt) => opt.value === value)}
                onChange={onChange}
                formatOptionLabel={formatOptionLabel}
                isSearchable={false}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                theme={selectTheme}
                styles={selectStyles}
            />
        </div>
    );
}

// The STS nav links, rendered in the center of the shared SiteNav top bar.
export function HeaderNav() {
    const [base, setBase] = React.useState('/sts');
    React.useEffect(() => {
        setBase(getStsBase());
    }, []);
    return (
        <nav className={styles.nav} aria-label="Primary">
            <Link className={styles.navButton} href={base + '/items'}>
                <TranslatableText identifier="index.pages.items.title" />
            </Link>
            <Link className={styles.navButton} href={base + '/builder'}>
                <TranslatableText identifier="index.pages.builder.title" />
            </Link>
        </nav>
    );
}

// The STS app settings, rendered on the right side of the shared SiteNav bar.
export default function Header() {
    const [theme, setTheme] = React.useState('dark');
    const [font, setFont] = React.useState('ubuntu');
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
    }, []);

    const setThemeValue = (nextTheme) => {
        document.documentElement.dataset.theme = nextTheme;
        setTheme(nextTheme);
        try {
            localStorage.setItem('theme', nextTheme);
        } catch (e) {
            // ignore
        }
    };

    const setFontValue = (nextFont) => {
        document.documentElement.dataset.font = nextFont;
        setFont(nextFont);
        try {
            localStorage.setItem('font', nextFont);
        } catch (e) {
            // ignore
        }
    };

    const fontOptions = FONT_ORDER.map((value) => ({
        value,
        label: FONT_LABELS[value],
        fontFamily: FONT_STACKS[value],
    }));
    const themeOptions = [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
    ];

    return (
        <div className={styles.controls}>
            <label className={`${styles.toggle} ${styles.loreToggle}`}>
                <input type="checkbox" checked={lowRes} onChange={toggleLowRes} aria-label="Hide textures" />
                Hide Textures
            </label>
            <LoreToggle className={styles.loreToggle} />
            <HeaderSelect
                instanceId="font"
                options={fontOptions}
                value={font}
                onChange={(option) => setFontValue(option.value)}
                formatOptionLabel={({ label, fontFamily }, { context }) =>
                    context === 'menu' && fontFamily ? <span style={{ fontFamily }}>{label}</span> : label
                }
                className={styles.fontSelect}
            />
            <HeaderSelect
                instanceId="theme"
                options={themeOptions}
                value={theme}
                onChange={(option) => setThemeValue(option.value)}
                className={styles.themeSelect}
            />
        </div>
    );
}
