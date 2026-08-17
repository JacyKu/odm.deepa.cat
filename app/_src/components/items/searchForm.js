import React from 'react';
import styles from '../../styles/SearchForm.module.css';
import SelectWithTriggers from './selectWithTriggers';
import SelectInput from './selectInput';
import LoreToggle from './loreToggle';
import extras from '../../data/extras.json';

export default function SearchForm({ update, itemData }) {
    const [itemStatKey, setItemStatKey] = React.useState(getResetKey('search'));
    const [itemTypeKey, setItemTypeKey] = React.useState(getResetKey('itemType'));
    const [regionKey, setRegionKey] = React.useState(getResetKey('region'));
    const [tierKey, setTierKey] = React.useState(getResetKey('tier'));
    const [locationKey, setLocationKey] = React.useState(getResetKey('location'));
    const [poiKey, setPoiKey] = React.useState(getResetKey('poi'));
    const [classKey, setClassKey] = React.useState(getResetKey('class'));
    const [charmStatKey, setCharmStatKey] = React.useState(getResetKey('charmStat'));
    const [baseItemKey, setBaseItemKey] = React.useState(getResetKey('baseItem'));
    const [effectKey, setEffectKey] = React.useState(getResetKey('effect'));
    const form = React.useRef();
    const searchContainer = React.useRef();

    const itemTypes = [
        'Helmet',
        'Chestplate',
        'Leggings',
        'Boots',
        { value: 'ALL_MAINHANDS', label: 'All mainhands' },
        { value: 'ALL_MELEE_MAINHANDS', label: 'All melee mainhands' },
        { value: 'Mainhand', label: 'Misc mainhands' },
        'Mainhand Sword',
        'Mainhand Shield',
        'Axe',
        'Pickaxe',
        'Trident',
        'Scythe',
        'Shovel',
        'Bow',
        'Crossbow',
        'Wand',
        'Snowball',
        'Projectile',
        { value: 'ALL_OFFHANDS', label: 'All offhands' },
        { value: 'Offhand', label: 'Misc offhands' },
        'Offhand Sword',
        'Offhand Shield',
        'Alchemist Bag',
        'Consumable',
        'Misc',
        'Charm',
    ];
    // The "Not" filter only makes sense with concrete types, not group tokens.
    const notItemTypes = itemTypes.filter((entry) => typeof entry === 'string');
    const charmClasses = [
        'Alchemist',
        'Mage',
        'Warlock',
        'Rogue',
        'Warrior',
        'Cleric',
        'Scout',
        'Shaman',
        'Generalist',
    ];
    let sortableStats = [];
    let regions = ['Valley', 'Isles', 'Ring'];
    let tiers = [];
    let locations = [];
    let pois = [];
    let charmStats = [];
    let baseItems = [];
    let effects = [];
    let charmPowers = [];

    const categories = [
        new SearchCategory('Item Type', 'items.searchForm.itemType', (uniqueKey) => {
            return (
                <SelectInput
                    key={itemTypeKey}
                    name={`itemTypeSelect-${uniqueKey}`}
                    baseTranslationString="items.type"
                    sortableStats={itemTypes}
                />
            );
        }),
        new SearchCategory('Item Stat', 'items.searchForm.itemStat', (uniqueKey) => {
            return <SelectInput key={itemStatKey} name={`itemStatSelect-${uniqueKey}`} sortableStats={sortableStats} />;
        }),
        new SearchCategory('Consumable Effect', 'items.searchForm.effect', (uniqueKey) => {
            return <SelectInput key={effectKey} name={`effectSelect-${uniqueKey}`} sortableStats={effects} />;
        }),
        new SearchCategory('Region', 'items.searchForm.region', (uniqueKey) => {
            return <SelectInput key={regionKey} name={`regionSelect-${uniqueKey}`} sortableStats={regions} />;
        }),
        new SearchCategory('Tier', 'items.searchForm.tier', (uniqueKey) => {
            return <SelectInput key={tierKey} name={`tierSelect-${uniqueKey}`} sortableStats={tiers} />;
        }),
        new SearchCategory('Location', 'items.searchForm.location', (uniqueKey) => {
            return <SelectInput key={locationKey} name={`locationSelect-${uniqueKey}`} sortableStats={locations} />;
        }),
        new SearchCategory('POI', 'items.searchForm.poi', (uniqueKey) => {
            return <SelectInput key={poiKey} name={`poiSelect-${uniqueKey}`} sortableStats={pois} />;
        }),
        new SearchCategory('Charm Stat', 'items.searchForm.charmStat', (uniqueKey) => {
            return <SelectInput key={charmStatKey} name={`charmStatSelect-${uniqueKey}`} sortableStats={charmStats} />;
        }),
        new SearchCategory('Charm Class', 'items.searchForm.charmClass', (uniqueKey) => {
            return <SelectInput key={classKey} name={`classSelect-${uniqueKey}`} sortableStats={charmClasses} />;
        }),
        new SearchCategory('Base Item', 'items.searchForm.baseItem', (uniqueKey) => {
            return <SelectInput key={baseItemKey} name={`baseItemSelect-${uniqueKey}`} sortableStats={baseItems} />;
        }),
        new SearchCategory('Charm Power', 'items.searchForm.charmPower', (uniqueKey) => {
            return (
                <div className={styles.powerFilterRow}>
                    <SelectInput
                        key={`powerOp-${itemStatKey}`}
                        name={`charmPowerOperatorSelect-${uniqueKey}`}
                        sortableStats={[
                            { value: '=', label: 'Equals' },
                            { value: '>', label: 'More than' },
                            { value: '>=', label: 'At least' },
                            { value: '<', label: 'Less than' },
                            { value: '<=', label: 'At most' },
                            { value: '!=', label: 'Not equal' },
                        ]}
                    />
                    <SelectInput
                        key={`powerVal-${itemStatKey}`}
                        name={`charmPowerValueSelect-${uniqueKey}`}
                        sortableStats={charmPowers}
                    />
                </div>
            );
        }),
        new SearchCategory('Not', 'items.searchForm.not', (uniqueKey) => {
            return (
                <NotFilterRow
                    key={`notCat-${itemStatKey}`}
                    uniqueKey={uniqueKey}
                    resetKey={itemStatKey}
                    itemTypes={notItemTypes}
                    tiers={tiers}
                    locations={locations}
                    regions={regions}
                    baseItems={baseItems}
                    charmClasses={charmClasses}
                    pois={pois}
                />
            );
        }),
    ];

    const deleteFilter = React.useCallback((key) => {
        setFilters((oldFilters) => {
            // Never allow the UI to end up with zero filter rows.
            if (!oldFilters || oldFilters.length <= 1) {
                return [{ activeCategory: null, selected: null, uniqueKey: new Date().getTime() }];
            }

            const next = oldFilters.filter((f) => f.uniqueKey != key);
            return next.length ? next : [{ activeCategory: null, selected: null, uniqueKey: new Date().getTime() }];
        });
    }, []);

    const [filters, setFilters] = React.useState([
        { activeCategory: null, selected: null, uniqueKey: new Date().getTime() },
    ]);

    function sendUpdate(event = {}) {
        if (event.type === 'submit') {
            event.preventDefault();
        }
        update(Object.fromEntries(new FormData(form.current).entries()));
    }

    function getResetKey(name) {
        return name + new Date();
    }

    function resetForm() {
        setItemStatKey(getResetKey('search'));
        setItemTypeKey(getResetKey('itemType'));
        setRegionKey(getResetKey('region'));
        setTierKey(getResetKey('tier'));
        setLocationKey(getResetKey('location'));
        setPoiKey(getResetKey('poi'));
        setClassKey(getResetKey('class'));
        setCharmStatKey(getResetKey('charmStat'));
        setBaseItemKey(getResetKey('baseItem'));
        setEffectKey(getResetKey('effects'));
        setFilters([{ activeCategory: null, selected: null, uniqueKey: new Date().getTime() }]);
    }

    function disableRightClick(event) {
        event.preventDefault();
    }

    generateSortableItemStats(itemData);
    // generateRegions();
    generateTiers(itemData);
    generateSortableCharmStats(itemData);
    generateLocations(itemData);
    generatePOIs();
    generateBaseItems(itemData);
    generateEffects(itemData);
    generateCharmPowers(itemData);

    function addFilter() {
        setFilters((oldFilters) => [
            ...oldFilters,
            { activeCategory: null, selected: null, uniqueKey: new Date().getTime() },
        ]);
    }

    return (
        <form
            className={styles.searchForm}
            onSubmit={sendUpdate}
            onReset={resetForm}
            onContextMenu={disableRightClick}
            ref={form}
        >
            <div className={styles.searchContainer} ref={searchContainer}>
                {filters.map((f) => (
                    <div className={styles.filterEntry} key={`div-${f.uniqueKey}`}>
                        <SelectWithTriggers
                            className="w-100"
                            key={f.uniqueKey}
                            name="categorySelect"
                            opts={categories}
                            index={f.uniqueKey}
                            deleteCallback={deleteFilter}
                        />
                    </div>
                ))}
            </div>

            <div className={styles.filterToolbar}>
                <input
                    className={styles.addFilterButton}
                    type="button"
                    value="+ Add"
                    aria-label="Add filter"
                    onClick={addFilter}
                />
            </div>

            <input
                type="text"
                name="searchName"
                className={styles.searchField}
                placeholder="Search Name"
                aria-label="Search by item name"
                autoFocus
            />
            <input
                type="text"
                name="searchLore"
                className={styles.searchField}
                placeholder="Search Lore"
                aria-label="Search by lore text"
            />
            <div className={styles.filterActions}>
                <input className={styles.submitButton} type="submit" value="Search" />
                <input className={styles.warningButton} type="reset" value="Reset" aria-label="Reset all filters" />
            </div>
            <div className={styles.toggleRow}>
                <label className={styles.toggleLabel}>
                    <input type="checkbox" name="hideUnobtainable" onChange={sendUpdate} /> Hide unobtainable
                </label>
                <label className={styles.toggleLabel}>
                    <input type="checkbox" name="hideNonGear" onChange={sendUpdate} /> Hide non-gear items
                </label>
                <LoreToggle />
            </div>
        </form>
    );

    function generateSortableItemStats(itemData) {
        sortableStats = [];
        let itemNames = Object.keys(itemData).filter((item) => itemData[item].type != 'Charm');
        let uniqueItemStats = {};
        for (let itemName of itemNames) {
            if (itemData[itemName].stats) {
                Object.keys(itemData[itemName].stats).forEach((stat) => {
                    uniqueItemStats[stat] = 1;
                });
            }
        }
        Object.keys(uniqueItemStats).forEach((stat) => {
            sortableStats.push(
                stat
                    .split('_')
                    .map((part) => part[0].toUpperCase() + part.substring(1))
                    .join(' ')
            );
        });
    }

    /* function generateRegions() {
        regions = [];
        let uniqueRegions = {
            Valley: 1,
            Isles: 1,
            Ring: 1
        };
        Object.keys(itemData).map(item => itemData[item].region).filter(regionName => regionName != undefined).forEach(regionName => {
            uniqueRegions[regionName] = 1;
        });
        Object.keys(uniqueRegions).forEach(regionName => regions.push(regionName));
    } */

    function generateTiers(itemData) {
        tiers = [];
        let uniqueTiers = {};
        Object.keys(itemData)
            .map((item) => itemData[item].tier)
            .filter((tierName) => tierName != undefined)
            .forEach((tierName) => {
                uniqueTiers[tierName] = 1;
            });
        // Remove the Charm tier since there is a checkbox for it.
        delete uniqueTiers.Charm;
        Object.keys(uniqueTiers).forEach((tierName) => tiers.push(tierName));
    }

    function generateSortableCharmStats(itemData) {
        charmStats = [];
        let charmNames = Object.keys(itemData).filter((item) => itemData[item].type == 'Charm');
        let uniqueCharmAttributes = {};
        for (let charmName of charmNames) {
            Object.keys(itemData[charmName].stats).forEach((attribute) => {
                uniqueCharmAttributes[attribute] = 1;
            });
        }
        Object.keys(uniqueCharmAttributes).forEach((attribute) => {
            charmStats.push(
                attribute
                    .split('_')
                    .map((part) => part[0].toUpperCase() + part.substring(1))
                    .join(' ')
                    .replace(' Flat', '')
                    .replace(' Percent', ' %')
            );
        });
    }
    function generateEffects(itemData) {
        effects = [];
        let uniqueEffects = {};
        let consumableNames = Object.keys(itemData).filter((item) => itemData[item].type === 'Consumable');

        for (let name of consumableNames) {
            let item = itemData[name];
            if (Array.isArray(item.effects)) {
                item.effects.forEach((effect) => {
                    if (effect.EffectType) {
                        uniqueEffects[effect.EffectType] = 1;
                    }
                });
            }
        }

        Object.keys(uniqueEffects).forEach((effect) => {
            let formatted = effect.replace('damage', 'Damage');
            formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');

            effects.push(formatted);
        });
    }

    function generateLocations(itemData) {
        locations = [];
        let uniqueLocations = {};
        Object.keys(itemData)
            .map((item) => itemData[item].location)
            .filter((locationName) => locationName != undefined)
            .forEach((locationName) => {
                uniqueLocations[locationName] = 1;
            });
        Object.keys(uniqueLocations).forEach((locationName) => locations.push(locationName));
    }

    function generateCharmPowers(itemData) {
        charmPowers = [];
        let uniquePowers = {};
        Object.keys(itemData)
            .filter((item) => itemData[item].type == 'Charm')
            .forEach((item) => {
                const power = itemData[item].power;
                if (power !== undefined && power !== null) {
                    uniquePowers[power] = 1;
                }
            });
        Object.keys(uniquePowers)
            .sort((a, b) => a - b)
            .forEach((power) => charmPowers.push(Number(power)));
    }

    function generatePOIs() {
        pois = [];
        let uniquePois = {};
        Object.keys(extras)
            .filter((extra) => extras[extra].poi != undefined)
            .map((extra) => extras[extra].poi)
            .forEach((poiName) => {
                uniquePois[poiName] = 1;
            });
        Object.keys(uniquePois).forEach((poiName) => pois.push(poiName));
    }

    function generateBaseItems(itemData) {
        baseItems = [];
        let uniqueBaseItems = {};
        Object.keys(itemData)
            .map((item) => itemData[item].base_item)
            .filter((baseItemName) => baseItemName != undefined)
            .forEach((baseItemName) => {
                uniqueBaseItems[baseItemName] = 1;
            });
        Object.keys(uniqueBaseItems).forEach((baseItemName) => baseItems.push(baseItemName));
    }
}

class SearchCategory {
    constructor(name, translatableName, spawnChildren) {
        this.name = name;
        this.translatableName = translatableName;
        this.spawnChildren = spawnChildren;
    }

    select(uniqueKey) {
        return this.spawnChildren(uniqueKey);
    }
}

function NotFilterRow({ uniqueKey, resetKey, itemTypes, tiers, locations, regions, baseItems, charmClasses, pois }) {
    const [category, setCategory] = React.useState('Item Type');
    const notValues = {
        'Item Type': itemTypes,
        Tier: tiers,
        Location: locations,
        Region: regions,
        'Base Item': baseItems,
        'Charm Class': charmClasses,
        POI: pois,
    };
    return (
        <div className={styles.powerFilterRow}>
            <SelectInput
                key={`notCat-${resetKey}`}
                name={`notCategorySelect-${uniqueKey}`}
                sortableStats={Object.keys(notValues)}
                onChange={(option) => setCategory(option.value)}
            />
            <SelectInput
                key={`notVal-${category}-${resetKey}`}
                name={`notValue-${uniqueKey}`}
                sortableStats={notValues[category]}
            />
        </div>
    );
}
