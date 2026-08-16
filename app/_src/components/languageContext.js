'use client';

import React from 'react';

export const LanguageContext = React.createContext({
    lang: 'en',
    setLang: () => {},
});

export const LanguageContextProvider = ({ children }) => {
    const [lang, setLang] = React.useState('en');

    return (
        <LanguageContext.Provider
            value={{
                lang: lang,
                setLang: setLang,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguageContext = () => React.useContext(LanguageContext);
