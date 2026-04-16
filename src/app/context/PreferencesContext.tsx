"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";
export type AppLanguage = "en" | "ar";

interface PreferencesContextValue {
  theme: ThemeMode;
  language: AppLanguage;
  isDark: boolean;
  isArabic: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
}

const THEME_KEY = "nadeef_theme_mode";
const LANGUAGE_KEY = "nadeef_language";

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  if (stored === "ar" || stored === "en") return stored;

  return window.navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [language, setLanguageState] = useState<AppLanguage>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
    setLanguageState(getInitialLanguage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;
    const isDark = theme === "dark";
    const isArabic = language === "ar";

    root.classList.toggle("dark", isDark);
    root.dataset.theme = theme;
    root.dataset.locale = language;
    root.lang = language;
    root.dir = isArabic ? "rtl" : "ltr";

    if (body) {
      body.dataset.theme = theme;
      body.dataset.locale = language;
    }

    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(LANGUAGE_KEY, language);
    window.dispatchEvent(new CustomEvent("nadeef:preferences-changed", { detail: { theme, language } }));
  }, [theme, language, ready]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "ar" ? "en" : "ar"));
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      language,
      isDark: theme === "dark",
      isArabic: language === "ar",
      setTheme,
      toggleTheme,
      setLanguage,
      toggleLanguage,
    }),
    [theme, language, setTheme, toggleTheme, setLanguage, toggleLanguage],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }
  return context;
}
