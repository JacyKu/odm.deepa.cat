import DatabasePage from '../_src/components/databasePage';
import { getItemData, getSkillsData } from '../_src/utils/itemsData';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Build Database',
    description: 'Browse public Monumenta builds shared by the community',
};

// Raw item types -> the builder slot they equip into (used to group the
// item filter's value dropdown per slot). Everything else (Misc, Consumable,
// Written Book, ...) can't be equipped, so it never appears in builds.
const SLOT_BY_TYPE = {
    Mainhand: 'Mainhand',
    'Mainhand Sword': 'Mainhand',
    'Mainhand Shield': 'Mainhand',
    Axe: 'Mainhand',
    Pickaxe: 'Mainhand',
    Scythe: 'Mainhand',
    Bow: 'Mainhand',
    Crossbow: 'Mainhand',
    Wand: 'Mainhand',
    Snowball: 'Mainhand',
    Trident: 'Mainhand',
    Shovel: 'Mainhand',
    Projectile: 'Mainhand',
    Offhand: 'Offhand',
    'Offhand Sword': 'Offhand',
    'Offhand Shield': 'Offhand',
    'Alchemist Bag': 'Offhand',
    Helmet: 'Helmet',
    Chestplate: 'Chestplate',
    Leggings: 'Leggings',
    Boots: 'Boots',
    Charm: 'Charm',
};

let groupsCache = null;
let groupsCacheKey = null;

// Slot -> sorted list of distinct display names. getItemData returns the same
// object until the data files change, so the reference is a safe cache key.
async function getItemGroups() {
    const itemData = await getItemData();
    if (groupsCache && groupsCacheKey === itemData) return groupsCache;
    const groups = {};
    for (const [itemKey, item] of Object.entries(itemData)) {
        const slot = SLOT_BY_TYPE[item.type];
        if (!slot) continue;
        const name = item.name || itemKey;
        if (!groups[slot]) groups[slot] = [];
        if (!groups[slot].includes(name)) groups[slot].push(name);
    }
    for (const slot of Object.keys(groups)) {
        groups[slot].sort((a, b) => a.localeCompare(b));
    }
    groupsCache = groups;
    groupsCacheKey = itemData;
    return groups;
}

export default async function Database() {
    const [skillsData, itemGroups] = await Promise.all([getSkillsData(), getItemGroups()]);
    const classOptions = skillsData.classes.map((c) => c.className);
    const specMap = {};
    for (const c of skillsData.classes) {
        specMap[c.className] = (c.specs || []).map((s) => s.specName);
    }
    return <DatabasePage classOptions={classOptions} specMap={specMap} itemGroups={itemGroups} />;
}
