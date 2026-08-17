import styles from '../../styles/CharmSelector.module.css';
import TranslatableText from '../translatableText';
import CharmTile from '../items/charmTile';
import SelectInput from '../items/selectInput';
import React from 'react';

// Human-readable ability text for a charm (stat names + values), so the
// selector search can match abilities, not just names.
function charmAbilityText(item) {
    if (!item?.stats) return '';
    const parts = [];
    for (const [stat, v] of Object.entries(item.stats)) {
        const value = typeof v === 'object' && v !== null ? v.value : v;
        if (value === undefined || value === null) continue;
        const human = stat
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
        parts.push(`${Number(value) > 0 ? '+' : ''}${value} ${human}`);
    }
    return parts.join(', ');
}

let abilityCache = null;
function getAbilityTextMap(itemData) {
    if (abilityCache && abilityCache.data === itemData) return abilityCache.map;
    const map = new Map();
    for (const key of Object.keys(itemData)) {
        if (itemData[key].type === 'Charm') map.set(key, charmAbilityText(itemData[key]).toLowerCase());
    }
    abilityCache = { data: itemData, map };
    return map;
}

export default function CharmSelector({ update, translatableName, itemData, hideList, charmNames }) {
    const inputRef = React.useRef();

    const maxPower = 12;
    const entries = charmNames || [];
    const usedPower = entries.reduce((sum, name) => sum + (itemData[name]?.power || 0), 0);

    const abilityTextMap = getAbilityTextMap(itemData);
    const charmFilterOption = (option, input) => {
        const query = input.toLowerCase();
        if (option.label.toLowerCase().includes(query)) return true;
        const ability = abilityTextMap.get(option.value);
        return Boolean(ability && ability.includes(query));
    };

    function processUpdate(updatedEntries) {
        update(updatedEntries);
    }

    function addEntry() {
        let input = inputRef.current.getValue()[0].value;

        let actualName = Object.keys(itemData).find((name) => name.toLowerCase() == input.toLowerCase());

        if (
            actualName &&
            itemData[actualName].type == 'Charm' &&
            !entries.find((name) => name.toLowerCase() == input.toLowerCase()) &&
            usedPower + itemData[actualName].power <= maxPower
        ) {
            processUpdate([...entries, actualName]);
        }
    }

    return (
        <div className={`${styles.listSelectorContainer} p-1`}>
            <p className={`${styles.name} m-0 mb-1`}>
                <TranslatableText identifier={translatableName}></TranslatableText>
            </p>
            <div className={`${styles.listSelectorInputs} justify-content-center`}>
                <span className={`${styles.entryInput} me-1`}>
                    <SelectInput
                        reference={inputRef}
                        name="charm"
                        noneOption={true}
                        sortableStats={Object.keys(itemData).filter((name) => itemData[name].type == 'Charm')}
                        filterOption={charmFilterOption}
                    ></SelectInput>
                </span>
                <button className={styles.button} onClick={addEntry}>
                    +
                </button>
            </div>
            <div className={`${styles.powerStars} justify-content-center`}>
                <span>{`${usedPower}/${maxPower} [`}</span>
                <span className={styles.activeStars}>{'★'.repeat(usedPower)}</span>
                <span>{`${'☆'.repeat(maxPower - usedPower)}]`}</span>
            </div>
            {!hideList && (
                <div className={styles.listSelectorList}>
                    {entries.map((entry, index) => (
                        <span
                            key={index}
                            className={styles.entry}
                            onClick={() => processUpdate(entries.filter((_, i) => i != index))}
                        >
                            <CharmTile key={entry} name={itemData[entry].name} item={itemData[entry]}></CharmTile>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
