import { ImageResponse } from 'next/og';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { getItemData, getSkillsData } from '../../../_src/utils/itemsData';
import { getLinkPreviewData, getEffectiveBuildName } from '../../../_src/utils/buildPreview';
import { getMinecraftTextureKey } from '../../../_src/utils/items/minecraftFallback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLOT_LABELS = {
    mainhand: 'Mainhand',
    offhand: 'Offhand',
    helmet: 'Helmet',
    chestplate: 'Chestplate',
    leggings: 'Leggings',
    boots: 'Boots',
};

const MAX_MASTERWORK = { Rare: 4, Artifact: 4, Epic: 6 };

const ACCENT = '#9C59D1';
const TEXT = '#ffffff';
const MUTED = '#bababa';
const DIM = '#8a8a96';
const STAR = '#FFD24A';
const SKILL_BASE = '#C084FC';
const SKILL_SPEC = '#7CC4FF';
const SKILL_ENH = '#7EE787';
const PANEL = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(255,255,255,0.12)';

const STAR_PATH =
    'M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z';

let spriteInfoCache = null;
let faviconCache = null;

async function getFaviconDataUrl() {
    if (faviconCache) return faviconCache;
    try {
        const buf = await sharp(path.join(process.cwd(), 'public', 'favicon', 'favicon.ico'))
            .resize(128, 128)
            .png()
            .toBuffer();
        faviconCache = `data:image/png;base64,${buf.toString('base64')}`;
    } catch (e) {
        faviconCache = null;
    }
    return faviconCache;
}

