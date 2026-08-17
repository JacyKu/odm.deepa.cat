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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_builds_token ON builds (token);
`);

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

export function saveBuild(token) {
    const existing = db.prepare('SELECT id FROM builds WHERE token = ? LIMIT 1').get(token);
    if (existing) return existing.id;

    let id = randomId();
    for (let i = 0; i < 10; i++) {
        const exists = db.prepare('SELECT 1 FROM builds WHERE id = ?').get(id);
        if (!exists) break;
        id = randomId();
    }
    db.prepare('INSERT INTO builds (id, token) VALUES (?, ?)').run(id, token);
    return id;
}

export function getBuild(id) {
    if (!id || typeof id !== 'string' || !/^[A-Za-z0-9]+$/.test(id)) return null;
    const row = db.prepare('SELECT token FROM builds WHERE id = ?').get(id);
    return row ? row.token : null;
}
