"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { usePreferences } from "@/context/PreferencesContext";

const PLACEHOLDER_SECTIONS = [
  "Account",
  "Notifications",
  "Courses",
  "Privacy Settings",
  "Social Accounts",
];

export default function SettingsPage() {
  const { theme, toggleTheme, soundEnabled, toggleSound } = usePreferences();

  return (
    <AppShell>
      <div className="w-full max-w-[600px] flex flex-col gap-6 py-4">
        <h1 className="text-3xl font-black text-eel text-left">Settings</h1>

        <div className="flex flex-col gap-3">
          {/* Preferences Section: Dark Mode */}
          <div className="bg-snow border-2 border-swan rounded-card p-5 flex items-center justify-between shadow-xs select-none">
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-eel">Dark Mode</span>
              <span className="text-xs font-semibold text-wolf">
                Switch between light and dark theme
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-feather" : "bg-swan"
              }`}
              aria-label="Toggle Dark Mode"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-snow transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Preferences Section: Sound Effects */}
          <div className="bg-snow border-2 border-swan rounded-card p-5 flex items-center justify-between shadow-xs select-none">
            <div className="flex flex-col">
              <span className="text-[17px] font-bold text-eel">Sound Effects</span>
              <span className="text-xs font-semibold text-wolf">
                Enable or disable text-to-speech audio
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                soundEnabled ? "bg-feather" : "bg-swan"
              }`}
              aria-label="Toggle Sound Effects"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-snow transition-transform ${
                  soundEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Other Settings Sections (Placeholders) */}
          {PLACEHOLDER_SECTIONS.map((section) => (
            <div
              key={section}
              className="bg-snow border-2 border-swan rounded-card p-5 flex items-center justify-between shadow-xs select-none"
            >
              <span className="text-[17px] font-bold text-eel">{section}</span>
              <span className="bg-polar border border-swan text-hare text-xs font-black uppercase px-3 py-1 rounded-pill tracking-wider">
                COMING SOON
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
