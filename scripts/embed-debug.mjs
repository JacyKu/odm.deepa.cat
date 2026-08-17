import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeBuildParam, encodeBuildParamLegacyCompressed } from '../app/_src/utils/builder/buildUrlCodec.js';
import CharmShortener from '../app/_src/utils/builder/charmShortener.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'embed-debug');
const BASE = process.env.STS_DEV_URL || 'http://localhost:3001';

const itemData = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'public', 'items', 'items.json'), 'utf8'));

function charmParam(names) {
    const objects = names.map((n) => itemData[n]);
    return encodeURIComponent(CharmShortener.shortenCharmList(objects));
}

function maxCharms() {
    const names = [];
    let power = 0;
    for (const [key, item] of Object.entries(itemData)) {
        if (item.type !== 'Charm') continue;
        const p = Number(item.power) || 0;
        if (power + p > 12) continue;
        names.push(key);
        power += p;
        if (power >= 11) break;
    }
    return names;
}

const czData = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'public', 'items', 'czAbilities.json'), 'utf8'));

const CZ_MAIN_TREES = [
    'Dawnbringer',
    'Earthbound',
    'Flamecaller',
    'Frostborn',
    'Shadowdancer',
    'Steelsage',
    'Windwalker',
    'Prismatic',
];

// Deterministic PRNG so debug runs are reproducible; override with STS_DEBUG_SEED.
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const SEED = Number(process.env.STS_DEBUG_SEED) || 20260817;
const rng = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randomRarity = () => Math.floor(rng() * 6);

const SLOT_TYPES = {
    m: ['Mainhand Sword', 'Axe', 'Wand', 'Bow', 'Scythe', 'Crossbow', 'Trident', 'Mainhand', 'Mainhand Shield'],
    o: ['Offhand', 'Offhand Sword', 'Offhand Shield'],
    h: ['Helmet'],
    c: ['Chestplate'],
    l: ['Leggings'],
    b: ['Boots'],
};

function randomGear() {
    const parts = [];
    for (const [short, types] of Object.entries(SLOT_TYPES)) {
        const options = Object.keys(itemData).filter((k) => types.includes(itemData[k].type));
        if (options.length > 0) parts.push(`${short}=${encodeURIComponent(pick(options))}`);
    }
    return parts;
}

function randomCharms() {
    const charms = Object.keys(itemData).filter((k) => itemData[k].type === 'Charm');
    const names = [];
    let power = 0;
    let guard = 0;
    while (guard++ < 50 && power < 12) {
        const key = pick(charms);
        const p = Number(itemData[key].power) || 0;
        if (power + p > 12) continue;
        names.push(key);
        power += p;
    }
    return names;
}

// Every passive plus one random ability per non-passive trigger (one per
// activation is the only legal constraint), with random rarities.
function randomCzAbilities(includePrismatic) {
    const trees = czData.trees.filter(
        (t) => CZ_MAIN_TREES.includes(t.tree) && (includePrismatic || t.tree !== 'Prismatic')
    );
    const byTrigger = new Map();
    const passives = [];
    for (const tree of trees) {
        for (const ability of tree.skills) {
            if (ability.trigger === 'Passive') {
                passives.push(ability.name);
            } else {
                if (!byTrigger.has(ability.trigger)) byTrigger.set(ability.trigger, []);
                byTrigger.get(ability.trigger).push(ability.name);
            }
        }
    }
    const selected = passives.map((name) => `${name}:${randomRarity()}`);
    for (const [, names] of byTrigger) selected.push(`${pick(names)}:${randomRarity()}`);
    return selected;
}

const legacyBuild = [
    'm=Wand%20of%20Spring&o=Corrupted%20Key%205&h=Ensanguined%20Flower&c=Lunar%20Ascension&l=Outsider%27s%20Gaze&b=Crystal%20Cluster',
    `charm=${charmParam(['Lunar Ascension', "Outsider's Gaze", 'Deep Resonant Fragment'])}`,
    'cl=Rogue',
    'sp=Swordsage',
    'sk=WeaponMastery:2,Evasion:1,Shadowstep:2,Smokescreen:1',
    'ssk=Volley:2,SweepingBlade:1',
    'en=WeaponMastery,Smokescreen',
    'region=3',
].join('&');

