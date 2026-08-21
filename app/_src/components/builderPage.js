'use client';

import React from 'react';
import BuildForm from './builder/buildForm';
import styles from '../styles/Items.module.css';

export default function BuilderPage({
    build,
    itemData,
    savedState,
    savedName,
    notes,
    canEditNotes,
    buildId,
    canPublicise,
    isPublic,
    isAnonymous,
}) {
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
        <div className="container-fluid">
            <main className={styles.builderPage}>
                <BuildForm
                    update={change}
                    build={build}
                    savedState={savedState}
                    savedName={savedName}
                    notes={notes}
                    canEditNotes={canEditNotes}
                    buildId={buildId}
                    canPublicise={canPublicise}
                    isPublic={isPublic}
                    isAnonymous={isAnonymous}
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
    );
}
