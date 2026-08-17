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