// Parses the spritesheet maps + CSS positions once; crops 64x64 item textures on demand.
async function getSpriteInfo() {
    if (spriteInfoCache) return spriteInfoCache;

    const base = path.join(process.cwd(), 'public', 'spritesheets');
    const [mapRaw, cssRaw, sheet, mcCssRaw, mcSheet] = await Promise.all([
        fs.readFile(path.join(base, 'itemsheet-map.json'), 'utf8'),
        fs.readFile(path.join(base, '_itemsheet.css'), 'utf8'),
        fs.readFile(path.join(base, 'itemsheet.png')),
        fs.readFile(path.join(base, '_minecraft.css'), 'utf8'),
        fs.readFile(path.join(base, 'minecraft.png')),
    ]);

    const map = JSON.parse(mapRaw);
    const positions = {};
    const re = /\.monumenta-([\w-]+)\s*\{\s*background-position:\s*(-?\d+)px\s+(-?\d+)px/g;
    let match;
    while ((match = re.exec(cssRaw))) {
        positions[match[1]] = { x: Math.abs(Number(match[2])), y: Math.abs(Number(match[3])) };
    }

    const mcPositions = {};
    const mcRe = /\.minecraft-([\w-]+)\s*\{\s*background-position:\s*(-?\d+)px\s+(-?\d+)(?:px)?/g;
    while ((match = mcRe.exec(mcCssRaw))) {
        mcPositions[match[1]] = { x: Math.abs(Number(match[2])), y: Math.abs(Number(match[3])) };
    }

    spriteInfoCache = { map, positions, sheet, mcPositions, mcSheet };
    return spriteInfoCache;
}

function findSpriteKey(map, itemKey, itemName) {
    const candidates = [
        itemName,
        itemName && itemName.replace(/^EX\s+/, ''),
        itemKey,
        itemKey && itemKey.replace(/^EX\s+/, ''),
        itemKey && itemKey.replace(/-[0-9]+$/, ''),
    ];
    for (const c of candidates) {
        if (c && map[c]) return map[c];
    }
    return null;
}

async function cropSprite(sheet, pos) {
    try {
        const buf = await sharp(sheet, { limitInputPixels: false })
            .extract({ left: pos.x, top: pos.y, width: 64, height: 64 })
            .png()
            .toBuffer();
        return `data:image/png;base64,${buf.toString('base64')}`;
    } catch (e) {
        return null;
    }
}

async function itemSpriteDataUrl({ map, positions, sheet, mcPositions, mcSheet }, itemKey, itemName, baseItem) {
    const spriteKey = findSpriteKey(map, itemKey, itemName);
    const pos = spriteKey && positions[spriteKey];
    if (pos) return cropSprite(sheet, pos);
    // Fall back to the vanilla Minecraft texture for the item's base material.
    if (baseItem) {
        const mcKey = getMinecraftTextureKey(baseItem);
        const mcPos = mcPositions[mcKey];
        if (mcPos) return cropSprite(mcSheet, mcPos);
    }
    return null;
}

function Stars({ filled, max, size = 12 }) {
    const count = Math.max(0, Math.min(max, Number(filled) || 0));
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {Array.from({ length: max }, (_, i) => (
                <svg key={i} width={size} height={size} viewBox="0 0 576 512">
                    <path d={STAR_PATH} fill={i < count ? STAR : 'rgba(255,255,255,0.15)'} />
                </svg>
            ))}
        </div>
    );
}

function MasterworkStars({ tier, masterwork }) {
    const max = MAX_MASTERWORK[tier];
    if (!max) return null;
    return <Stars filled={masterwork} max={max} />;
}

function EquipmentGrid({ itemLines }) {
    const CELL_W = 340;
    const rows = [];
    for (let i = 0; i < itemLines.length; i += 2) {
        rows.push(itemLines.slice(i, i + 2));
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {rows.map((pair, ri) => (
                <div key={ri} style={{ display: 'flex', marginTop: ri === 0 ? 10 : 14 }}>
                    {pair.map(({ label, name, img, ex, tier, masterwork }) => (
                        <div key={label} style={{ display: 'flex', width: CELL_W, marginRight: 14 }}>
                            {img ? (
                                <img src={img} width={64} height={64} style={{ imageRendering: 'pixelated' }} />
                            ) : (
                                <div style={{ width: 64, height: 64, border: `1px solid ${BORDER}` }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                                <div style={{ fontSize: 12, letterSpacing: 1.5, color: DIM, fontWeight: 700 }}>
                                    {label.toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 17, marginTop: 1 }}>
                                    {ex && (
                                        <div
                                            style={{ color: ACCENT, fontWeight: 800, letterSpacing: 1, marginRight: 6 }}
                                        >
                                            EX
                                        </div>
                                    )}
                                    <div style={{ color: name ? TEXT : DIM, fontWeight: name ? 600 : 400 }}>
                                        {name || 'None'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                                    {name && tier && masterwork != null && (
                                        <>
                                            <MasterworkStars tier={tier} masterwork={masterwork} />
                                            <div style={{ color: DIM, fontSize: 13, marginLeft: 8 }}>{tier}</div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function SkillChips({ skills, color, enhancedIds }) {
    const sorted = [...skills].sort((a, b) => (enhancedIds.has(b.id) ? 1 : 0) - (enhancedIds.has(a.id) ? 1 : 0));
    return (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {sorted.map((s) => {
                const enhanced = enhancedIds.has(s.id);
                const chipColor = enhanced ? SKILL_ENH : color;
                return (
                    <div
                        key={s.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            border: `1px solid ${BORDER}`,
                            background: PANEL,
                            padding: '3px 9px',
                            fontSize: 14,
                            color: chipColor,
                        }}
                    >
                        <span style={{ fontWeight: 600 }}>{s.name || s.shortName || s.id}</span>
                        <span style={{ fontWeight: 800 }}>
                            {s.points}
                            {enhanced ? '*' : ''}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function SkillPanel({ data }) {
    const baseSkills = data.skills || [];
    const specSkills = data.specSkills || [];
    const enhancedIds = new Set((data.enhancements || []).map((e) => (typeof e === 'string' ? e : e.id)));
    if (baseSkills.length === 0 && specSkills.length === 0) return null;
    const treeHeader = (label, showLegend) => (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13, letterSpacing: 2, color: DIM, fontWeight: 700 }}>{label}</span>
            {showLegend && <span style={{ fontSize: 11, color: DIM }}>(* is enhanced)</span>}
        </div>
    );
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {baseSkills.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {treeHeader((data.className || 'CLASS').toUpperCase(), true)}
                    <SkillChips skills={baseSkills} color={SKILL_BASE} enhancedIds={enhancedIds} />
                </div>
            )}
            {specSkills.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {treeHeader((data.spec || 'SPECIALIZATION').toUpperCase(), false)}
                    <SkillChips skills={specSkills} color={SKILL_SPEC} enhancedIds={enhancedIds} />
                </div>
            )}
        </div>
    );
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const build = searchParams.get('build');

    const [itemData, skillsData] = await Promise.all([getItemData(), getSkillsData()]);
    const data = build ? getLinkPreviewData(build, itemData, skillsData) : null;

    const fontStyle = { fontFamily: 'sans-serif' };

    // No (or invalid) build: render a simple base-site card with the favicon.
    if (!data) {
        const favicon = await getFaviconDataUrl();
        return new ImageResponse(
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0e0e14',
                    color: TEXT,
                    ...fontStyle,
                }}
            >
                {favicon && <img src={favicon} width={96} height={96} style={{ imageRendering: 'pixelated' }} />}
                <div style={{ fontSize: 28, letterSpacing: 8, color: ACCENT, fontWeight: 700, marginTop: 28 }}>
                    Spare the Sympathy
                </div>
                <div style={{ fontSize: 44, fontWeight: 800, color: TEXT, marginTop: 10 }}>Monumenta Builder</div>
            </div>,
            { width: 1200, height: 630 }
        );
    }

    const title = getEffectiveBuildName(data, null) || 'Monumenta Builder';
    const className = data.className || null;
    const spec = data.spec || null;
    const totalSkillPoints = (data.skills || []).reduce((sum, s) => sum + (Number(s.points) || 0), 0);
    const totalSpecPoints = (data.specSkills || []).reduce((sum, s) => sum + (Number(s.points) || 0), 0);
    const hasBuildInfo = className || spec || totalSkillPoints > 0 || totalSpecPoints > 0;

    const InfoItem = ({ label, value }) => (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <div style={{ fontSize: 12, letterSpacing: 1.5, color: DIM, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 17, color: TEXT, fontWeight: 700 }}>{value}</div>
        </div>
    );

    const spriteInfo = await getSpriteInfo();
    const itemLines = data
        ? await Promise.all(
              Object.entries(SLOT_LABELS).map(async ([slot, label]) => {
                  const key = data.items[slot];
                  if (key === 'None')
                      return { label, name: null, key: null, img: null, ex: false, tier: null, masterwork: 0 };
                  const item = itemData[key];
                  const name = item?.name || key;
                  const img = await itemSpriteDataUrl(spriteInfo, key, name, item?.base_item);
                  return {
                      label,
                      name,
                      key,
                      img,
                      ex: Boolean(item?.name?.startsWith('EX ')),
                      tier: item?.tier || null,
                      masterwork: item && item.masterwork != null ? item.masterwork : null,
                  };
              })
          )
        : null;
    const charmNames = data?.charms.items || [];

    return new ImageResponse(
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#0e0e14',
                color: TEXT,
                padding: '40px 56px',
                boxSizing: 'border-box',
                ...fontStyle,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={{ fontSize: 16, letterSpacing: 4, color: DIM, fontWeight: 700 }}>Spare the Sympathy</div>
            </div>

            <div style={{ fontSize: 38, fontWeight: 800, marginTop: 6, color: TEXT }}>{title}</div>

            {hasBuildInfo && (
                <div style={{ display: 'flex', gap: 18, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    {className && <InfoItem label="CLASS" value={className} />}
                    {spec && <InfoItem label="SPEC" value={spec} />}
                    {totalSkillPoints > 0 && <InfoItem label="SKILL POINTS" value={String(totalSkillPoints)} />}
                    {totalSpecPoints > 0 && <InfoItem label="SPEC POINTS" value={String(totalSpecPoints)} />}
                </div>
            )}

            <SkillPanel data={data} />

            <div style={{ display: 'flex', gap: 28, marginTop: 'auto', paddingTop: 20 }}>
                <div
                    style={{
                        flex: 1,
                        border: `2px solid ${BORDER}`,
                        background: PANEL,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <div style={{ fontSize: 15, letterSpacing: 2, color: DIM, fontWeight: 700 }}>EQUIPMENT</div>
                    <EquipmentGrid itemLines={itemLines} />
                </div>

                {charmNames.length > 0 && (
                    <div
                        style={{
                            width: 330,
                            border: `2px solid ${BORDER}`,
                            background: PANEL,
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 15,
                                letterSpacing: 2,
                                color: DIM,
                                fontWeight: 700,
                                marginBottom: 2,
                            }}
                        >
                            <span>{`CHARMS ${String(data.charms.totalPower)}/12`}</span>
                            <svg width={13} height={13} viewBox="0 0 576 512">
                                <path d={STAR_PATH} fill={STAR} />
                            </svg>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {charmNames.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        width: 134,
                                        margin: '0 10px 8px 0',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 13,
                                            color: TEXT,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {c.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                                        {c.power != null && <Stars filled={c.power} max={c.power} size={9} />}
                                        {c.power != null && (
                                            <div style={{ color: DIM, fontSize: 11, marginLeft: 6 }}>
                                                {String(c.power)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        { width: 1200, height: 630 }
    );
}
