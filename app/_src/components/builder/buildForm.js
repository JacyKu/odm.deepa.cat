import Select from 'react-select';
import SelectInput from '../items/selectInput';
import FloatingLabel from '../items/floatingLabel';
import CheckboxWithLabel from '../items/checkboxWithLabel';
import ItemTile from '../items/itemTile';
import MasterworkableItemTile from '../items/masterworkableItemTile';
import CharmTile from '../items/charmTile';
import BuildImportBar from './buildImportBar';
import BuilderHeader from '../items/builderHeader';
import styles from '../../styles/Items.module.css';
import React from 'react';
import { getStsBase } from '../../utils/base';

import Stats from '../../utils/builder/stats';
import TranslatableText from '../translatableText';
import ListSelector from './listSelector';
import CharmSelector, { resolveCharmKey, computeCharmTotals } from './charmSelector';
import CharmFormatter from '../../utils/items/charmFormatter';
import CharmShortener from '../../utils/builder/charmShortener';
import {
    decodeBuildParam,
    encodeBuildParam,
    normalizeBuildParam,
    getBuildTokenVersion,
} from '../../utils/builder/buildUrlCodec';
import { DELVE_INFUSIONS } from '../../data/delveInfusions';

const infusionSelectTheme = (theme) => ({
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

const infusionSelectStyles = {
    container: (base) => ({ ...base, width: '100%', minWidth: 120 }),
    control: (base) => ({ ...base, minHeight: 42, height: 42 }),
    valueContainer: (base) => ({ ...base, height: 42, paddingTop: 0, paddingBottom: 0 }),
    indicatorsContainer: (base) => ({ ...base, height: 42 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
};

const emptyBuild = {
    mainhand: 'None',
    offhand: 'None',
    helmet: 'None',
    chestplate: 'None',
    leggings: 'None',
    boots: 'None',
};

const enabledBoxes = {
    // Situational Defense
    shielding: false,
    poise: false,
    inure: false,
    steadfast: false,
    guard: false,
    second_wind: false,
    ethereal: false,
    reflexes: false,
    evasion: false,
    tempo: false,
    cloaked: false,
    earth_aspect: false,

    // Situational Damage
    smite: false,
    duelist: false,
    slayer: false,
    point_blank: false,
    sniper: false,
    first_strike: false,
    regicide: false,
    trivium: false,
    stamina: false,
    technique: false,
    abyssal: false,
    fractal: false,
    skyseeker: false,
    retaliation_normal: false,
    retaliation_elite: false,
    retaliation_boss: false,

    // Delve infusion situationals: the infusion's stat effect only counts
    // while its checkbox is ticked (matches the infusion's in-game condition).
    vengeful: false,
    execution: false,
    fervor: false,
    choler: false,
    celestial: false,
    grace: false,
    nutriment: false,
    soothing: false,
    unyielding: false,
    epoch: false,
    expedite: false,
    ardor: false,
    carapace: false,
    fueled: false,
    orbital: false,
    pennate: false,
};

const situationalDefenses = [
    'shielding',
    'poise',
    'inure',
    'steadfast',
    'guard',
    'second_wind',
    'ethereal',
    'reflexes',
    'evasion',
    'tempo',
    'cloaked',
    'earth_aspect',
];

const situationalFlatDamage = ['smite', 'duelist', 'slayer', 'point_blank', 'sniper'];

const situationalPercentDamage = [
    'first_strike',
    'regicide',
    'trivium',
    'stamina',
    'technique',
    'abyssal',
    'fractal',
    'skyseeker',
    'retaliation_normal',
    'retaliation_elite',
    'retaliation_boss',
];

const extraStats = {
    damageMultipliers: [],
    resistanceMultipliers: [],
    healthMultipliers: [],
    speedMultipliers: [],
    attackSpeedMultipliers: [],
};

const itemTypes = ['mainhand', 'offhand', 'helmet', 'chestplate', 'leggings', 'boots'];

const regions = [
    { value: 1, label: 'Valley' },
    { value: 2, label: 'Isles' },
    { value: 3, label: 'Ring' },
    { value: 'dd', label: 'Darkest Depths' },
    { value: 'cz', label: 'Celestial Zenith' },
];

// Extra stat inputs that are part of the build (shared in the link under their full names).
const STAT_KEYS = ['health', 'tenacity', 'vitality', 'vigor', 'focus', 'perspicacity', 'region'];

const DEFAULT_STAT_INPUTS = { health: '100', tenacity: '0', vitality: '0', vigor: '0', focus: '0', perspicacity: '0' };

const classes = ['Alchemist', 'Cleric', 'Mage', 'Rogue', 'Scout', 'Shaman', 'Warlock', 'Warrior'];

// API skill scoreboardIds that feed the stat calculation (the rest of the
// skills are selected and exported, but don't change the stat cards).
const skillBuffKeys = {
    Celestial: 'celestial_blessing',
    WeaponMastery: 'weapon_mastery',
    Toughness: 'toughness',
};

// Spec skill scoreboardIds that feed the stat calculation.
const specSkillBuffKeys = {
    Taboo: 'taboo',
};

const MAX_ENHANCEMENT_POINTS = 3;
const MAX_SPEC_POINTS = 4;
const MAX_SKILL_POINTS = 10;

const enabledClassAbilityBuffs = {
    versatile: false,
    weapon_mastery: false,
    weapon_mastery_lv1: false,
    weapon_mastery_lv2: false,
    weapon_mastery_enhancement: false,
    formidable: false,
    dethroner_elite: false,
    dethroner_boss: false,
    culling: false,
    totemic_empowerment: false,
    taboo_lv1: false,
    taboo_lv2: false,
    taboo_burst: false,
    channeling: false,
    celestial_blessing_lv1: false,
    celestial_blessing_lv2: false,
    toughness_lv1: false,
    toughness_lv2: false,
    toughness_enhancement: false,
};

function groupMasterwork(items, itemData) {
    // Group up masterwork tiers by their name using an object, removing them from items.
    let masterworkItems = {};
    // Go through the array in reverse order to have the splice work properly
    // (items will go down in position if not removed from the end)
    for (let i = items.length - 1; i >= 0; i--) {
        let name = items[i];
        if (itemData[name].masterwork != undefined) {
            let itemName = itemData[name].name;
            if (!masterworkItems[itemName]) {
                masterworkItems[itemName] = [];
            }
            masterworkItems[itemName].push(itemData[name]);
            items.splice(i, 1);
        }
    }

    // Re-insert the groups as arrays into the items array.
    Object.keys(masterworkItems).forEach((item) => {
        items.push({ value: `${item}-${masterworkItems[item][0].masterwork}`, label: item });
    });

    return items;
}

function getRelevantItems(types, itemData) {
    let items = Object.keys(itemData);
    return groupMasterwork(
        items.filter((name) => types.includes(itemData[name].type.toLowerCase().replace(/<.*>/, '').trim())),
        itemData
    );
}

function recalcBuild(data, itemData) {
    let tempStats = new Stats(itemData, data, enabledBoxes, extraStats, enabledClassAbilityBuffs);
    return tempStats;
}

function createMasterworkData(name, itemData) {
    return Object.keys(itemData)
        .filter((itemName) => itemData[itemName].name == name)
        .map((itemName) => itemData[itemName]);
}

function removeMasterworkFromName(name) {
    return name.replace(/-\d$/g, '');
}

function checkExists(type, itemsToDisplay, itemData) {
    let retVal = false;
    if (itemsToDisplay.itemStats) {
        retVal = itemsToDisplay.itemStats[type] !== undefined;
    }
    if (
        itemsToDisplay.itemNames &&
        itemsToDisplay.itemNames[type] &&
        createMasterworkData(removeMasterworkFromName(itemsToDisplay.itemNames[type]), itemData)[0]?.masterwork !=
            undefined
    ) {
        retVal = true;
    }
    return retVal;
}

function formatSituationalName(situ) {
    let ret = situ
        .split('_')
        .map((word) => word[0].toUpperCase() + word.substring(1))
        .join(' ');
    if (ret.match('Retaliation')) return ret.split(' ')[0] + ' (' + ret.split(' ')[1].toLowerCase() + ')';
    return ret;
}

function generateSituationalCheckboxes(itemsToDisplay, checkboxChanged, delveInfusions) {
    let tempDef = [];
    let tempFlatDmg = [];
    let tempPercentDmg = [];
    let tempInfusions = [];

    situationalDefenses.forEach(function (situ) {
        if (!itemsToDisplay.situationals) return;
        if (itemsToDisplay.situationals[situ].level) {
            tempDef.push(
                <div className="col-auto" key={'situationalbox-' + situ}>
                    <CheckboxWithLabel
                        name={formatSituationalName(situ)}
                        checked={enabledBoxes[situ]}
                        onChange={checkboxChanged}
                    />
                </div>
            );
        }
    });
    situationalFlatDamage.forEach(function (situ) {
        if (!itemsToDisplay.situationals) return;
        if (itemsToDisplay.situationals[situ].level) {
            tempFlatDmg.push(
                <div className="col-auto" key={'situationalbox-' + situ}>
                    <CheckboxWithLabel
                        name={formatSituationalName(situ)}
                        checked={enabledBoxes[situ]}
                        onChange={checkboxChanged}
                    />
                </div>
            );
        }
    });
    situationalPercentDamage.forEach(function (situ) {
        if (!itemsToDisplay.situationals) return;
        if (itemsToDisplay.situationals[situ].level) {
            tempPercentDmg.push(
                <div className="col-auto" key={'situationalbox-' + situ}>
                    <CheckboxWithLabel
                        name={formatSituationalName(situ)}
                        checked={enabledBoxes[situ]}
                        onChange={checkboxChanged}
                    />
                </div>
            );
        }
    });
    if (itemsToDisplay.retaliation) {
        ['normal', 'elite', 'boss'].forEach((type) => {
            tempPercentDmg.push(
                <div className="col-auto" key={'situationalbox-retaliation_' + type}>
                    <CheckboxWithLabel
                        name={formatSituationalName('retaliation_' + type)}
                        checked={enabledBoxes['retaliation_' + type]}
                        onChange={checkboxChanged}
                    />
                </div>
            );
        });
    }
    // One situational chip per equipped delve infusion; the stat effect only
    // counts while its checkbox is ticked.
    if (delveInfusions) {
        const seen = new Set();
        Object.values(delveInfusions).forEach((infusion) => {
            if (!infusion || infusion === 'None' || seen.has(infusion)) return;
            seen.add(infusion);
            tempInfusions.push(
                <div className="col-auto" key={'situationalbox-infusion-' + infusion}>
                    <CheckboxWithLabel
                        name={infusion}
                        checked={enabledBoxes[infusion.toLowerCase()]}
                        onChange={checkboxChanged}
                    />
                </div>
            );
        });
    }
    /* if(itemsToDisplay.meleeDamagePercent > 100 || itemsToDisplay.projectileDamagePercent > 100){
        tempPercentDmg.push(<CheckboxWithLabel key={"situationalbox-versatile"} name="Versatile" checked={false} onChange={checkboxChanged} />)
    } */

    let temp = [];
    temp.push(...tempDef);
    if (tempDef.length > 0 && tempFlatDmg.length > 0) {
        temp.push(<span key="spacer1" style={{ width: '10px', padding: '0px' }}></span>);
        // spacer between def and flat damage if both exist
    }
    temp.push(...tempFlatDmg);
    if (temp.length > 0 && tempPercentDmg.length > 0) {
        temp.push(<span key="spacer2" style={{ width: '10px', padding: '0px' }}></span>);
        // spacer between existing stuff and percent damage if both exist
    }
    temp.push(...tempPercentDmg);
    if (temp.length > 0 && tempInfusions.length > 0) {
        temp.push(<span key="spacer3" style={{ width: '10px', padding: '0px' }}></span>);
        // spacer between enchantment situationals and infusion situationals if both exist
    }
    temp.push(...tempInfusions);
    if (temp.length == 0) {
        temp.push(
            <div className="col-auto" key="builder.info.noSituationals">
                <TranslatableText
                    className={styles.noSituationals}
                    identifier="builder.info.noSituationals"
                ></TranslatableText>
            </div>
        );
    }
    return temp;
}

function cleanDescription(desc) {
    return (
        String(desc || '')
            // Section bullets (▶ ▪ ● • ◆ ★ ☆) become line breaks.
            .replace(/[\u25B6\u25AA\u25CF\u2022\u25A0\u25C6\u2605\u2606]/g, '\n')
            // Drop leftover icons and empty parens left behind by them.
            .replace(/[\u{1F5E1}]/gu, '')
            .replace(/\(\s*\)/g, '')
            .split('\n')
            .map((line) => line.replace(/^[\u25C6\u00B7\u2013\u2014\s]+/, '').trim())
            // Key-press hint lines ("Trigger: key.use while Sneaking") are
            // redundant next to the checkbox titles.
            .filter((line) => !/^Trigger:/i.test(line))
            .filter(Boolean)
            .join('\n')
    );
}

// Replaces #{Common|Uncommon|Rare|Epic|Legendary|Twisted} templates in CZ/Depths
// ability descriptions with the value for the selected rarity index (0-5).
function formatCzDescription(desc, rarity) {
    const KEYBINDS = {
        'key.attack': 'Left Button',
        'key.use': 'Right Button',
        'key.swapOffhand': 'Swap',
        'key.drop': 'Drop',
    };
    return String(desc || '')
        .replace(/#\{([^}]+)\}/g, (match, group) => {
            const values = group.split('|');
            const v = values[rarity] ?? values[values.length - 1];
            return v === undefined ? match : v;
        })
        .replace(/key\.\w+/g, (match) => KEYBINDS[match] || match);
}

// The trees listed on the Celestial Zenith abilities wiki page.
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

export default function BuildForm({
    update,
    build,
    savedState,
    savedName,
    notes,
    canEditNotes,
    buildId,
    parentLoaded,
    itemData,
    itemsToDisplay,
    buildName,
    setBuildName,
    updateLink,
    setUpdateLink,
}) {
    const [stats, setStats] = React.useState({});
    const [charms, setCharms] = React.useState([]);
    const [gameClass, setGameClass] = React.useState('none'); // "class" is a reserved word
    const [skillsData, setSkillsData] = React.useState(null);
    const [skillPoints, setSkillPoints] = React.useState({});
    const [classSelectKey, setClassSelectKey] = React.useState(0);
    const [saveState, setSaveState] = React.useState(null); // 'saving' | 'copied' | 'error'
    const [savedAnonymous, setSavedAnonymous] = React.useState(false);
    // The DB row this build was opened from / saved to; edits update it in
    // place instead of spawning a new link.
    const [activeBuildId, setActiveBuildId] = React.useState(buildId || null);
    const [loggedIn, setLoggedIn] = React.useState(null); // null = checking
    const [notesDraft, setNotesDraft] = React.useState(notes || '');
    const [notesSaveState, setNotesSaveState] = React.useState(null); // 'saving' | 'saved' | 'error'
    const [resetConfirm, setResetConfirm] = React.useState(false);
    const resetTimeoutRef = React.useRef(null);
    const [statInputs, setStatInputs] = React.useState(DEFAULT_STAT_INPUTS);
    const [regionValue, setRegionValue] = React.useState(3);
    const [regionSelectKey, setRegionSelectKey] = React.useState(0);
    const [enhancements, setEnhancements] = React.useState({}); // buff key -> true
    const [spec, setSpec] = React.useState(null); // specialization name
    const [specSelectKey, setSpecSelectKey] = React.useState(0);
    const [specSkillPoints, setSpecSkillPoints] = React.useState({});
    const [czAbilities, setCzAbilities] = React.useState({}); // ability name -> rarity index
    const [czData, setCzData] = React.useState(null);
    const [czOpen, setCzOpen] = React.useState(false);
    const [czSelectedTree, setCzSelectedTree] = React.useState(CZ_MAIN_TREES[0]);
    const [czRarityOpen, setCzRarityOpen] = React.useState(null); // ability name with the rarity menu open
    const [charmStatsOpen, setCharmStatsOpen] = React.useState(false);
    const [delveOpen, setDelveOpen] = React.useState(false);
    const [delveInfusions, setDelveInfusions] = React.useState({}); // slot -> infusion name (always level IV)
    const [revelation, setRevelation] = React.useState(false);
    const [charmSelectKey, setCharmSelectKey] = React.useState(0);
    const [multiplierListKey, setMultiplierListKey] = React.useState(0);

    function statInputChanged(name, event) {
        const next = { ...statInputs, [name]: event.target.value };
        setStatInputs(next);
        recalcAndSyncUrl();
    }

    function revelationChanged(event) {
        setRevelation(event.target.checked);
        // Native checkbox state is already in FormData at this point (see checkboxChanged).
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function delveChanged(slot, option) {
        setDelveInfusions((prev) => {
            const next = { ...prev };
            if (option) {
                next[slot] = option.value;
            } else {
                delete next[slot];
            }
            return next;
        });
        // FormData is stale right after a Select change, so inject the new value
        // manually (same pattern as itemChanged) and recalculate.
        let entries = Array.from(new FormData(formRef.current).entries());
        for (let i = 0; i < entries.length; i++) {
            if (entries[i][0] == `delveInfusion-${slot}`) entries[i][1] = option ? option.value : 'None';
        }
        const itemNames = Object.fromEntries(entries);
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function delveSlotSelects(slot) {
        const hasItem = stats.itemNames && stats.itemNames[slot] && stats.itemNames[slot] !== 'None';
        const cur = delveInfusions[slot];
        // Only one of each infusion: already-picked infusions (on other slots)
        // are removed from this dropdown so they can't be duplicated.
        const pickedElsewhere = new Set(
            Object.entries(delveInfusions)
                .filter(([s]) => s !== slot)
                .map(([, name]) => name)
        );
        const infusionOpts = DELVE_INFUSIONS.filter((i) => i.region <= regionValue && !pickedElsewhere.has(i.name)).map(
            (i) => ({
                value: i.name,
                label: i.name,
            })
        );
        return (
            <div className="mt-3">
                <Select
                    instanceId={`delve-${slot}`}
                    name={`delveInfusion-${slot}`}
                    isDisabled={!hasItem}
                    isClearable
                    isSearchable
                    options={infusionOpts}
                    value={cur ? { value: cur, label: cur } : null}
                    onChange={(opt) => delveChanged(slot, opt)}
                    placeholder="Infusion"
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    theme={infusionSelectTheme}
                    styles={infusionSelectStyles}
                />
            </div>
        );
    }

    function regionChanged(newValue) {
        const raw = newValue ? newValue.value : null;
        // 'dd' = Darkest Depths (Isles' 12+), 'cz' = Celestial Zenith (Ring's 12+).
        const nextRegion = raw === 'dd' ? 2 : raw === 'cz' ? 3 : Number(raw);
        setRegionValue(nextRegion);
        setCzOpen(raw === 'dd' || raw === 'cz');

        // Region gating: Valley (1) has no specializations at all; Valley and
        // Isles (1-2) have no enhancements or charms. Depths abilities only
        // exist in Darkest Depths (Isles) and Celestial Zenith (Ring).
        let nextSpec = spec;
        let nextSpecPoints = specSkillPoints;
        let nextEnhancements = enhancements;
        let nextCharms = charms;
        let nextCz = czAbilities;
        if (nextRegion === 1) {
            nextSpec = null;
            nextSpecPoints = {};
            setSpec(null);
            setSpecSelectKey((k) => k + 1);
            setSpecSkillPoints({});
            nextCz = {};
            setCzAbilities({});
            setCzOpen(false);
        }
        if (nextRegion < 3) {
            nextEnhancements = {};
            nextCharms = [];
            setEnhancements({});
            setCharms([]);
        }
        if (nextRegion === 2) {
            // Prismatic is Celestial Zenith-only (not available in the Depths).
            nextCz = Object.fromEntries(
                Object.entries(nextCz).filter(
                    ([name]) =>
                        !czData?.trees?.some((t) => t.tree === 'Prismatic' && t.skills.some((s) => s.name === name))
                )
            );
            setCzAbilities(nextCz);
            if (czSelectedTree === 'Prismatic') {
                setCzSelectedTree(CZ_MAIN_TREES[0]);
            }
        }
        refreshClassBuffs(skillPoints, nextSpecPoints, nextEnhancements);
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    React.useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        };
    }, []);

    function handleResetClick() {
        if (!resetConfirm) {
            setResetConfirm(true);
            if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = setTimeout(() => setResetConfirm(false), 2500);
            return;
        }
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        setResetConfirm(false);
        resetForm();
    }

    const currentClassSkills = (() => {
        if (!skillsData || !Array.isArray(skillsData.classes) || gameClass == 'none') return [];
        const cls = skillsData.classes.find((c) => (c.className || '').toLowerCase() == gameClass);
        return cls ? cls.skills || [] : [];
    })();

    const currentSpecOptions = (() => {
        if (!skillsData || !Array.isArray(skillsData.classes) || gameClass == 'none') return [];
        const cls = skillsData.classes.find((c) => (c.className || '').toLowerCase() == gameClass);
        return (cls?.specs || []).map((s) => ({ value: s.specName, label: s.specName }));
    })();

    const currentSpecSkills = (() => {
        if (!skillsData || !Array.isArray(skillsData.classes) || gameClass == 'none' || !spec) return [];
        const cls = skillsData.classes.find((c) => (c.className || '').toLowerCase() == gameClass);
        const specData = cls?.specs?.find((s) => s.specName == spec);
        return specData ? specData.specSkills || [] : [];
    })();

    // Rebuild the class-ability buff flags from skill points, spec skill
    // points, and the enhancement checkboxes. The stat engine reads these.
    function refreshClassBuffs(nextSkillPoints, nextSpecPoints, nextEnhancements) {
        Object.keys(enabledClassAbilityBuffs).forEach((key) => {
            enabledClassAbilityBuffs[key] = false;
        });
        for (const [id, pts] of Object.entries(nextSkillPoints)) {
            const buffKey = skillBuffKeys[id];
            if (!buffKey) continue;
            enabledClassAbilityBuffs[buffKey] = pts >= 1;
            enabledClassAbilityBuffs[`${buffKey}_lv1`] = pts >= 1;
            enabledClassAbilityBuffs[`${buffKey}_lv2`] = pts >= 2;
        }
        for (const [id, pts] of Object.entries(nextSpecPoints)) {
            const buffKey = specSkillBuffKeys[id];
            if (!buffKey) continue;
            enabledClassAbilityBuffs[`${buffKey}_lv1`] = pts >= 1;
            enabledClassAbilityBuffs[`${buffKey}_lv2`] = pts >= 2;
            enabledClassAbilityBuffs[`${buffKey}_burst`] = pts >= 3;
        }
        for (const skillId of Object.keys(nextEnhancements)) {
            const buffKey = skillBuffKeys[skillId];
            if (!buffKey) continue;
            if ((nextSkillPoints[skillId] || 0) >= 1) {
                enabledClassAbilityBuffs[`${buffKey}_enhancement`] = true;
            }
        }
    }

    function recalcBuildStats() {
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function skillPointClicked(skillId, pointIndex) {
        const current = skillPoints[skillId] || 0;
        const want = pointIndex + 1;
        const next = current === want ? pointIndex : want;
        const nextPoints = { ...skillPoints, [skillId]: next };
        if (next === 0) delete nextPoints[skillId];
        setSkillPoints(nextPoints);
        // Enhancements require at least one point in the skill.
        let nextEnhancements = enhancements;
        if (next === 0 && enhancements[skillId]) {
            nextEnhancements = { ...enhancements };
            delete nextEnhancements[skillId];
            setEnhancements(nextEnhancements);
        }
        refreshClassBuffs(nextPoints, specSkillPoints, nextEnhancements);
        recalcBuildStats();
    }

    function specSkillPointClicked(skillId, pointIndex) {
        const current = specSkillPoints[skillId] || 0;
        const want = pointIndex + 1;
        const next = current === want ? pointIndex : want;
        const nextPoints = { ...specSkillPoints, [skillId]: next };
        if (next === 0) delete nextPoints[skillId];
        setSpecSkillPoints(nextPoints);
        refreshClassBuffs(skillPoints, nextPoints, enhancements);
        recalcBuildStats();
    }

    function setAllSkillPoints(points) {
        const next = {};
        let nextEnhancements = enhancements;
        if (!points) {
            nextEnhancements = {};
        }
        currentClassSkills.forEach((skill) => {
            const maxPoints = Math.max(0, (skill.descriptions || []).length - 1);
            if (points && maxPoints > 0) next[skill.scoreboardId] = maxPoints;
        });
        setSkillPoints(next);
        if (!points) setEnhancements({});
        refreshClassBuffs(next, specSkillPoints, nextEnhancements);
        recalcBuildStats();
    }

    function enhancementToggled(skillId, checked) {
        // Enhancing a skill requires at least one point in it.
        if (checked && (skillPoints[skillId] || 0) < 1) return;
        const next = { ...enhancements };
        if (checked) next[skillId] = true;
        else delete next[skillId];
        setEnhancements(next);
        refreshClassBuffs(skillPoints, specSkillPoints, next);
        recalcBuildStats();
    }

    function specChanged(newValue, actionMeta) {
        const specName = newValue ? newValue.value : null;
        setSpec(specName);
        setSpecSelectKey((k) => k + 1);
        setSpecSkillPoints({});
        refreshClassBuffs(skillPoints, {}, enhancements);
        recalcBuildStats();
    }

    function czChanged(abilityName, rarity) {
        // rarity null/undefined deselects; otherwise 0-5 (Common..Twisted).
        const next = { ...czAbilities };
        if (rarity === null || rarity === undefined) delete next[abilityName];
        else next[abilityName] = rarity;
        setCzAbilities(next);
    }

    function clearCz() {
        setCzAbilities({});
    }

    // Save the current build. Opening a saved build (or having saved one this
    // session) updates that row in place - same link, name and notes included.
    // A fresh build POSTs and moves onto its new short link.
    React.useEffect(() => {
        fetch('/api/auth/session')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => setLoggedIn(Boolean(d && d.user)))
            .catch(() => setLoggedIn(false));
    }, []);

    function saveBuildToServer() {
        const token = makeBuildString();
        const tokenVersion = getBuildTokenVersion(token) ?? '';
        const payload = {
            token,
            infusions: delveInfusions,
            revelation,
            name: buildName !== 'Monumenta Builder' ? buildName : null,
            notes: notesDraft.trim() ? notesDraft : null,
        };

        if (activeBuildId) {
            setSaveState('saving');
            setSavedAnonymous(false);
            return fetch(`/api/v1/builds/${activeBuildId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: { token, infusions: delveInfusions, revelation },
                    name: payload.name,
                    notes: payload.notes,
                }),
            })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
                .then(() => {
                    const link = window.location.origin + getStsBase() + `/b/v${tokenVersion}/${activeBuildId}`;
                    setSaveState('copied');
                    setSavedAnonymous(false);
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(link).catch(() => {});
                    }
                    setTimeout(() => setSaveState(null), 4000);
                    return link;
                })
                .catch(() => {
                    setSaveState('error');
                    throw new Error('save failed');
                });
        }

        setSaveState('saving');
        setSavedAnonymous(false);
        return fetch('/api/v1/builds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then((d) => {
                const link = window.location.origin + getStsBase() + d.url;
                // Remember the row so later edits update it instead of forking.
                setActiveBuildId(d.id);
                setSaveState('copied');
                if (d.savedToAccount) {
                    setSavedAnonymous(false);
                } else {
                    setSavedAnonymous(true);
                    setTimeout(() => setSavedAnonymous(false), 7000);
                }
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(link).catch(() => {});
                }
                setTimeout(() => setSaveState(null), 4000);
                return link;
            })
            .catch(() => {
                setSaveState('error');
                throw new Error('save failed');
            });
    }

    function copyBuildDiscord(event) {
        saveBuildToServer()
            .then((link) => {
                event.target.value = 'Copied!';
                event.target.classList.add('fw-bold');
                setTimeout(() => {
                    event.target.value = 'Copy link for Discord';
                    event.target.classList.remove('fw-bold');
                }, 3000);
                if (!navigator.clipboard) {
                    window.alert("Couldn't copy build to clipboard. Sadness. :(");
                    return;
                }
                const classLabel = gameClass != 'none' ? gameClass.charAt(0).toUpperCase() + gameClass.slice(1) : null;
                const tempBuildName =
                    buildName && buildName != 'Monumenta Builder'
                        ? buildName
                        : classLabel
                          ? `R${regionValue} ${spec || classLabel} build`
                          : 'Monumenta Builder';
                navigator.clipboard.writeText(`[${tempBuildName}](${link})`).then(
                    function () {
                        console.log('Copying to clipboard was successful!');
                    },
                    function (err) {
                        console.error('Could not copy text: ', err);
                    }
                );
            })
            .catch(() => {});
    }

    function saveNotes() {
        if (!activeBuildId) return;
        setNotesSaveState('saving');
        fetch(`/api/v1/builds/${activeBuildId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: notesDraft }),
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then(() => {
                setNotesSaveState('saved');
                setTimeout(() => setNotesSaveState(null), 2500);
            })
            .catch(() => setNotesSaveState('error'));
    }

    React.useEffect(() => {
        fetch('/api/v1/skills')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d && Array.isArray(d.classes)) setSkillsData(d);
            })
            .catch(() => {});
    }, []);

    React.useEffect(() => {
        fetch('/api/v1/cz')
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (d && Array.isArray(d.trees)) setCzData(d);
            })
            .catch(() => {});
    }, []);

    // Prismatic abilities only exist in Celestial Zenith (Ring); drop them when
    // planning a Darkest Depths (Isles) build, once the data is known.
    React.useEffect(() => {
        if (!czData || regionValue !== 2 || Object.keys(czAbilities).length === 0) return;
        const prismaticNames = new Set(
            czData.trees.find((t) => t.tree === 'Prismatic')?.skills.map((s) => s.name) || []
        );
        const next = Object.fromEntries(Object.entries(czAbilities).filter(([name]) => !prismaticNames.has(name)));
        if (Object.keys(next).length !== Object.keys(czAbilities).length) {
            setCzAbilities(next);
        }
    }, [czData, regionValue]);

    // Close the open rarity menu when clicking elsewhere (but not inside the
    // menu or its button — a mousedown there must survive until the click).
    React.useEffect(() => {
        if (!czRarityOpen) return;
        const close = (e) => {
            if (e.target && e.target.closest && e.target.closest('[class*="czRarityWrap"]')) return;
            setCzRarityOpen(null);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [czRarityOpen]);

    function sendUpdate(event) {
        event.preventDefault();
        const itemNames = Object.fromEntries(new FormData(event.target).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    React.useEffect(() => {
        if (parentLoaded && build) {
            const decoded = decodeBuildParam(build, itemData);
            if (!decoded) return;
            let buildParts = decodeURI(decoded).split('&');
            let itemNames = {
                mainhand: buildParts.find((str) => str.includes('m='))?.split('m=')[1],
                offhand: buildParts.find((str) => str.includes('o='))?.split('o=')[1],
                helmet: buildParts.find((str) => str.includes('h='))?.split('h=')[1],
                chestplate: buildParts.find((str) => str.includes('c='))?.split('c=')[1],
                leggings: buildParts.find((str) => str.includes('l='))?.split('l=')[1],
                boots: buildParts.find((str) => str.includes('b='))?.split('b=')[1],
            };
            Object.keys(itemNames).forEach((type) => {
                if (itemNames[type] === undefined || !Object.keys(itemData).includes(itemNames[type])) {
                    itemNames[type] = 'None';
                }
            });
            let charmString = buildParts.find((str) => str.includes('charm='));
            if (charmString) {
                // decodeURIComponent: decodeURI leaves %2C (comma) encoded since it's a reserved char
                let charmList = CharmShortener.parseCharmData(
                    decodeURIComponent(charmString.split('charm=')[1]),
                    itemData
                );

                // Cap the restored list to the 12-power charm limit.
                let cappedList = [];
                let powerCount = 0;
                charmList.forEach((name) => {
                    if (powerCount + (itemData[name]?.power || 0) <= 12) {
                        powerCount += itemData[name]?.power || 0;
                        cappedList.push(name);
                    }
                });

                // dunno what happened here but i needed to change this to have the map()
                // so it's passing a list of charm objects, not charm names
                // idk why it worked before and stopped working now, but this fixes it
                setCharms(cappedList.map((name) => itemData[name]));
            }

            // class + skill points from the URL
            let classPart = buildParts.find((str) => str.includes('cl='));
            if (classPart) {
                const cls = classPart.split('cl=')[1];
                if (cls) {
                    setGameClass(cls.toLowerCase());
                    setClassSelectKey((k) => k + 1);
                }
            }
            let skPart = buildParts.find((str) => str.includes('sk='));
            let loadedSkillPoints = {};
            if (skPart) {
                const nextPoints = {};
                decodeURIComponent(skPart.split('sk=')[1])
                    .split(',')
                    .forEach((part) => {
                        const [id, pts] = part.split(':');
                        const points = Number(pts);
                        if (id && Number.isInteger(points) && points > 0) nextPoints[id] = points;
                    });
                loadedSkillPoints = nextPoints;
                setSkillPoints(nextPoints);
            }
            let spPart = buildParts.find((str) => str.includes('sp='));
            if (spPart) {
                const specName = decodeURIComponent(spPart.split('sp=')[1]);
                if (specName) {
                    setSpec(specName);
                    setSpecSelectKey((k) => k + 1);
                }
            }
            let sskPart = buildParts.find((str) => str.includes('ssk='));
            let loadedSpecPoints = {};
            if (sskPart) {
                const nextPoints = {};
                decodeURIComponent(sskPart.split('ssk=')[1])
                    .split(',')
                    .forEach((part) => {
                        const [id, pts] = part.split(':');
                        const points = Number(pts);
                        if (id && Number.isInteger(points) && points > 0) nextPoints[id] = points;
                    });
                loadedSpecPoints = nextPoints;
                setSpecSkillPoints(nextPoints);
            }
            let enPart = buildParts.find((str) => str.includes('en='));
            let loadedEnhancements = {};
            if (enPart) {
                const nextEnhancements = {};
                decodeURIComponent(enPart.split('en=')[1])
                    .split(',')
                    .forEach((key) => {
                        if (key) nextEnhancements[key] = true;
                    });
                loadedEnhancements = nextEnhancements;
                setEnhancements(nextEnhancements);
            }
            let czPart = buildParts.find((str) => str.includes('cz='));
            let nextCz = {};
            if (czPart) {
                const parsedCz = {};
                decodeURIComponent(czPart.split('cz=')[1])
                    .split(',')
                    .forEach((part) => {
                        const [name, rarityRaw] = part.split(':');
                        const rarity = rarityRaw === undefined ? 0 : Number(rarityRaw);
                        if (name && Number.isInteger(rarity) && rarity >= 0 && rarity < 6) {
                            parsedCz[name] = rarity;
                        }
                    });
                nextCz = parsedCz;
                setCzAbilities(parsedCz);
                setCzOpen(true);
            }
            // Skills that were removed from the API: drop their points from the
            // form so the counters stay honest (the original URL is untouched
            // until the user edits and the link is rewritten).
            // Only filter when the skills data is already loaded: parentLoaded
            // fires before the /api/v1/skills fetch resolves, and filtering
            // against an empty skill set would wipe every loaded point. The
            // cleanup effect below re-filters once the data arrives.
            const loadedClass = classPart?.split('cl=')[1] || null;
            const loadedSpec = spPart ? decodeURIComponent(spPart.split('sp=')[1]) : null;
            const classData = skillsData?.classes?.find(
                (c) => (c.className || '').toLowerCase() == (loadedClass || '').toLowerCase()
            );
            if (skillsData && classData) {
                const knownSkillIds = new Set((classData.skills || []).map((s) => s.scoreboardId));
                const specData = loadedSpec ? classData.specs?.find((s) => s.specName == loadedSpec) : null;
                const knownSpecSkillIds = new Set((specData?.specSkills || []).map((s) => s.scoreboardId));
                loadedSkillPoints = Object.fromEntries(
                    Object.entries(loadedSkillPoints).filter(([id]) => knownSkillIds.has(id))
                );
                loadedSpecPoints = Object.fromEntries(
                    Object.entries(loadedSpecPoints).filter(([id]) => knownSpecSkillIds.has(id))
                );
                setSkillPoints(loadedSkillPoints);
                setSpecSkillPoints(loadedSpecPoints);
            }

            refreshClassBuffs(loadedSkillPoints, loadedSpecPoints, loadedEnhancements);
            // extra stat inputs (health/tenacity/vitality/vigor/focus/perspicacity/region)
            const statValues = {};
            for (const key of STAT_KEYS) {
                const part = buildParts.find((str) => str.startsWith(`${key}=`));
                if (part) statValues[key] = part.split('=')[1];
            }
            if (statValues.health !== undefined) {
                statValues.health = String(Math.max(1, Number(statValues.health)));
            }
            if (Object.keys(statValues).length > 0) {
                setStatInputs((prev) => ({ ...DEFAULT_STAT_INPUTS, ...statValues }));
                if (statValues.region !== undefined) {
                    const regionNum = Number(statValues.region);
                    if ([1, 2, 3].includes(regionNum)) {
                        setRegionValue(regionNum);
                        setRegionSelectKey((k) => k + 1);
                    }
                }
            }

            // Saved builds carry the delve infusions + Revelation checkbox in
            // the DB (they are not part of the URL token); restore them here.
            const loadedDelve = {};
            if (savedState && savedState.infusions && typeof savedState.infusions === 'object') {
                const loadedRegion = Number(statValues.region) || 3;
                for (const [slot, infusion] of Object.entries(savedState.infusions)) {
                    const ok = DELVE_INFUSIONS.some((i) => i.name === infusion && i.region <= loadedRegion);
                    if (ok) loadedDelve[slot] = infusion;
                }
                if (Object.keys(loadedDelve).length > 0) {
                    setDelveInfusions(loadedDelve);
                    setDelveOpen(true);
                }
            }
            const loadedRevelation = Boolean(savedState && savedState.revelation);
            if (loadedRevelation) setRevelation(true);

            // A build renamed on the "My Builds" page stores its display name in
            // the DB; surface it in the header so re-saving keeps the new name.
            if (savedName) {
                setBuildName(savedName);
            }

            const delveEntries = {};
            for (const [slot, infusion] of Object.entries(loadedDelve)) {
                delveEntries[`delveInfusion-${slot}`] = infusion;
            }

            const tempStats = recalcBuild(
                {
                    ...itemNames,
                    ...statValues,
                    ...delveEntries,
                    ...(loadedRevelation ? { revelation: '1' } : {}),
                },
                itemData
            );
            setStats(tempStats);
            update(tempStats);

            // Region gating: drop whatever the loaded region forbids (see regionChanged).
            const loadedRegion = Number(statValues.region) || 3;
            if (loadedRegion === 1) {
                setSpec(null);
                setSpecSelectKey((k) => k + 1);
                setSpecSkillPoints({});
                setEnhancements({});
                setCharms([]);
                setCzAbilities({});
                setCzOpen(false);
                refreshClassBuffs({}, {}, {});
            } else if (loadedRegion < 3) {
                setEnhancements({});
                setCharms([]);
                refreshClassBuffs(skillPoints, specSkillPoints, {});
            }
            if (loadedRegion === 2) {
                const prismaticOnly = Object.keys(nextCz).filter((name) =>
                    czData?.trees?.some((t) => t.tree === 'Prismatic' && t.skills.some((s) => s.name === name))
                );
                if (prismaticOnly.length > 0) {
                    const cleaned = { ...nextCz };
                    prismaticOnly.forEach((name) => delete cleaned[name]);
                    setCzAbilities(cleaned);
                }
            }
        }
    }, [parentLoaded]);

    // Once the skills data is known (it loads async, after parentLoaded), drop
    // points for skills that no longer exist in the API. Only removes unknown
    // skills, so it never clobbers user edits or loaded points for known skills.
    React.useEffect(() => {
        if (!skillsData || !Array.isArray(skillsData.classes) || gameClass === 'none') return;
        const cls = skillsData.classes.find((c) => (c.className || '').toLowerCase() === gameClass);
        if (!cls) return;

        const knownSkillIds = new Set((cls.skills || []).map((s) => s.scoreboardId));
        const filteredSkills = Object.fromEntries(Object.entries(skillPoints).filter(([id]) => knownSkillIds.has(id)));
        let changed = Object.keys(filteredSkills).length !== Object.keys(skillPoints).length;

        let nextSpecPoints = specSkillPoints;
        const specData = spec ? cls.specs?.find((s) => s.specName === spec) : null;
        const knownSpecSkillIds = new Set((specData?.specSkills || []).map((s) => s.scoreboardId));
        const filteredSpecPoints = Object.fromEntries(
            Object.entries(specSkillPoints).filter(([id]) => knownSpecSkillIds.has(id))
        );
        if (Object.keys(filteredSpecPoints).length !== Object.keys(specSkillPoints).length) {
            nextSpecPoints = filteredSpecPoints;
            changed = true;
        }

        if (changed) {
            setSkillPoints(filteredSkills);
            setSpecSkillPoints(nextSpecPoints);
            refreshClassBuffs(filteredSkills, nextSpecPoints, enhancements);
        }
    }, [skillsData, gameClass, spec, skillPoints, specSkillPoints, enhancements]);

    const formRef = React.useRef();
    const itemRefs = {
        mainhand: React.useRef(),
        offhand: React.useRef(),
        helmet: React.useRef(),
        chestplate: React.useRef(),
        leggings: React.useRef(),
        boots: React.useRef(),
    };

    function resetForm(event) {
        for (let ref in itemRefs) {
            itemRefs[ref].current.setValue({ value: 'None', label: 'None' });
        }
        setGameClass('none');
        setClassSelectKey((k) => k + 1);
        setSkillPoints({});
        setSpec(null);
        setSpecSelectKey((k) => k + 1);
        setSpecSkillPoints({});
        setEnhancements({});
        refreshClassBuffs({}, {}, {});
        setStatInputs(DEFAULT_STAT_INPUTS);
        setRegionValue(3);
        setRegionSelectKey((k) => k + 1);
        setCharms([]);
        setCharmSelectKey((k) => k + 1);
        setDelveInfusions({});
        setRevelation(false);
        setCzAbilities({});
        setCzSelectedTree(CZ_MAIN_TREES[0]);
        setBuildName('Monumenta Builder');
        setActiveBuildId(null);
        for (let box in enabledBoxes) {
            enabledBoxes[box] = false;
        }
        for (let key in extraStats) {
            extraStats[key] = [];
        }
        setMultiplierListKey((k) => k + 1);
        const tempStats = recalcBuild(emptyBuild, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function receiveMasterworkUpdate(newActiveItem, itemType) {
        let newBuild = {};
        for (let ref in itemRefs) {
            newBuild[ref] = itemRefs[ref].current.getValue()[0].value;
        }
        let mainhands = [
            'mainhand',
            'mainhand sword',
            'mainhand shield',
            'axe',
            'pickaxe',
            'wand',
            'scythe',
            'bow',
            'crossbow',
            'snowball',
            'trident',
            'alchemist bag',
        ];
        let offhands = ['offhand', 'offhand shield', 'offhand sword'];
        let actualItemType = mainhands.includes(itemType.toLowerCase())
            ? 'mainhand'
            : offhands.includes(itemType.toLowerCase())
              ? 'offhand'
              : itemType.toLowerCase();

        newBuild[actualItemType.toLowerCase()] = `${newActiveItem.name}-${newActiveItem.masterwork}`;
        itemRefs[actualItemType.toLowerCase()].current.setValue({
            value: `${newActiveItem.name}-${newActiveItem.masterwork}`,
            label: newActiveItem.name,
        });

        const tempStats = recalcBuild(newBuild, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function getEquipName(type) {
        const decoded = decodeBuildParam(build, itemData);
        if (!decoded) return undefined;
        let buildParts = decodeURI(decoded).split('&');
        let allowedTypes = ['mainhand', 'offhand', 'helmet', 'chestplate', 'leggings', 'boots'];
        let name = allowedTypes.includes(type)
            ? buildParts.find((str) => str.includes(`${type[0]}=`))?.split(`${type[0]}=`)[1]
            : 'None';
        if (!Object.keys(itemData).includes(name)) {
            return { value: 'None', label: 'None' };
        }
        return { value: name, label: removeMasterworkFromName(name) };
    }

    function makeBuildString(charmsOverride, dataOverride, classOverride, skillsOverride, stateOverride) {
        const keysToShare = ['mainhand', 'offhand', 'helmet', 'chestplate', 'leggings', 'boots'];

        let entries;
        if (dataOverride) {
            if (typeof dataOverride[Symbol.iterator] === 'function') {
                entries = Array.from(dataOverride);
            } else {
                entries = Object.entries(dataOverride);
            }
        } else {
            entries = Array.from(new FormData(formRef.current).entries());
        }

        let legacy = '';
        for (const [key, value] of entries) {
            if (!keysToShare.includes(key)) continue;
            legacy += `${key[0]}=${encodeURIComponent(String(value))}&`;
        }
        for (const key of STAT_KEYS) {
            const entry = entries.find(([k]) => k === key);
            if (entry) legacy += `${key}=${encodeURIComponent(String(entry[1]))}&`;
        }

        const charmsToLookAt = charmsOverride ? charmsOverride : charms;
        if (!charmsToLookAt || charmsToLookAt.length === 0) {
            legacy += 'charm=None';
        } else {
            legacy += `charm=${encodeURIComponent(CharmShortener.shortenCharmList(charmsToLookAt))}`;
        }

        if (buildName != 'Monumenta Builder') {
            legacy += `&name=${encodeURIComponent(buildName)}`;
        }

        const classForUrl = classOverride ?? gameClass;
        if (classForUrl != 'none') {
            const cls = classForUrl.charAt(0).toUpperCase() + classForUrl.slice(1);
            legacy += `&cl=${encodeURIComponent(cls)}`;
        }

        const skillsForUrl = skillsOverride ?? Object.entries(skillPoints).filter(([, pts]) => pts > 0);
        if (skillsForUrl.length > 0) {
            legacy += `&sk=${skillsForUrl.map(([id, pts]) => `${id}:${pts}`).join(',')}`;
        }

        if (gameClass != 'none') {
            const specForUrl = stateOverride?.spec !== undefined ? stateOverride.spec : spec;
            if (specForUrl) {
                legacy += `&sp=${encodeURIComponent(specForUrl)}`;
            }
            const specSkillsForUrl = stateOverride?.specSkills
                ? Object.entries(stateOverride.specSkills).filter(([, pts]) => pts > 0)
                : Object.entries(specSkillPoints).filter(([, pts]) => pts > 0);
            if (specSkillsForUrl.length > 0) {
                legacy += `&ssk=${specSkillsForUrl.map(([id, pts]) => `${id}:${pts}`).join(',')}`;
            }
        }

        const enForUrl = stateOverride?.enhancements
            ? Object.keys(stateOverride.enhancements)
            : Object.keys(enhancements);
        if (enForUrl.length > 0) {
            legacy += `&en=${enForUrl.join(',')}`;
        }

        const czForUrl = stateOverride?.czAbilities
            ? Object.entries(stateOverride.czAbilities)
            : Object.entries(czAbilities);
        if (czForUrl.length > 0) {
            legacy += `&cz=${encodeURIComponent(
                czForUrl.map(([name, r]) => (r > 0 ? `${name}:${r}` : name)).join(',')
            )}`;
        }

        return encodeBuildParam(legacy);
    }

    function checkboxChanged(event) {
        const name = event.target.name.replace(' ', '_').replace(/[()]/g, ''); // replace spaces so we can still have them visually without breaking existing stuff
        enabledBoxes[name] = event.target.checked;
        let temp = event.target.checked;
        const retaliationtypes = ['retaliation_normal', 'retaliation_elite', 'retaliation_boss'];
        if (retaliationtypes.includes(name)) {
            retaliationtypes.forEach((type) => {
                enabledBoxes[type] = false;
                setCheckboxChecked(event.target.form, type.split('_')[0] + ' (' + type.split('_')[1] + ')', false);
            });
            enabledBoxes[name] = temp;
            event.target.checked = temp;
        }
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function getCheckboxRef(form, name) {
        return form[Object.keys(form).find((key) => form[key].type == 'checkbox' && form[key].name == name)];
    }

    function setCheckboxChecked(form, name, checked) {
        getCheckboxRef(form, name).checked = checked;
    }

    function multipliersChanged(newMultipliers, name) {
        extraStats[name] = newMultipliers;
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function damageMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, 'damageMultipliers');
    }

    function resistanceMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, 'resistanceMultipliers');
    }

    function healthMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, 'healthMultipliers');
    }

    function speedMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, 'speedMultipliers');
    }
    function attackSpeedMultipliersChanged(newMultipliers) {
        multipliersChanged(newMultipliers, 'attackSpeedMultipliers');
    }

    function updateCharms(charmNames) {
        let charmData = charmNames
            .map((name) => {
                if (itemData[name]) return itemData[name];
                const key = resolveCharmKey(itemData, name);
                return key ? itemData[key] : null;
            })
            .filter(Boolean);
        setCharms(charmData);
    }

    function removeCharm(charm) {
        updateCharms(charms.filter((c) => c.name !== charm.name).map((c) => c.name));
    }

    function itemChanged(newValue, actionMeta) {
        // This is here so you don't have to scroll down to "Recalculate" and then back up to click a situational.
        // It updates the whole form. I don't think this was the original intent but checkboxes do anyway
        // so may as well. However, it's kind of awkward because the FormData.entries() does not yet contain
        // the new value of the item that was just changed, so we have to get it ourselves.
        // Unlike most event handler props, Select's `onChange` does not pass an event.
        // It instead passes the new value of the Select, and an "action meta" containing the checkbox name (and other stuff).
        // Why is this not condensed into an event containing both of these and a ref to the target? Beats me. -LC
        let entries = Array.from(new FormData(formRef.current).entries());
        for (let i = 0; i < entries.length; i++) {
            if (entries[i][0] == actionMeta.name) entries[i][1] = newValue.value;
        }
        const itemNames = Object.fromEntries(entries);
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    function classChanged(newValue, actionMeta) {
        // no need to check actionmeta because theres only one class dropdown
        let newClass = newValue.value.toLowerCase();
        setGameClass(newClass);
        setSkillPoints({});
        setSpec(null);
        setSpecSelectKey((k) => k + 1);
        setSpecSkillPoints({});
        setEnhancements({});
        refreshClassBuffs({}, {}, {});
        // and then recalculate... zzz
        const itemNames = Object.fromEntries(new FormData(formRef.current).entries());
        const tempStats = recalcBuild(itemNames, itemData);
        setStats(tempStats);
        update(tempStats);
    }

    const miscStats = [
        { type: 'armor', name: 'builder.stats.misc.armor', percent: false },
        { type: 'agility', name: 'builder.stats.misc.agility', percent: false },
        { type: 'speedPercent', name: 'builder.stats.misc.speed', percent: true },
        { type: 'knockbackRes', name: 'builder.stats.misc.kbResistance', percent: true },
        { type: 'thorns', name: 'builder.stats.misc.thorns', percent: false },
        { type: 'fireTickDamage', name: 'builder.stats.misc.fireTickDamage', percent: false },
        { type: 'spellCooldownPercent', name: 'builder.stats.magic.spellCooldownPercent', percent: true },
    ];
    const healthStats = [
        { type: 'healthFinal', name: 'builder.stats.health.healthFinal', percent: false },
        { type: 'currentHealth', name: 'builder.stats.health.currentHealth', percent: false },
        { type: 'healingRate', name: 'builder.stats.health.healingRate', percent: true },
        { type: 'effHealingRate', name: 'builder.stats.health.effectiveHealingRate', percent: true },
        { type: 'regenPerSec', name: 'builder.stats.health.regenPerSecond', percent: false },
        { type: 'regenPerSecPercent', name: 'builder.stats.health.regenPerSecondPercent', percent: true },
        { type: 'lifeDrainOnCrit', name: 'builder.stats.health.lifeDrainOnCrit', percent: false },
        { type: 'lifeDrainOnCritPercent', name: 'builder.stats.health.lifeDrainOnCritPercent', percent: true },
    ];
    const DRStats = [
        { type: 'meleeDR', name: 'builder.stats.dr-ehp.melee', percent: true },
        { type: 'projectileDR', name: 'builder.stats.dr-ehp.projectile', percent: true },
        { type: 'magicDR', name: 'builder.stats.dr-ehp.magic', percent: true },
        { type: 'blastDR', name: 'builder.stats.dr-ehp.blast', percent: true },
        { type: 'fireDR', name: 'builder.stats.dr-ehp.fire', percent: true },
        { type: 'fallDR', name: 'builder.stats.dr-ehp.fall', percent: true },
        { type: 'ailmentDR', name: 'builder.stats.dr-ehp.ailment', percent: true },
    ];
    const healthNormalizedDRStats = [
        { type: 'meleeHNDR', name: 'builder.stats.dr-ehp.melee', percent: true },
        { type: 'projectileHNDR', name: 'builder.stats.dr-ehp.projectile', percent: true },
        { type: 'magicHNDR', name: 'builder.stats.dr-ehp.magic', percent: true },
        { type: 'blastHNDR', name: 'builder.stats.dr-ehp.blast', percent: true },
        { type: 'fireHNDR', name: 'builder.stats.dr-ehp.fire', percent: true },
        { type: 'fallHNDR', name: 'builder.stats.dr-ehp.fall', percent: true },
        { type: 'ailmentHNDR', name: 'builder.stats.dr-ehp.ailment', percent: true },
    ];
    const EHPStats = [
        { type: 'meleeEHP', name: 'builder.stats.dr-ehp.melee', percent: false },
        { type: 'projectileEHP', name: 'builder.stats.dr-ehp.projectile', percent: false },
        { type: 'magicEHP', name: 'builder.stats.dr-ehp.magic', percent: false },
        { type: 'blastEHP', name: 'builder.stats.dr-ehp.blast', percent: false },
        { type: 'fireEHP', name: 'builder.stats.dr-ehp.fire', percent: false },
        { type: 'fallEHP', name: 'builder.stats.dr-ehp.fall', percent: false },
        { type: 'ailmentEHP', name: 'builder.stats.dr-ehp.ailment', percent: false },
    ];
    const meleeStats = [
        { type: 'attackSpeedPercent', name: 'builder.stats.melee.attackSpeedPercent', percent: true },
        { type: 'attackSpeed', name: 'builder.stats.melee.attackSpeed', percent: false },
        { type: 'attackDamagePercent', name: 'builder.stats.melee.attackDamagePercent', percent: true },
        { type: 'classAttackDamagePercent', name: 'builder.stats.melee.classAttackDamagePercent', percent: true },
        { type: 'attackDamage', name: 'builder.stats.melee.attackDamage', percent: false },
        { type: 'attackDamageCrit', name: 'builder.stats.melee.attackDamageCrit', percent: false },
        { type: 'iframeDPS', name: 'builder.stats.melee.iframeDps', percent: false },
        { type: 'iframeCritDPS', name: 'builder.stats.melee.iframeCritDps', percent: false },
        { type: 'critSpamDPS', name: 'builder.stats.melee.critSpamDPS', percent: false },
    ];
    const projectileStats = [
        { type: 'projectileDamagePercent', name: 'builder.stats.projectile.projectileDamagePercent', percent: true },
        {
            type: 'classProjectileDamagePercent',
            name: 'builder.stats.projectile.classProjectileDamagePercent',
            percent: true,
        },
        { type: 'projectileDamage', name: 'builder.stats.projectile.projectileDamage', percent: false },
        { type: 'projectileSpeedPercent', name: 'builder.stats.projectile.projectileSpeedPercent', percent: true },
        { type: 'projectileSpeed', name: 'builder.stats.projectile.projectileSpeed', percent: false },
        { type: 'throwRatePercent', name: 'builder.stats.projectile.throwRatePercent', percent: true },
        { type: 'throwRate', name: 'builder.stats.projectile.throwRate', percent: false },
    ];
    const magicStats = [
        { type: 'magicDamagePercent', name: 'builder.stats.magic.magicDamagePercent', percent: true },
        { type: 'classMagicDamagePercent', name: 'builder.stats.magic.classMagicDamagePercent', percent: true },
        // { type: "spellPowerPercent", name: "builder.stats.magic.spellPowerPercent", percent: true },
        // technically for consistency having this ^ line here doesn't make sense because it's like if
        // melee stats listed "weapon base attack damage" as a line
        // but i might re add it anyway if people don't like it being removed

        // one of these two gets hidden later depending on if potion damage exists
        // spell is only for wands, potion is only for alch bags
        { type: 'spellDamage', name: 'builder.stats.magic.spellDamage', percent: true },
        { type: 'potionDamage', name: 'builder.stats.magic.potionDamage', percent: false },
    ];

    React.useEffect(() => {
        if (updateLink) {
            // The name edit no longer rewrites the URL; it just clears the flag.
            setUpdateLink(false);
        }
    }, [updateLink]);

    const czAllSkills = czData ? czData.trees.flatMap((t) => t.skills) : [];
    const czAbilityMap = new Map(czAllSkills.map((s) => [s.name, s]));
    const czActiveCount = Object.keys(czAbilities).filter(
        (name) => czAbilityMap.get(name)?.trigger && czAbilityMap.get(name).trigger !== 'Passive'
    ).length;
    const czTrees = czData
        ? czData.trees
              .filter((t) => CZ_MAIN_TREES.includes(t.tree))
              .filter((t) => regionValue !== 2 || t.tree !== 'Prismatic')
        : [];
    const czActiveTree = czTrees.find((t) => t.tree === czSelectedTree) || czTrees[0] || null;

    // Totals of every stat across all equipped charms (effect summary).
    const charmTotals = computeCharmTotals(
        itemData,
        charms.map((c) => c.name)
    );

    return (
        <form ref={formRef} onSubmit={sendUpdate} onReset={resetForm} id="buildForm">
            {/* Top row: region/class/spec on the left, title centered, import on the right */}
            <div className={`${styles.builderTopRow} mt-3 mb-1`}>
                <div className="d-flex flex-wrap align-items-center">
                    <div className="me-3">
                        <FloatingLabel label="Region">
                            <Select
                                instanceId="this-is-just-here-so-react-doesnt-yell-at-me"
                                id="region"
                                name="region"
                                key={`region-${regionSelectKey}-${czOpen ? 'o' : 'c'}`}
                                options={regions}
                                value={
                                    czOpen && regionValue === 2
                                        ? { value: 2, label: 'Darkest Depths' }
                                        : czOpen && regionValue === 3
                                          ? { value: 3, label: 'Celestial Zenith' }
                                          : regions.find((r) => r.value === regionValue)
                                }
                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                menuPosition="fixed"
                                theme={(theme) => ({
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
                                })}
                                styles={{
                                    container: (base) => ({ ...base, width: '100%', minWidth: 150 }),
                                    control: (base) => ({ ...base, minHeight: 42, height: 42 }),
                                    valueContainer: (base) => ({
                                        ...base,
                                        height: 42,
                                        paddingTop: 0,
                                        paddingBottom: 0,
                                    }),
                                    indicatorsContainer: (base) => ({ ...base, height: 42 }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                    menu: (base) => ({ ...base, zIndex: 9999 }),
                                }}
                                onChange={regionChanged}
                            />
                        </FloatingLabel>
                    </div>
                    {czOpen ? (
                        <div className={styles.czTreeSelector}>
                            <FloatingLabel label="Tree">
                                <Select
                                    instanceId="cz-tree"
                                    name="czTree"
                                    options={czTrees.map((t) => ({ value: t.tree, label: t.tree }))}
                                    value={czActiveTree ? { value: czActiveTree.tree, label: czActiveTree.tree } : null}
                                    onChange={(opt) => setCzSelectedTree(opt.value)}
                                    isSearchable={false}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    menuPosition="fixed"
                                    theme={(theme) => ({
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
                                    })}
                                    styles={{
                                        container: (base) => ({ ...base, width: '100%', minWidth: 180 }),
                                        control: (base) => ({ ...base, minHeight: 42, height: 42 }),
                                        valueContainer: (base) => ({
                                            ...base,
                                            height: 42,
                                            paddingTop: 0,
                                            paddingBottom: 0,
                                        }),
                                        indicatorsContainer: (base) => ({ ...base, height: 42 }),
                                        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                />
                            </FloatingLabel>
                        </div>
                    ) : (
                        <div>
                            <SelectInput
                                key={`class-${classSelectKey}`}
                                name="class"
                                floatingLabel="Class"
                                noneOption={true}
                                sortableStats={classes}
                                default={
                                    gameClass != 'none'
                                        ? {
                                              value: gameClass.charAt(0).toUpperCase() + gameClass.slice(1),
                                              label: gameClass.charAt(0).toUpperCase() + gameClass.slice(1),
                                          }
                                        : undefined
                                }
                                onChange={classChanged}
                            />
                        </div>
                    )}
                    {gameClass == 'none' || regionValue === 1 ? (
                        ''
                    ) : (
                        <div className="ms-3">
                            <SelectInput
                                key={`spec-${specSelectKey}`}
                                name="spec"
                                floatingLabel="Specialization"
                                noneOption={true}
                                sortableStats={currentSpecOptions}
                                default={spec ? { value: spec, label: spec } : undefined}
                                onChange={specChanged}
                            />
                        </div>
                    )}
                    <label className={`${styles.delveToggle} ${delveOpen ? styles.delveToggleActive : ''} ms-3`}>
                        <input
                            type="checkbox"
                            checked={delveOpen}
                            onChange={(e) => setDelveOpen(e.target.checked)}
                            aria-label="Delve Infusions"
                        />
                        Delve Infusions
                    </label>
                    <label className={`${styles.delveToggle} ${revelation ? styles.delveToggleActive : ''} ms-3`}>
                        <input
                            type="checkbox"
                            name="revelation"
                            value="1"
                            checked={revelation}
                            onChange={revelationChanged}
                            aria-label="Revelation"
                        />
                        Revelation
                    </label>
                </div>
                <BuilderHeader
                    text={buildName}
                    setText={setBuildName}
                    parentLoaded={parentLoaded}
                    build={build}
                    savedName={savedName}
                    setUpdateLink={setUpdateLink}
                />
                <div style={{ justifySelf: 'end', width: 'min(400px, 100%)' }}>
                    <BuildImportBar embedded />
                </div>
            </div>

            {!czOpen && gameClass != 'none' && (
                <div className="row justify-content-center pt-1 mb-1">
                    <div className="col-12">
                        <div className={styles.skillsSection}>
                            <div className={styles.skillsHeader}>
                                <span className={styles.skillsTitle}>Skills</span>{' '}
                                <span className={styles.skillTotal}>
                                    {Object.values(skillPoints).reduce((sum, pts) => sum + pts, 0)} / {MAX_SKILL_POINTS}{' '}
                                    skill points spent
                                </span>
                                {regionValue >= 3 && (
                                    <span className={styles.skillTotal}>
                                        {Object.keys(enhancements).length} / {MAX_ENHANCEMENT_POINTS} enhancement points
                                        used
                                    </span>
                                )}
                                {Object.values(skillPoints).reduce((sum, pts) => sum + pts, 0) > MAX_SKILL_POINTS && (
                                    <span className="text-danger fw-bold">
                                        More than {MAX_SKILL_POINTS} skill points!
                                    </span>
                                )}
                                {Object.keys(enhancements).length > MAX_ENHANCEMENT_POINTS && (
                                    <span className="text-danger fw-bold">
                                        More than {MAX_ENHANCEMENT_POINTS} enhancement points!
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={styles.skillActionButton}
                                    onClick={() => setAllSkillPoints(false)}
                                >
                                    Clear all
                                </button>
                            </div>
                            {!skillsData ? (
                                <div className={styles.skillsLoading}>Loading skills...</div>
                            ) : (
                                <div className={styles.skillsGrid}>
                                    {currentClassSkills.map((skill) => {
                                        const maxPoints = Math.max(0, (skill.descriptions || []).length - 1);
                                        if (maxPoints === 0) return '';
                                        const points = skillPoints[skill.scoreboardId] || 0;
                                        const enhanced = Boolean(enhancements[skill.scoreboardId]);
                                        const enhanceDisabled = points < 1;
                                        const tooltip = [skill.simpleDescription].filter(Boolean).join('\n\n');
                                        return (
                                            <div key={skill.scoreboardId} className={styles.skillRow} title={tooltip}>
                                                <span className={styles.skillName}>{skill.displayName}</span>
                                                <span className={styles.skillPoints}>
                                                    {points}/{maxPoints}
                                                </span>
                                                <div className={styles.skillChecks}>
                                                    {Array.from({ length: maxPoints }).map((_, i) => (
                                                        <input
                                                            key={i}
                                                            type="checkbox"
                                                            checked={points > i}
                                                            onChange={() => skillPointClicked(skill.scoreboardId, i)}
                                                            aria-label={`${skill.displayName} point ${i + 1}`}
                                                            title={[cleanDescription((skill.descriptions || [])[i])]
                                                                .filter(Boolean)
                                                                .join('\n\n')}
                                                        />
                                                    ))}
                                                </div>
                                                {regionValue >= 3 && (
                                                    <input
                                                        type="checkbox"
                                                        className={styles.skillEnhance}
                                                        checked={enhanced && !enhanceDisabled}
                                                        disabled={enhanceDisabled}
                                                        onChange={(e) =>
                                                            enhancementToggled(skill.scoreboardId, e.target.checked)
                                                        }
                                                        aria-label={`${skill.displayName} enhancement`}
                                                        title={
                                                            points < 1
                                                                ? `${skill.displayName} Enhancement\nEnhancement requires at least 1 point`
                                                                : [
                                                                      cleanDescription(
                                                                          (skill.descriptions || [])[maxPoints]
                                                                      ),
                                                                  ]
                                                                      .filter(Boolean)
                                                                      .join('\n\n')
                                                        }
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {(!czOpen && gameClass == 'none') || !spec || currentSpecSkills.length === 0 ? (
                ''
            ) : (
                <div className="row justify-content-center mb-1">
                    <div className="col-12">
                        <div className={styles.skillsSection}>
                            <div className={styles.skillsHeader}>
                                <span className={styles.skillsTitle}>{spec} Specialization</span>
                                <span className={styles.skillTotal}>
                                    {Object.values(specSkillPoints).reduce((sum, pts) => sum + pts, 0)} /{' '}
                                    {MAX_SPEC_POINTS} specialization points spent
                                </span>
                                {Object.values(specSkillPoints).reduce((sum, pts) => sum + pts, 0) >
                                    MAX_SPEC_POINTS && (
                                    <span className="text-danger fw-bold">
                                        More than {MAX_SPEC_POINTS} specialization points!
                                    </span>
                                )}
                            </div>
                            <div className={styles.skillsGrid}>
                                {currentSpecSkills.map((skill) => {
                                    const maxPoints = Math.max(0, (skill.descriptions || []).length);
                                    if (maxPoints === 0) return '';
                                    const points = specSkillPoints[skill.scoreboardId] || 0;
                                    const tooltip = [skill.simpleDescription].filter(Boolean).join('\n\n');
                                    return (
                                        <div key={skill.scoreboardId} className={styles.skillRow} title={tooltip}>
                                            <span className={styles.skillName}>{skill.displayName}</span>
                                            <span className={styles.skillPoints}>
                                                {points}/{maxPoints}
                                            </span>
                                            <div className={styles.skillChecks}>
                                                {Array.from({ length: maxPoints }).map((_, i) => (
                                                    <input
                                                        key={i}
                                                        type="checkbox"
                                                        checked={points > i}
                                                        onChange={() => specSkillPointClicked(skill.scoreboardId, i)}
                                                        aria-label={`${skill.displayName} point ${i + 1}`}
                                                        title={[cleanDescription((skill.descriptions || [])[i])]
                                                            .filter(Boolean)
                                                            .join('\n\n')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {czOpen && (
                <div className="row justify-content-center pt-1 mb-1">
                    <div className="col-12">
                        <div className={styles.czSection}>
                            <div className={styles.skillsHeader}>
                                <span className={styles.skillsTitle}>
                                    {regionValue === 2 ? 'Darkest Depths' : 'Celestial Zenith'}
                                </span>
                                <span className={styles.skillTotal}>
                                    {regionValue === 3 ? (
                                        <>
                                            {czActiveCount} / 4 active abilities
                                            {czActiveCount > 4 && (
                                                <span className="text-danger fw-bold">
                                                    {' '}
                                                    You can't use more than 4 actives above ascension 12!
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {czActiveCount} active {czActiveCount === 1 ? 'ability' : 'abilities'}
                                        </>
                                    )}
                                </span>
                                <span className={styles.skillTotal}>
                                    Class skills are disabled in {regionValue === 2 ? 'the Depths' : 'Celestial Zenith'}
                                    .
                                </span>
                                <button type="button" className={styles.skillActionButton} onClick={clearCz}>
                                    Clear all
                                </button>
                            </div>
                            {!czData ? (
                                <div className={styles.skillsLoading}>Loading abilities...</div>
                            ) : (
                                czActiveTree && (
                                    <div className={styles.czTreeSkills}>
                                        {czActiveTree.skills.map((ability) => {
                                            const selected = czAbilities[ability.name] !== undefined;
                                            const rarity = czAbilities[ability.name] ?? 0;
                                            const desc =
                                                (regionValue === 2
                                                    ? ability.depths_description
                                                    : ability.zenith_description) ||
                                                ability.zenith_description ||
                                                '';
                                            const triggerTaken =
                                                ability.trigger !== 'Passive' &&
                                                czData.trees.some(
                                                    (t2) =>
                                                        t2.tree !== czActiveTree.tree &&
                                                        t2.skills.some(
                                                            (s2) =>
                                                                s2.name !== ability.name &&
                                                                czAbilities[s2.name] !== undefined &&
                                                                s2.trigger === ability.trigger
                                                        )
                                                );
                                            const tooltip = [
                                                `${ability.name} (${ability.trigger})`,
                                                czData.rarities[rarity],
                                                formatCzDescription(desc, rarity),
                                                triggerTaken
                                                    ? 'Already using another ability with this trigger!'
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join('\n\n');
                                            return (
                                                <div
                                                    key={ability.name}
                                                    className={`${styles.czSkillRow}${
                                                        triggerTaken && !selected ? ` ${styles.czDisabled}` : ''
                                                    }`}
                                                    title={tooltip}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        disabled={triggerTaken && !selected}
                                                        onChange={(e) =>
                                                            czChanged(ability.name, e.target.checked ? rarity : null)
                                                        }
                                                        aria-label={`${ability.name} (${ability.trigger})`}
                                                    />
                                                    <span className={styles.skillName}>{ability.name}</span>
                                                    <span className={styles.czTrigger}>{ability.trigger}</span>
                                                    <div className={styles.czRarityWrap}>
                                                        <button
                                                            type="button"
                                                            className={`${styles.czRarity}${
                                                                !selected ? ` ${styles.czRarityDisabled}` : ''
                                                            }`}
                                                            disabled={!selected}
                                                            onClick={() =>
                                                                setCzRarityOpen((cur) =>
                                                                    cur === ability.name ? null : ability.name
                                                                )
                                                            }
                                                            title="Rarity"
                                                        >
                                                            {czData.rarities[rarity]}
                                                            <span className={styles.czRarityCaret}>▾</span>
                                                        </button>
                                                        {czRarityOpen === ability.name && (
                                                            <div className={styles.czRarityMenu}>
                                                                {czData.rarities.map((r, i) => (
                                                                    <div
                                                                        key={r}
                                                                        className={`${styles.czRarityOption}${
                                                                            i === rarity
                                                                                ? ` ${styles.czRarityOptionActive}`
                                                                                : ''
                                                                        }`}
                                                                        onClick={() => {
                                                                            czChanged(ability.name, i);
                                                                            setCzRarityOpen(null);
                                                                        }}
                                                                    >
                                                                        {r}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="row justify-content-center mb-1">
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button type="submit" className={styles.recalcButton} value="Recalculate">
                        <TranslatableText identifier="builder.buttons.recalculate"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button
                        type="button"
                        className={styles.shareButton}
                        id="copyLinkForDiscord"
                        onClick={copyBuildDiscord}
                    >
                        <TranslatableText identifier="builder.buttons.copyLinkForDiscord"></TranslatableText>
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <button
                        type="button"
                        className={styles.shareButton}
                        id="saveBuild"
                        onClick={saveBuildToServer}
                        disabled={saveState === 'saving'}
                    >
                        {saveState === 'saving' ? 'Saving...' : saveState === 'copied' ? 'Copied!' : 'Copy/Save'}
                    </button>
                </div>
                <div className="col-4 col-md-3 col-lg-2 text-center">
                    <input
                        type="button"
                        className={styles.resetButton}
                        value={resetConfirm ? 'Confirm' : 'Reset'}
                        onClick={handleResetClick}
                        aria-label="Reset build"
                    />
                </div>
            </div>
            {(saveState === 'copied' || saveState === 'error' || savedAnonymous) && (
                <div
                    className={`${styles.copyToast}${
                        saveState === 'error'
                            ? ` ${styles.copyToastError}`
                            : savedAnonymous
                              ? ` ${styles.copyToastWarn}`
                              : ''
                    }`}
                    role="status"
                    aria-live="polite"
                >
                    {saveState === 'error' ? (
                        'Could not save the build.'
                    ) : savedAnonymous ? (
                        <>
                            <b>Saved, but not to your account!</b>
                            <span>
                                You won't see this build on your "My Builds" page. Log in with Discord to keep it there
                                - the link still works for anyone.
                            </span>
                        </>
                    ) : (
                        <b>Copied short link to clipboard!</b>
                    )}
                </div>
            )}
            <div className="row justify-content-center mb-1">
                <div className="col-6 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.mainhand"></TranslatableText>
                    <SelectInput
                        reference={itemRefs.mainhand}
                        name="mainhand"
                        default={getEquipName('mainhand')}
                        noneOption={true}
                        sortableStats={getRelevantItems(
                            [
                                'mainhand',
                                'mainhand sword',
                                'mainhand shield',
                                'axe',
                                'pickaxe',
                                'wand',
                                'scythe',
                                'bow',
                                'crossbow',
                                'snowball',
                                'trident',
                                'alchemist bag',
                            ],
                            itemData
                        )}
                        onChange={itemChanged}
                    ></SelectInput>
                    {delveOpen && delveSlotSelects('mainhand')}
                </div>
                <div className="col-6 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.offhand"></TranslatableText>
                    <SelectInput
                        reference={itemRefs.offhand}
                        name="offhand"
                        default={getEquipName('offhand')}
                        noneOption={true}
                        sortableStats={getRelevantItems(['offhand', 'offhand shield', 'offhand sword'], itemData)}
                        onChange={itemChanged}
                    ></SelectInput>
                    {delveOpen && delveSlotSelects('offhand')}
                </div>
                <div className="col-6 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.helmet"></TranslatableText>
                    <SelectInput
                        reference={itemRefs.helmet}
                        noneOption={true}
                        name="helmet"
                        default={getEquipName('helmet')}
                        sortableStats={getRelevantItems(['helmet'], itemData)}
                        onChange={itemChanged}
                    ></SelectInput>
                    {delveOpen && delveSlotSelects('helmet')}
                </div>
                <div className="col-6 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.chestplate"></TranslatableText>
                    <SelectInput
                        reference={itemRefs.chestplate}
                        noneOption={true}
                        name="chestplate"
                        default={getEquipName('chestplate')}
                        sortableStats={getRelevantItems(['chestplate'], itemData)}
                        onChange={itemChanged}
                    ></SelectInput>
                    {delveOpen && delveSlotSelects('chestplate')}
                </div>
                <div className="col-6 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.leggings"></TranslatableText>
                    <SelectInput
                        reference={itemRefs.leggings}
                        noneOption={true}
                        name="leggings"
                        default={getEquipName('leggings')}
                        sortableStats={getRelevantItems(['leggings'], itemData)}
                        onChange={itemChanged}
                    ></SelectInput>
                    {delveOpen && delveSlotSelects('leggings')}
                </div>
                <div className="col-6 col-md-3 col-lg-2 text-center">
                    <TranslatableText identifier="items.type.boots"></TranslatableText>
                    <SelectInput
                        reference={itemRefs.boots}
                        noneOption={true}
                        name="boots"
                        default={getEquipName('boots')}
                        sortableStats={getRelevantItems(['boots'], itemData)}
                        onChange={itemChanged}
                    ></SelectInput>
                    {delveOpen && delveSlotSelects('boots')}
                </div>
            </div>
            <div className="row justify-content-center mb-1">
                {itemTypes.map((type) => {
                    if (!checkExists(type, stats, itemData)) return '';
                    const tileName = stats.itemNames[type];
                    return (
                        <div className={`col-auto ${styles.builderCol}`} key={`${tileName}-${type}`}>
                            {stats.fullItemData[type].masterwork != undefined ? (
                                <MasterworkableItemTile
                                    update={receiveMasterworkUpdate}
                                    name={removeMasterworkFromName(tileName)}
                                    item={createMasterworkData(removeMasterworkFromName(tileName), itemData)}
                                    itemData={itemData}
                                    default={Number(tileName.split('-').at(-1))}
                                ></MasterworkableItemTile>
                            ) : (
                                <ItemTile name={tileName} item={stats.fullItemData[type]}></ItemTile>
                            )}
                        </div>
                    );
                })}
            </div>
            {regionValue >= 3 && (
                <>
                    <div className="row mb-1">
                        <div className="col-12">
                            <CharmSelector
                                key={charmSelectKey}
                                update={updateCharms}
                                translatableName={'builder.charms.select'}
                                itemData={itemData}
                                hideList
                                charmNames={charms.map((c) => c.name)}
                            ></CharmSelector>
                        </div>
                    </div>
                    <div className="row justify-content-center mb-1">
                        {charms.map((charm) => (
                            <div
                                className={`col-auto ${styles.builderCol}`}
                                key={charm.name}
                                onClick={() => removeCharm(charm)}
                                style={{ cursor: 'pointer' }}
                            >
                                <CharmTile name={charm.name} item={charm}></CharmTile>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {regionValue >= 3 && Object.keys(charmTotals).length > 0 && (
                <div className="row justify-content-center mb-1">
                    <div className={`${styles.charmTotals}`}>
                        <button
                            type="button"
                            className={styles.charmTotalsHeader}
                            aria-expanded={charmStatsOpen}
                            onClick={() => setCharmStatsOpen((o) => !o)}
                        >
                            <span className={styles.charmTotalsTitle}>Charm Stats</span>
                            <span className={styles.charmTotalsChevron}>❯</span>
                        </button>
                        {charmStatsOpen && (
                            <>
                                {Object.entries(charmTotals).map(([stat, obj]) => {
                                    const parts = CharmFormatter.charmStatParts(stat, obj);
                                    return (
                                        <p key={stat} className={`${styles.statRow} mb-0 mt-1`}>
                                            <b>{parts.label}</b>
                                            <span
                                                className={`${styles.monoValue} ${styles[CharmFormatter.statStyle(stat, obj)]}`}
                                            >
                                                {parts.value}
                                            </span>
                                        </p>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
            <div className="row justify-content-center mb-1">
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-1`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.misc"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">&nbsp;</h6>
                    {miscStats.map((stat) =>
                        itemsToDisplay[stat.type] !== undefined ? (
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        )
                    )}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.health"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">&nbsp;</h6>
                    {healthStats.map((stat) =>
                        itemsToDisplay[stat.type] !== undefined ? (
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        )
                    )}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.damageReduction"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">
                        <TranslatableText identifier="builder.statCategories.damageReduction.sub"></TranslatableText>
                    </h6>
                    {DRStats.map((stat) =>
                        itemsToDisplay[stat.type] !== undefined ? (
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        )
                    )}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.damageReductionHealthNormalized"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">
                        <TranslatableText identifier="builder.statCategories.damageReductionHealthNormalized.sub"></TranslatableText>
                    </h6>
                    {healthNormalizedDRStats.map((stat) =>
                        itemsToDisplay[stat.type] !== undefined ? (
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        )
                    )}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.effectiveHealth"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">&nbsp;</h6>
                    {(() => {
                        const unstableEHPTypes = ['meleeEHP', 'projectileEHP', 'magicEHP', 'blastEHP'];
                        let temp = EHPStats.map((stat) => {
                            let condition = itemsToDisplay.instability && unstableEHPTypes.includes(stat.type);
                            return itemsToDisplay[stat.type] !== undefined ? (
                                <div key={stat.type}>
                                    <p className={`${styles.statRow} mb-0 mt-1 ${condition ? styles.grayedout : ''}`}>
                                        <b>
                                            <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                        </b>
                                        <span className={styles.monoValue}>
                                            {itemsToDisplay[stat.type]}
                                            {stat.percent ? '%' : ''}
                                        </span>
                                    </p>
                                </div>
                            ) : (
                                ''
                            );
                        });
                        if (itemsToDisplay.instability) {
                            let avg = 0;
                            unstableEHPTypes.forEach((t) => (avg += Number(itemsToDisplay[t])));
                            avg /= 4;
                            temp.unshift(
                                <div key={'unstableEHP'}>
                                    <p className={`${styles.statRow} mb-0 mt-1`}>
                                        <b>
                                            <TranslatableText
                                                identifier={'builder.stats.dr-ehp.unstable'}
                                            ></TranslatableText>
                                            :{' '}
                                        </b>
                                        <span className={styles.monoValue}>{avg.toFixed(2)}</span>
                                    </p>
                                </div>
                            );
                        }
                        return temp;
                    })()}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.melee"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">&nbsp;</h6>
                    {meleeStats.map((stat) => {
                        if (stat.type == 'classAttackDamagePercent' && itemsToDisplay.classAttackDamagePercent == 100)
                            return '';
                        return itemsToDisplay[stat.type] !== undefined ? (
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        );
                    })}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.projectile"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">&nbsp;</h6>
                    {projectileStats.map((stat) => {
                        if (
                            stat.type == 'classProjectileDamagePercent' &&
                            itemsToDisplay.classProjectileDamagePercent == 100
                        )
                            return '';
                        return itemsToDisplay[stat.type] !== undefined ? (
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        );
                    })}
                </div>
                <div
                    className={`${styles.builderStatCard} ${styles.builderStatCol} col-auto text-center mx-2 my-1 py-2`}
                >
                    <h5 className="text-center fw-bold mb-1">
                        <TranslatableText identifier="builder.statCategories.magic"></TranslatableText>
                    </h5>
                    <h6 className="text-center fw-bold">&nbsp;</h6>
                    {magicStats.map((stat) => {
                        if (stat.type == 'classMagicDamagePercent' && itemsToDisplay.classMagicDamagePercent == 100)
                            return '';
                        return itemsToDisplay[stat.type] !== undefined &&
                            (stat.type != 'potionDamage' || itemsToDisplay.spellPowerPercent == '100.00') && // only show potion damage if spell power is 100% (default)
                            (stat.type != 'spellDamage' || itemsToDisplay.potionDamage == '0.00') ? ( // only show spell damage if potion damage is 0
                            <div key={stat.type}>
                                <p className={`${styles.statRow} mb-0 mt-1`}>
                                    <b>
                                        <TranslatableText identifier={stat.name}></TranslatableText>:{' '}
                                    </b>
                                    <span className={styles.monoValue}>
                                        {itemsToDisplay[stat.type]}
                                        {stat.percent ? '%' : ''}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            ''
                        );
                    })}
                </div>
            </div>
            <div className="row justify-content-center pt-1 mb-1 g-1">
                <TranslatableText
                    identifier="builder.misc.situationals"
                    className="text-center mb-1"
                ></TranslatableText>
                {generateSituationalCheckboxes(itemsToDisplay, checkboxChanged, delveInfusions)}
            </div>
            <div className="d-flex justify-content-center flex-wrap align-items-start mb-1">
                <div className="text-center mx-2">
                    <p className="mb-1">
                        <TranslatableText identifier="builder.misc.maxHealthPercent"></TranslatableText>
                    </p>
                    <input
                        type="number"
                        name="health"
                        min="1"
                        value={statInputs.health}
                        onChange={(e) => statInputChanged('health', e)}
                        className={styles.builderCompactInput}
                    />
                </div>
                <div className="text-center mx-2">
                    <p className="mb-1">Tenacity</p>
                    <input
                        type="number"
                        name="tenacity"
                        min="0"
                        max="30"
                        value={statInputs.tenacity}
                        onChange={(e) => statInputChanged('tenacity', e)}
                        className={styles.builderCompactInput}
                    />
                </div>
                <div className="text-center mx-2">
                    <p className="mb-1">Vitality</p>
                    <input
                        type="number"
                        name="vitality"
                        min="0"
                        max="30"
                        value={statInputs.vitality}
                        onChange={(e) => statInputChanged('vitality', e)}
                        className={styles.builderCompactInput}
                    />
                </div>
                <div className="text-center mx-2">
                    <p className="mb-1">Vigor</p>
                    <input
                        type="number"
                        name="vigor"
                        min="0"
                        max="30"
                        value={statInputs.vigor}
                        onChange={(e) => statInputChanged('vigor', e)}
                        className={styles.builderCompactInput}
                    />
                </div>
                <div className="text-center mx-2">
                    <p className="mb-1">Focus</p>
                    <input
                        type="number"
                        name="focus"
                        min="0"
                        max="30"
                        value={statInputs.focus}
                        onChange={(e) => statInputChanged('focus', e)}
                        className={styles.builderCompactInput}
                    />
                </div>
                <div className="text-center mx-2">
                    <p className="mb-1">Perspicacity</p>
                    <input
                        type="number"
                        name="perspicacity"
                        min="0"
                        max="30"
                        value={statInputs.perspicacity}
                        onChange={(e) => statInputChanged('perspicacity', e)}
                        className={styles.builderCompactInput}
                    />
                </div>
            </div>
            <div className="row pt-1">
                <span className="text-center text-danger fs-2 fw-bold">
                    {stats.corruption > 1 ? (
                        <TranslatableText identifier="builder.errors.corruption"></TranslatableText>
                    ) : (
                        ''
                    )}
                </span>
            </div>
            <div className="row py-1">
                <span className="text-center text-danger fs-2 fw-bold">
                    {stats.twoHanded && !stats.weightless && stats.itemNames.offhand != 'None' ? (
                        <TranslatableText identifier="builder.errors.twoHanded"></TranslatableText>
                    ) : (
                        ''
                    )}
                </span>
            </div>
            <div className="row mb-1 justify-content-center">
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector
                        key={`damage-${multiplierListKey}`}
                        update={damageMultipliersChanged}
                        translatableName="builder.multipliers.damage"
                    ></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector
                        key={`resistance-${multiplierListKey}`}
                        update={resistanceMultipliersChanged}
                        translatableName="builder.multipliers.resistance"
                    ></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector
                        key={`health-${multiplierListKey}`}
                        update={healthMultipliersChanged}
                        translatableName="builder.multipliers.health"
                    ></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector
                        key={`speed-${multiplierListKey}`}
                        update={speedMultipliersChanged}
                        translatableName="builder.multipliers.speed"
                    ></ListSelector>
                </div>
                <div className="col-12 col-md-6 col-lg-2">
                    <ListSelector
                        key={`attackSpeed-${multiplierListKey}`}
                        update={attackSpeedMultipliersChanged}
                        translatableName="builder.multipliers.attackSpeed"
                    ></ListSelector>
                </div>
            </div>

            {/* Notes: a signed-in feature. Owner edits on their short link,
                logged-in users can jot them on the builder (saved together
                with the build), everyone sees them on shared links. */}
            {(canEditNotes === true ||
                (canEditNotes === undefined && loggedIn === true) ||
                (canEditNotes === false && notes)) && (
                <div className="row justify-content-center mt-3">
                    <div className="col-12 col-lg-8 col-xl-6">
                        {canEditNotes === false ? (
                            <div className={styles.buildNotesBody}>{notes}</div>
                        ) : (
                            <>
                                <textarea
                                    className={styles.buildNotesInput}
                                    value={notesDraft}
                                    onChange={(e) => setNotesDraft(e.target.value)}
                                    placeholder="Add notes about this build..."
                                    rows={3}
                                    maxLength={2000}
                                />
                                <div className={styles.buildNotesActions}>
                                    {canEditNotes ? (
                                        <>
                                            <button
                                                type="button"
                                                className={styles.shareButton}
                                                onClick={saveNotes}
                                                disabled={notesSaveState === 'saving'}
                                            >
                                                {notesSaveState === 'saving'
                                                    ? 'Saving...'
                                                    : notesSaveState === 'saved'
                                                      ? 'Saved!'
                                                      : 'Save notes'}
                                            </button>
                                            {notesSaveState === 'saved' && (
                                                <span className={styles.buildNotesSaved}>Notes saved!</span>
                                            )}
                                            {notesSaveState === 'error' && (
                                                <span className={styles.importError}>Could not save the notes.</span>
                                            )}
                                        </>
                                    ) : (
                                        <span className={styles.buildNotesHint}>
                                            Notes are saved together with your build.
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </form>
    );
}
