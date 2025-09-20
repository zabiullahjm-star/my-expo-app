// ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    setDark: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    isDark: false,
    toggleTheme: () => { },
    setDark: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDark, setIsDark] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            try {
                const v = await AsyncStorage.getItem("APP_THEME");
                if (v) setIsDark(v === "dark");
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    const toggleTheme = async () => {
        try {
            const next = !isDark;
            setIsDark(next);
            await AsyncStorage.setItem("APP_THEME", next ? "dark" : "light");
        } catch (e) {
            setIsDark((p) => !p);
        }
    };

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, setDark: setIsDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;