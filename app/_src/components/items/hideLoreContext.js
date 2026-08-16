import React from 'react';

const STORAGE_KEY = 'hideLore';

const HideLoreContext = React.createContext({ hidden: false, toggle: () => {} });

export function HideLoreProvider({ children }) {
    const [hidden, setHidden] = React.useState(false);
    React.useEffect(() => {
        try {
            setHidden(localStorage.getItem(STORAGE_KEY) === 'true');
        } catch (e) {}
    }, []);
    const toggle = React.useCallback(() => {
        setHidden((h) => {
            const next = !h;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch (e) {}
            return next;
        });
    }, []);
    return <HideLoreContext.Provider value={{ hidden, toggle }}>{children}</HideLoreContext.Provider>;
}

export function useHideLore() {
    return React.useContext(HideLoreContext);
}
