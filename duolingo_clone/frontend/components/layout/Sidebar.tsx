"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/context/PreferencesContext";
import {
  DotsIcon,
  DumbbellIcon,
  GemIcon,
  HouseIcon,
  MoonIcon,
  PersonIcon,
  SunIcon,
  TrophyIcon,
} from "@/components/ui/Icons";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = usePreferences();

  const navItems: NavItem[] = [
    {
      label: "LEARN",
      href: "/",
      icon: <HouseIcon className="w-6 h-6" />,
    },
    {
      label: "QUESTS",
      href: "/quests",
      icon: <DumbbellIcon className="w-6 h-6" />,
    },
    {
      label: "LEADERBOARDS",
      href: "/leaderboard",
      icon: <TrophyIcon className="w-6 h-6" />,
    },
    {
      label: "SHOP",
      href: "/shop",
      icon: <GemIcon className="w-6 h-6" />,
    },
    {
      label: "PROFILE",
      href: "/profile",
      icon: <PersonIcon className="w-6 h-6" />,
    },
    {
      label: "MORE",
      href: "/settings",
      icon: <DotsIcon className="w-6 h-6" />,
    },
  ];

  const mobileTabs = navItems.slice(0, 5);

  return (
    <>
      {/* 1. DESKTOP & TABLET SIDEBAR (MD and UP) */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 md:w-[88px] min-[1200px]:w-64 bg-surface border-r-2 border-line p-4 flex-col justify-between z-30 select-none transition-all">
        <div className="flex flex-col gap-6 items-center min-[1200px]:items-stretch">
          {/* Brand Wordmark (Desktop) vs Owl Logo (Tablet) */}
          <div className="px-2 py-2 text-center min-[1200px]:text-left">
            <Link href="/" className="inline-block no-underline">
              <span className="hidden min-[1200px]:block text-3xl font-black text-feather tracking-tight lowercase">
                duolingo
              </span>
              <span className="block min-[1200px]:hidden text-3xl font-black text-feather tracking-tight lowercase">
                d
              </span>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-2 w-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-center min-[1200px]:justify-start gap-4 px-3 min-[1200px]:px-4 py-3 rounded-btn border-2 font-bold text-sm tracking-wider transition-colors no-underline ${
                    isActive
                      ? "bg-iguana dark:bg-macaw/20 border-humpback text-macaw"
                      : "border-transparent text-inkSoft hover:bg-subtle"
                  }`}
                  title={item.label}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="hidden min-[1200px]:inline truncate">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with Theme Toggle Button */}
        <div className="flex items-center justify-center min-[1200px]:justify-start px-2 py-2 border-t-2 border-line">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-btn bg-subtle border-2 border-line text-inkSoft hover:text-ink hover:border-humpback transition-all flex items-center gap-3 cursor-pointer"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          >
            {theme === "light" ? (
              <MoonIcon className="w-5 h-5 text-macaw" />
            ) : (
              <SunIcon className="w-5 h-5 text-bee" />
            )}
            <span className="hidden min-[1200px]:inline text-xs font-extrabold uppercase tracking-wider">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION TAB BAR (BELOW 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-surface border-t-2 border-line z-40 flex items-center justify-around select-none">
        {mobileTabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex-1 h-full flex flex-col items-center justify-center relative transition-colors no-underline ${
                isActive ? "text-macaw" : "text-inkFaint hover:text-inkSoft"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-3 right-3 h-[3px] bg-macaw rounded-b-md" />
              )}
              <div className="mt-1">{tab.icon}</div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
