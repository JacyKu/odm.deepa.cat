import Database from 'better-sqlite3';
import path from 'node:path';
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';

const DB_PATH = process.env.STS_DB_PATH || path.join(process.cwd(), 'data', 'sts-builds.db');

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS builds (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    user_id TEXT,
    state TEXT,
    name TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_builds_token ON builds (token);
`);

// Migrations for databases created before the ownership/state columns existed.
const migrateColumn = (name, ddl) => {
    try {
        db.exec(`ALTER TABLE builds ADD COLUMN ${ddl}`);
    } catch (e) {
        // "duplicate column name" is expected; anything else is not.
        if (!String(e.message).includes('duplicate column')) throw e;
    }
};
migrateColumn('user_id', 'user_id TEXT');
migrateColumn('state', 'state TEXT');
migrateColumn('name', 'name TEXT');
migrateColumn('notes', 'notes TEXT');
migrateColumn('updated_at', 'updated_at TEXT');

// Databases that predate the updated_at column have NULL for it on every row
// (the ALTER TABLE above couldn't backfill). Stamp a sensible value so the
// "My Builds" list never shows an invalid date.
db.prepare('UPDATE builds SET updated_at = created_at WHERE updated_at IS NULL').run();

db.exec('CREATE INDEX IF NOT EXISTS idx_builds_user ON builds (user_id);');

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ID_LENGTH = 8;

function randomId() {
    const bytes = crypto.randomBytes(ID_LENGTH);
    let id = '';
    for (let i = 0; i < ID_LENGTH; i++) {
        id += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return id;
}

// Canonical, stable serialization of the shareable build state so identical
// builds (including infusions + Revelation) always produce the same row.
export function canonicalState(state) {
    if (!state || typeof state !== 'object') return null;
    const token = typeof state.token === 'string' ? state.token : '';
    if (!token) return null;
    const infusions = state.infusions || {};
    const sortedInfusions = Object.fromEntries(
        Object.entries(infusions)
            .filter(([, v]) => v && v !== 'None')
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    );
    return JSON.stringify({ token, infusions: sortedInfusions, revelation: Boolean(state.revelation) });
}

// Save a build. Identical state for the same owner reuses the existing row
// (so re-sharing an unchanged build never spawns a new link); identical state
// from a different owner (or anonymous) creates their own row so it can live
// on their "My Builds" list.
export function saveBuild({ state, userId, name, notes }) {
    const canonical = canonicalState(state);
    if (!canonical) return null;

    const existing = userId
        ? db.prepare('SELECT id FROM builds WHERE state = ? AND user_id = ? LIMIT 1').get(canonical, userId)
        : db.prepare('SELECT id FROM builds WHERE state = ? AND user_id IS NULL LIMIT 1').get(canonical);
    if (existing) {
        // Same owner re-saving the identical build: keep the link, but let
        // name/notes ride along so they can be set on the first save.
        if (name !== undefined || notes !== undefined) {
            const sets = [];
            const params = [];
            if (name !== undefined) {
                sets.push('name = ?');
                params.push(typeof name === 'string' ? name.slice(0, 100) : null);
            }
            if (notes !== undefined) {
                sets.push('notes = ?');
                params.push(typeof notes === 'string' && notes ? notes.slice(0, 2000) : null);
            }
            db.prepare(`UPDATE builds SET ${sets.join(', ')} WHERE id = ?`).run(...params, existing.id);
        }
        return { id: existing.id, isNew: false };
    }

    let id = randomId();
    for (let i = 0; i < 10; i++) {
        const exists = db.prepare('SELECT 1 FROM builds WHERE id = ?').get(id);
        if (!exists) break;
        id = randomId();
    }
    db.prepare(
        "INSERT INTO builds (id, token, user_id, state, name, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).run(
        id,
        typeof state.token === 'string' ? state.token : '',
        userId || null,
        canonical,
        name || null,
        typeof notes === 'string' && notes ? String(notes).slice(0, 2000) : null
    );
    return { id, isNew: true };
}

export function getBuild(id) {
    if (!id || typeof id !== 'string' || !/^[A-Za-z0-9]+$/.test(id)) return null;
    const row = db
        .prepare('SELECT id, token, user_id, state, name, notes, created_at, updated_at FROM builds WHERE id = ?')
        .get(id);
    if (!row) return null;
    let parsedState = null;
    if (row.state) {
        try {
            parsedState = JSON.parse(row.state);
        } catch (e) {
            parsedState = null;
        }
    }
    return { ...row, parsedState };
}

export function listBuildsByUser(userId) {
    if (!userId) return [];
    return db
        .prepare(
            'SELECT id, token, user_id, state, name, notes, created_at, updated_at FROM builds WHERE user_id = ? ORDER BY updated_at DESC'
        )
        .all(userId)
        .map((row) => {
            let parsedState = null;
            if (row.state) {
                try {
                    parsedState = JSON.parse(row.state);
                } catch (e) {
                    parsedState = null;
                }
            }
            return { ...row, parsedState };
        });
}

// Update mutable metadata (name / notes) for an owned build.
export function updateBuild(id, userId, { name, notes } = {}) {
    if (!id || !userId) return false;
    const sets = [];
    const params = [];
    if (name !== undefined) {
        if (typeof name !== 'string') return false;
        sets.push('name = ?');
        params.push(String(name).slice(0, 100));
    }
    if (notes !== undefined) {
        if (typeof notes !== 'string') return false;
        sets.push('notes = ?');
        params.push(notes.slice(0, 2000));
    }
    if (sets.length === 0) return false;
    params.push(id, userId);
    const result = db
        .prepare(`UPDATE builds SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ? AND user_id = ?`)
        .run(...params);
    return result.changes > 0;
}

// Update a build's full state (token + infusions + revelation) in place so
// editing a saved build keeps the same link. Owners can update their own rows;
// anonymous rows (user_id IS NULL) can be updated by anyone, matching how the
// anonymous save dedupe treats them as a shared build.
export function updateBuildState(id, userId, { state, name, notes } = {}) {
    if (!id) return false;
    const canonical = canonicalState(state);
    if (!canonical) return false;

    const sets = ['state = ?', 'token = ?'];
    const params = [canonical, typeof state.token === 'string' ? state.token : ''];
    if (name !== undefined) {
        if (typeof name !== 'string') return false;
        sets.push('name = ?');
        params.push(String(name).slice(0, 100));
    }
    if (notes !== undefined) {
        if (typeof notes !== 'string') return false;
        sets.push('notes = ?');
        params.push(notes.slice(0, 2000));
    }
    params.push(id, userId || null);
    const result = db
        .prepare(
            `UPDATE builds SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ? AND (user_id = ? OR user_id IS NULL)`
        )
        .run(...params);
    return result.changes > 0;
}

export function deleteBuild(id, userId) {
    if (!id || !userId) return false;
    const result = db.prepare('DELETE FROM builds WHERE id = ? AND user_id = ?').run(id, userId);
    return result.changes > 0;
}
