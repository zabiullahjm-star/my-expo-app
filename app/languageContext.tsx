// LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LanguageContextType = {
    isPersian: boolean;
    toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextType>({
    isPersian: false,
    toggleLanguage: () => { },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPersian, setIsPersian] = useState<boolean>(false);

    // بارگذاری زبان از حافظه موقع شروع برنامه
    useEffect(() => {
        (async () => {
            try {
                const languageValue = await AsyncStorage.getItem("APP_LANGUAGE");
                if (languageValue) setIsPersian(languageValue === "fa");
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    // تابع برای تغییر زبان
    const toggleLanguage = async () => {
        try {
            const next = !isPersian;
            setIsPersian(next);
            await AsyncStorage.setItem("APP_LANGUAGE", next ? "fa" : "en");
        } catch (e) {
            setIsPersian((p) => !p);
        }
    };

    return (
        <LanguageContext.Provider value={{ isPersian, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;