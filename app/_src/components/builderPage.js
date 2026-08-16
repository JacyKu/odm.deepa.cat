'use client';

import React from 'react';
import BuildForm from './builder/buildForm';
import styles from '../styles/Items.module.css';
import { HideLoreProvider } from './items/hideLoreContext';

export default function BuilderPage({ build, itemData }) {
    const [builderHeaderText, setBuilderHeaderText] = React.useState('Monumenta Builder');
    const [itemsToDisplay, setItemsToDisplay] = React.useState({});

    // used for a weird logical reacharound to trigger a form "update" from builderheader
    // out of the ways i could have done it, this is the least bad
    const [updateLink, setUpdateLink] = React.useState(false);

    function change(itemData) {
        setItemsToDisplay(itemData);
    }
    const [parentLoaded, setParentLoaded] = React.useState(false);

    React.useEffect(() => {
        setParentLoaded(true);
    }, []);

    // Mirror of the original <Head> title logic (client-side, since og: metadata is generated server-side)
    React.useEffect(() => {
        let title = 'Monumenta Builder';
        if (parentLoaded && builderHeaderText !== 'Monumenta Builder') {
            title = builderHeaderText + ' - ' + title;
        }
        document.title = title;
    }, [builderHeaderText, parentLoaded]);

    return (
        <HideLoreProvider>
            <div className="container-fluid">
                <main className={styles.builderPage}>
                    <BuildForm
                        update={change}
                        build={build}
                        parentLoaded={parentLoaded}
                        itemData={itemData}
                        itemsToDisplay={itemsToDisplay}
                        buildName={builderHeaderText}
                        setBuildName={setBuilderHeaderText}
                        updateLink={updateLink}
                        setUpdateLink={setUpdateLink}
                    ></BuildForm>
                </main>
            </div>
        </HideLoreProvider>
    );
}
