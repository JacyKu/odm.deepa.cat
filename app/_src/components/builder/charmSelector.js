import styles from '../../styles/CharmSelector.module.css';
import TranslatableText from '../translatableText';
import CharmTile from '../items/charmTile';
import SelectInput from '../items/selectInput';
import React from 'react';

export default function CharmSelector({ update, translatableName, itemData, hideList, charmNames }) {
    const inputRef = React.useRef();

    const maxPower = 12;
    const entries = charmNames || [];
    const usedPower = entries.reduce((sum, name) => sum + (itemData[name]?.power || 0), 0);

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
