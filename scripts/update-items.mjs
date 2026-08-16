import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET = path.join(__dirname, '..', 'public', 'items', 'items.json');
const SKILLS_TARGET = path.join(__dirname, '..', 'public', 'items', 'skills.json');
const MIN_ITEMS = 1000;

const sources = [
    {
        name: 'Monumenta API',
        url: 'https://api.playmonumenta.com/items',
        headers: {},
    },
    {
        name: 'U5B GitHub',
        url: 'https://raw.githubusercontent.com/U5B/Monumenta/main/out/item.json',
        headers: {},
    },
];

const user = process.env.ODM_MONUMENTA_USER;
const pass = process.env.ODM_MONUMENTA_PASS;
if (user && pass) {
    sources[0].headers.Authorization = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
}

async function fetchSource(source) {
    const res = await fetch(source.url, { headers: source.headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();
    const data = JSON.parse(raw);

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error('not a JSON object');
    }
    const keys = Object.keys(data);
    if (keys.length < MIN_ITEMS) {
        throw new Error(`only ${keys.length} entries (expected at least ${MIN_ITEMS})`);
    }
    const sample = data[keys[0]];
    if (!sample || typeof sample.name !== 'string' || typeof sample.stats !== 'object') {
        throw new Error('unexpected item shape (missing name/stats)');
    }

    return { data, keys, bytes: Buffer.byteLength(raw) };
}

async function main() {
    const dryRun = process.argv.includes('--dry-run');

    const current = JSON.parse(await fs.readFile(TARGET, 'utf8'));
    const currentCount = Object.keys(current).length;

    let result = null;
    let lastError = null;
    for (const source of sources) {
        try {
            result = await fetchSource(source);
            console.log(`Fetched from ${source.name} (${source.url})`);
            break;
        } catch (err) {
            lastError = err;
            console.warn(`  ${source.name} failed: ${err.message}`);
        }
    }

    if (!result) {
        console.error(`\nFailed to fetch from all sources. Last error: ${lastError?.message}`);
        console.error('items.json left unchanged.');
        process.exit(1);
    }

    const removed = currentCount - result.keys.length;
    console.log(
        `\nitems.json: ${currentCount} -> ${result.keys.length} items (${removed >= 0 ? '-' : '+'}${Math.abs(removed)})`
    );
    console.log(`payload: ${(result.bytes / 1048576).toFixed(1)} MB raw`);

    if (dryRun) {
        console.log('\nDry run - not writing.');
        return;
    }

    const tmp = TARGET + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(result.data));
    await fs.rename(tmp, TARGET);
    console.log(`\nWrote ${path.relative(process.cwd(), TARGET)}`);

    console.log('\nFetching skills data...');
    try {
        await updateSkills();
    } catch (err) {
        console.warn(`  skills update failed (items still updated): ${err.message}`);
    }

    console.log('Restart the dev server (or wait for a reload) for the change to take effect.');
}

async function updateSkills() {
    const res = await fetch('https://api.playmonumenta.com/skills');
    if (!res.ok) throw new Error(`skills API: HTTP ${res.status}`);
    const raw = await res.text();
    const data = JSON.parse(raw);

    if (!data || !Array.isArray(data.classes) || data.classes.length < 8) {
        throw new Error('skills payload missing classes array');
    }
    for (const cls of data.classes) {
        if (!cls.className || !Array.isArray(cls.skills)) {
            throw new Error('skills payload has an unexpected class shape');
        }
    }

    const tmp = SKILLS_TARGET + '.tmp';
    await fs.writeFile(tmp, raw);
    await fs.rename(tmp, SKILLS_TARGET);
    console.log(
        `Wrote ${path.relative(process.cwd(), SKILLS_TARGET)} (${(Buffer.byteLength(raw) / 1048576).toFixed(1)} MB)`
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
