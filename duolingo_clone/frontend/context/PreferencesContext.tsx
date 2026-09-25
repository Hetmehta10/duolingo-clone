"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface PreferencesContextType {
  theme: Theme;
  toggleTheme: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const THEME_KEY = "duo-theme";
const SOUND_KEY = "duo-sound";

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    let initialTheme: Theme = "light";
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      initialTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      initialTheme = "dark";
    }

    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const savedSound = localStorage.getItem(SOUND_KEY);
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "true");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleSound = () => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    localStorage.setItem(SOUND_KEY, nextSound.toString());
  };

  return (
    <PreferencesContext.Provider
      value={{
        theme,
        toggleTheme,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
