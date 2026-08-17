'use client';

import React from 'react';

const STORAGE_KEY = 'lowResource';

const LowResourceContext = React.createContext({ lowRes: false, toggle: () => {} });

export function LowResourceProvider({ children }) {
    const [lowRes, setLowRes] = React.useState(false);
    React.useEffect(() => {
        try {
            setLowRes(localStorage.getItem(STORAGE_KEY) === 'true');
        } catch (e) {}
    }, []);
    const toggle = React.useCallback(() => {
        setLowRes((l) => {
            const next = !l;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch (e) {}
            return next;
        });
    }, []);
    return <LowResourceContext.Provider value={{ lowRes, toggle }}>{children}</LowResourceContext.Provider>;
}

export function useLowResource() {
    return React.useContext(LowResourceContext);
}