const builds = [
    { name: 'default', build: null, note: 'generic card (no build)' },
    {
        name: 'r1-alchemist',
        build: encodeBuildParam(
            [
                'm=None&o=None&h=None&c=None&l=None&b=None',
                'charm=None',
                'cl=Alchemist',
                'sk=BrutalAlchemy:2,IronTincture:1',
                'region=1',
            ].join('&')
        ),
        note: 'Valley: class + skills only (no spec/enhancements/charms)',
    },
    {
        name: 'r3-swordsage',
        build: encodeBuildParam(legacyBuild),
        note: 'Ring: full build, spec, enhancements, charms, default name',
    },
    {
        name: 'r3-swordsage-named',
        build: encodeBuildParam(legacyBuild + '&name=' + encodeURIComponent("JC's Test Build")),
        note: 'same as above with an explicit build name',
    },
    {
        name: 'legacy-compressed',
        build: encodeBuildParamLegacyCompressed(legacyBuild),
        note: 'legacy z: compressed link format',
    },
    {
        name: 'removed-skill',
        build: encodeBuildParam(
            [
                'm=None&o=None&h=None&c=None&l=None&b=None',
                'charm=None',
                'cl=Alchemist',
                'sk=GhostSkill:2,BrutalAlchemy:1',
                'region=3',
            ].join('&')
        ),
        note: 'references a skill that no longer exists in the data',
    },
    {
        name: 'max-charms',
        build: encodeBuildParam(
            [
                'm=None&o=None&h=None&c=None&l=None&b=None',
                `charm=${charmParam(maxCharms())}`,
                'cl=Cleric',
                'sp=Paladin',
                'sk=Celestial:2,Toughness:1',
                'ssk=DivineSmite:2',
                'en=Celestial',
                'region=3',
            ].join('&')
        ),
        note: 'charm loadout near the 12-power cap',
    },
    {
        // Real saved build from https://sts.deepa.cat/b/TRK5Umlk (R3 Harbinger, 7 charms / 10★).
        name: 'trk5umlk',
        build: 'v1_Alm309_xFT7TssP8C710IBp2GdZ5k0RZQGhSZXMtdG9uZ3VlLTItQSxNeWMtX1NlcnVtLTEtQSxPdmUtX0ZsYXNrLTItQSxIZXItYWxfT3JlLTEtQSxBYnktX0NvcmFsLTEtQSxCb3QtZmluaXR5LTItQSxMZXMtZl9NYW5hLTEtTQAJQWxjaGVtaXN0CA9HcnVlc29tZUFsY2hlbXkCDUJydXRhbEFsY2hlbXkCDElyb25UaW5jdHVyZQIKQWxjaGVtaWNhbAIQVm9sYXRpbGVSZWFjdGlvbgIPVW5zdGFibGVBbWFsZ2FtAhBFbmVyZ2l6aW5nRWxpeGlyAgZCZXpvYXICZAAAAAAAAwlIYXJiaW5nZXIDDVNjb3JjaGVkRWFydGgCBVRhYm9vAghFc290ZXJpYwIDCkFsY2hlbWljYWwNQnJ1dGFsQWxjaGVteRBWb2xhdGlsZVJlYWN0aW9u',
        note: 'real saved build (b/TRK5Umlk): Alchemist/Harbinger, 7 charms',
    },
    {
        name: 'max-cz',
        build: encodeBuildParam(
            [
                ...randomGear(),
                `charm=${charmParam(randomCharms())}`,
                'cl=Cleric',
                `cz=${encodeURIComponent(randomCzAbilities(true).join(','))}`,
                'region=3',
                'asc=18',
            ].join('&')
        ),
        note: `Celestial Zenith: random gear/charms + all passives + random ability per trigger (seed ${SEED})`,
    },
    {
        name: 'max-dd',
        build: encodeBuildParam(
            [
                ...randomGear(),
                `charm=${charmParam(randomCharms())}`,
                'cl=Cleric',
                `cz=${encodeURIComponent(randomCzAbilities(false).join(','))}`,
                'region=2',
            ].join('&')
        ),
        note: `Darkest Depths: same but no Prismatic, no ascension (seed ${SEED})`,
    },
];

await fs.mkdir(OUT, { recursive: true });

const manifest = [];
let ok = 0;
for (const { name, build, note } of builds) {
    const url = BASE + '/api/v1/og' + (build ? '?build=' + encodeURIComponent(build) : '');
    const res = await fetch(url);
    if (!res.ok) {
        console.log(`FAIL ${name}: HTTP ${res.status}`);
        manifest.push(`FAIL ${name}: HTTP ${res.status}`);
        continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const file = path.join(OUT, name + '.png');
    await fs.writeFile(file, buf);
    ok++;
    console.log(`ok   ${name}.png  ${(buf.length / 1024).toFixed(1)} KB  (${note})`);
    manifest.push(`${name}  ${buf.length} bytes  ${url}`);
}

await fs.writeFile(path.join(OUT, 'manifest.txt'), manifest.join('\n') + '\n');
console.log(`\n${ok}/${builds.length} images written to ${OUT}`);
console.log('(folder is gitignored)');
