// Link-preview helpers for the builder (used for og:/twitter: metadata server-side).
import { decodeBuildParam } from './builder/buildUrlCodec';
import CharmShortener from './builder/charmShortener';

function parseCharmPreview(charmValue, itemData) {
    if (!charmValue || charmValue === 'None') return { totalPower: 0, items: [] };
    if (!itemData) return { totalPower: 0, items: [] };

    try {
        const charmKeys = CharmShortener.parseCharmData(String(charmValue), itemData);
        const items = charmKeys
            .map((k) => itemData[k])
            .filter(Boolean)
            .map((c) => {
                const power = Number(c.power);
                return {
                    name: c.name,
                    power: Number.isFinite(power) ? power : null,
                };
            });

        const totalPower = charmKeys
            .map((k) => Number(itemData[k]?.power))
            .filter((p) => Number.isFinite(p))
            .reduce((sum, p) => sum + p, 0);

        return { totalPower, items };
    } catch (e) {
        return { totalPower: 0, items: [] };
    }
}

export function getLinkPreviewData(build, itemData, skillsData) {
    const decoded = decodeBuildParam(build, itemData);
    if (!decoded) return null;

    try {
        const params = new URLSearchParams(decoded);
        const itemKey = (shortKey, fallback = 'None') => params.get(shortKey) || fallback;

        const items = {
            mainhand: itemKey('m'),
            offhand: itemKey('o'),
            helmet: itemKey('h'),
            chestplate: itemKey('c'),
            leggings: itemKey('l'),
            boots: itemKey('b'),
        };

        for (const key of Object.keys(items)) {
            if (!items[key] || !Object.keys(itemData).includes(items[key])) items[key] = 'None';
        }

        const charmValue = params.get('charm') || 'None';
        const charmPreview = parseCharmPreview(charmValue, itemData);

        const nameValue = params.get('name') || null;

        const className = params.get('cl') || null;

        const skills = [];
        const skRaw = params.get('sk');
        if (skRaw) {
            for (const part of skRaw.split(',')) {
                const [id, pts] = part.split(':');
                const points = Number(pts);
                if (id && Number.isInteger(points) && points > 0) skills.push({ id, points });
            }
        }
        const spec = params.get('sp') || null;
        const specSkills = [];
        const sskRaw = params.get('ssk');
        if (sskRaw) {
            for (const part of sskRaw.split(',')) {
                const [id, pts] = part.split(':');
                const points = Number(pts);
                if (id && Number.isInteger(points) && points > 0) specSkills.push({ id, points });
            }
        }
        const enhancements = [];
        const enRaw = params.get('en');
        if (enRaw) {
            for (const key of enRaw.split(',')) {
                if (key) enhancements.push(key);
            }
        }
        // resolve display names from the skills data when available
        if (skillsData && Array.isArray(skillsData.classes)) {
            const classData = className
                ? skillsData.classes.find((c) => (c.className || '').toLowerCase() == className.toLowerCase())
                : null;
            for (const skill of skills) {
                const match = classData ? classData.skills.find((s) => s.scoreboardId == skill.id) : null;
                if (match) {
                    skill.name = match.displayName;
                    skill.shortName = match.shortName;
                }
            }
            const specData = classData && spec ? classData.specs?.find((s) => s.specName == spec) : null;
            for (const skill of specSkills) {
                const match = specData ? specData.specSkills.find((s) => s.scoreboardId == skill.id) : null;
                if (match) {
                    skill.name = match.displayName;
                    skill.shortName = match.shortName;
                }
            }
            for (let i = 0; i < enhancements.length; i++) {
                const id = enhancements[i];
                const match = classData ? classData.skills.find((s) => s.scoreboardId == id) : null;
                enhancements[i] = { id, name: match ? match.displayName : id };
            }
        }

        return {
            name: nameValue ? decodeURIComponent(nameValue) : null,
            items,
            charms: charmPreview,
            className,
            skills,
            spec,
            specSkills,
            enhancements,
        };
    } catch (e) {
        return null;
    }
}

export function getLinkPreviewDescription(build, itemData, skillsData) {
    const data = getLinkPreviewData(build, itemData, skillsData);
    if (!data) return '';

    const i = data.items;

    const formatItem = (itemKey) => {
        if (!itemKey || itemKey === 'None') return 'None';
        const displayName = itemData?.[itemKey]?.name || itemKey;
        return displayName;
    };

    const wrapCharmList = (prefix, charmItems, maxLen) => {
        if (!charmItems || charmItems.length === 0) return '🧿 Charms: None';

        const lines = [];
        let current = prefix;

        for (const charm of charmItems) {
            const charmText = charm.power != null ? `${charm.name} ${charm.power}★` : charm.name;
            const addition = (current === prefix ? '' : ', ') + charmText;
            if (current.length + addition.length > maxLen && current !== prefix) {
                lines.push(current);
                current = charmText;
            } else {
                current += addition;
            }
        }

        if (current) lines.push(current);
        return lines.join('\n');
    };

    const charmInline = wrapCharmList(`🧿 Charms (${data.charms.totalPower}★): `, data.charms.items, 90);

    // The card image already shows class/spec/skills; the text keeps only gear + charms.
    const EMOJI = {
        mainhand: '⚔️',
        offhand: '🛡️',
        helmet: '🪖',
        chestplate: '🦺',
        leggings: '👖',
        boots: '🥾',
    };

    const parts = [
        `${EMOJI.mainhand} ${formatItem(i.mainhand)}`,
        `${EMOJI.offhand} ${formatItem(i.offhand)}`,
        `${EMOJI.helmet} ${formatItem(i.helmet)}`,
        `${EMOJI.chestplate} ${formatItem(i.chestplate)}`,
        `${EMOJI.leggings} ${formatItem(i.leggings)}`,
        `${EMOJI.boots} ${formatItem(i.boots)}`,
        charmInline,
    ];

    // Discord renders newlines in embed descriptions.
    return parts.join('\n');
}

export function getLinkPreviewTitle(build, itemData, buildName) {
    const data = getLinkPreviewData(build, itemData);
    const name = data?.name || (buildName && buildName !== 'Monumenta Builder' ? buildName : null);
    return (name ? name + ' - ' : '') + 'Monumenta Builder';
}
