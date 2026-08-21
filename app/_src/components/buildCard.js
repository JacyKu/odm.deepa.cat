'use client';

import React from 'react';
import Link from 'next/link';
import TranslatableText from './translatableText';
import styles from '../styles/Database.module.css';

// One build card in the public database / favourites grid.
export default function BuildCard({ build, user, base, onToggleFavourite }) {
    const [favBusy, setFavBusy] = React.useState(false);

    function avatarUrl(id, avatar) {
        if (!id || !avatar) return null;
        return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=32`;
    }

    function toggleFavourite(event) {
        event.preventDefault();
        event.stopPropagation();
        if (favBusy) return;
        if (!user) {
            window.location.href = `/api/auth/discord/login?next=${encodeURIComponent(window.location.pathname)}`;
            return;
        }
        setFavBusy(true);
        fetch(`/api/v1/builds/${build.id}/favourite`, {
            method: build.myFavourite ? 'DELETE' : 'POST',
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then(() => onToggleFavourite && onToggleFavourite(build.id, !build.myFavourite))
            .catch(() => {})
            .finally(() => setFavBusy(false));
    }

    const displayName = build.name || 'Unnamed build';
    const avatar = avatarUrl(build.authorId, build.authorAvatar);

    let skills = [];
    if (build.skillsJson || build.skills_json) {
        try {
            const parsed = JSON.parse(build.skillsJson || build.skills_json);
            skills = (Array.isArray(parsed) ? parsed : []).map((s) => {
                if (typeof s === 'string') {
                    // Legacy rows stored plain skill names — abbreviate them.
                    const words = s.split(/\s+/).filter(Boolean);
                    const n =
                        words.length >= 2
                            ? (words[0][0] + words[1][0]).toUpperCase()
                            : (words[0] || '?')[0].toUpperCase();
                    return { n, f: s, g: 'b', e: 0 };
                }
                return s;
            });
        } catch (e) {
            skills = [];
        }
    }

    // Embed chip colors: base / spec / enhanced / CZ rarity (common->twisted).
    const SKILL_COLORS = { b: '#C084FC', s: '#7CC4FF' };
    const CZ_RARITY_COLORS = ['#9f929c', '#70bc6d', '#705eca', '#cd5eca', '#e49b20', '#703663'];
    const CZ_RARITY_NAMES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Twisted'];
    const skillColor = (s) =>
        s.g === 'c'
            ? CZ_RARITY_COLORS[s.r] || CZ_RARITY_COLORS[0]
            : s.e
              ? '#7EE787'
              : SKILL_COLORS[s.g] || SKILL_COLORS.b;
    const czIcon = (s) =>
        `${base}/images/cz/${String(s.f || s.n)
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/'/g, '')}.png`;
    const skillIcon = (s) =>
        `${base}/images/skills/${String(s.f || s.n)
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/'/g, '')}.png`;
    const treeIcon = (t) =>
        `${base}/images/cz/${String(t)
            .toLowerCase()
            .replace(/ /g, '_')
            .replace(/'/g, '')}.png`;

    return (
        <Link href={base + build.url} className={styles.card}>
            <div className={styles.cardTop}>
                <div className={styles.cardTitle} title={displayName}>
                    {displayName}
                </div>
                <button
                    type="button"
                    className={`${styles.favBtn}${build.myFavourite ? ` ${styles.favBtnOn}` : ''}`}
                    onClick={toggleFavourite}
                    title={
                        build.myFavourite
                            ? 'Remove from favourites'
                            : user
                              ? 'Add to favourites'
                              : 'Log in to favourite'
                    }
                    aria-label="Toggle favourite"
                >
                    <svg viewBox="0 0 512 512" width="15" height="15" aria-hidden="true">
                        <path
                            fill={build.myFavourite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="36"
                            d="M47.6 300.4 228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96.5 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"
                        />
                    </svg>
                    <span className={styles.favCount}>{build.favouriteCount || 0}</span>
                </button>
            </div>

            <div className={styles.cardTags}>
                {build.class && (
                    <span className={styles.classTag} style={{ color: 'var(--accent, #9C59D1)' }}>
                        <img
                            className={styles.classIcon}
                            src={`${base}/images/classes/${build.class.toLowerCase()}.png`}
                            alt=""
                            width={24}
                            height={24}
                        />
                        {build.class}
                        {build.spec && (
                            <>
                                <span className={styles.tagSep}>·</span>
                                <img
                                    className={styles.classIcon}
                                    src={`${base}/images/classes/${build.spec.toLowerCase()}.png`}
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                {build.spec}
                            </>
                        )}
                    </span>
                )}
                {!build.class && build.spec && <span className={styles.tag}>{build.spec}</span>}
                {build.region && <span className={styles.tag}>{build.region}</span>}
                {build.masterworkCount > 0 && (
                    <span className={styles.tag}>✦ {build.masterworkCount}</span>
                )}
                {build.tree && (
                    <span className={styles.classTag}>
                        <img
                            className={styles.classIcon}
                            src={treeIcon(build.tree)}
                            alt=""
                            width={26}
                            height={26}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        {build.tree}
                    </span>
                )}
            </div>

            {skills.length > 0 && (
                <div className={styles.skillsRow}>
                    {skills.map((s, i) => (
                        <span
                            key={i}
                            className={styles.skillChip}
                            title={s.g === 'c' ? `${s.f} · ${CZ_RARITY_NAMES[s.r] || ''}`.trim() : s.f}
                            style={{ color: skillColor(s) }}
                        >
                            {s.g === 'c' ? (
                                <img
                                    className={styles.classIcon}
                                    src={czIcon(s)}
                                    alt=""
                                    width={24}
                                    height={24}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <img
                                    className={styles.classIcon}
                                    src={skillIcon(s)}
                                    alt=""
                                    width={24}
                                    height={24}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                            <span className={styles.skillAbbr}>{s.n}</span>
                            {Number(s.p) > 0 && (
                                <span className={styles.skillPoints}>
                                    {s.p}
                                    {s.e ? '*' : ''}
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            )}

            <div className={styles.cardMeta}>
                {build.ascension > 0 && (
                    <span className={styles.metaItem}>Ascension {build.ascension}</span>
                )}
            </div>

            <div className={styles.cardBottom}>
                <span className={styles.author} title={build.authorName || 'Anonymous'}>
                    {avatar && <img className={styles.avatar} src={avatar} alt="" width={18} height={18} />}
                    {build.authorName || <TranslatableText identifier="database.anonymous" />}
                </span>
                <span className={styles.date}>
                    {new Date((build.updatedAt || build.createdAt) + 'Z').toLocaleDateString()}
                </span>
            </div>
        </Link>
    );
}
