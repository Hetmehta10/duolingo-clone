"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { usePreferences } from "@/context/PreferencesContext";
import {
  CheckIcon,
  DotsIcon,
  FlameIcon,
  GemIcon,
  HeartIcon,
  PlusCircleIcon,
  SpeakerIcon,
  SpeakerMutedIcon,
  XpBoltIcon,
} from "@/components/ui/Icons";

export function TopBar() {
  const { user } = useUser();
  const { soundEnabled, toggleSound } = usePreferences();

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [coursePickerOpen, setCoursePickerOpen] = useState<boolean>(false);
  const [showAddCourseNote, setShowAddCourseNote] = useState<boolean>(false);
  const coursePickerRef = useRef<HTMLDivElement>(null);

  const streakCount = user?.current_streak ?? 0;
  const isZeroStreak = streakCount === 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCoursePickerOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        coursePickerRef.current &&
        !coursePickerRef.current.contains(e.target as Node)
      ) {
        setCoursePickerOpen(false);
      }
    };
    if (coursePickerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [coursePickerOpen]);

  return (
    <header className="sticky top-0 z-30 h-[56px] md:h-[70px] bg-snow border-b-2 border-swan px-3 sm:px-6 flex items-center justify-between select-none transition-all">
      {/* 1. COURSE PICKER FLAG PILL BUTTON (B1 & A3) */}
      <div className="relative" ref={coursePickerRef}>
        <button
          type="button"
          onClick={() => setCoursePickerOpen(!coursePickerOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-pill border-2 border-swan bg-snow hover:bg-polar cursor-pointer shadow-xs transition-all active:translate-y-0.5"
          aria-label="Course Picker"
        >
          <span className="w-5 h-5 rounded-full bg-[#c60b1e] flex items-center justify-center text-[9px] font-black text-[#ffc400] shrink-0">
            ES
          </span>
          <span className="hidden sm:inline text-xs font-black text-eel uppercase tracking-wider">
            Spanish
          </span>
        </button>

        {/* Course Picker Popover Card */}
        {coursePickerOpen && (
          <div className="absolute top-12 left-0 z-40 w-[300px] bg-snow border-2 border-swan rounded-[16px] p-4 shadow-xl text-eel animate-pop flex flex-col">
            <span className="text-[12px] font-bold text-hare uppercase tracking-wider mb-3">
              MY COURSES
            </span>

            {/* Active Spanish Row */}
            <div className="bg-iguana border-2 border-humpback rounded-btn p-3 flex items-center justify-between font-extrabold text-sm mb-2 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#c60b1e] flex items-center justify-center text-[9px] font-black text-[#ffc400] shrink-0">
                  ES
                </span>
                <span className="text-macaw font-black text-sm">Spanish</span>
              </div>
              <CheckIcon className="w-5 h-5 text-macaw" />
            </div>

            <div className="h-[2px] bg-swan my-2" />

            {/* 4 Inactive Rows */}
            <div className="flex flex-col gap-2">
              {[
                { name: "French", flag: "FR", color: "bg-[#002395] text-snow" },
                { name: "German", flag: "DE", color: "bg-[#000000] text-[#ffce00]" },
                { name: "Japanese", flag: "JP", color: "bg-snow border border-swan text-[#bc002d]" },
                { name: "Italian", flag: "IT", color: "bg-[#009246] text-snow" },
              ].map((lang) => (
                <div
                  key={lang.name}
                  className="p-2.5 rounded-btn flex items-center justify-between opacity-55 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${lang.color}`}
                    >
                      {lang.flag}
                    </span>
                    <span className="text-sm font-extrabold text-eel">{lang.name}</span>
                  </div>
                  <span className="bg-polar text-hare text-[10px] font-black px-2 py-0.5 rounded-pill border border-swan uppercase tracking-wider">
                    SOON
                  </span>
                </div>
              ))}
            </div>

            {/* Footer Row */}
            <button
              type="button"
              onClick={() => setShowAddCourseNote(!showAddCourseNote)}
              className="mt-3 pt-3 border-t-2 border-swan flex items-center justify-between text-sm font-extrabold text-macaw hover:opacity-80 transition-opacity cursor-pointer w-full text-left"
            >
              <div className="flex items-center gap-2">
                <PlusCircleIcon className="w-5 h-5 text-macaw" />
                <span>ADD A NEW COURSE</span>
              </div>
              {showAddCourseNote && (
                <span className="text-xs font-bold text-wolf italic">
                  Coming Soon
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. STATS CLUSTER */}
      <div className="flex items-center gap-2.5 sm:gap-6">
        {/* STREAK */}
        <div
          className="relative flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          onMouseEnter={() => setHoveredItem("streak")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <FlameIcon
            className={`w-5 h-5 sm:w-6 sm:h-6 ${isZeroStreak ? "text-hare" : "text-fox"}`}
          />
          <span
            className={`text-sm sm:text-base font-extrabold ${
              isZeroStreak ? "text-hare" : "text-fox"
            }`}
          >
            {streakCount}
          </span>

          {hoveredItem === "streak" && (
            <div className="absolute top-10 right-0 w-48 bg-snow border-2 border-swan rounded-card p-3 shadow-lg text-xs font-bold text-eel z-40 animate-pop">
              <span className="text-fox font-extrabold block mb-1 uppercase tracking-wider">
                Streak Flame
              </span>
              {isZeroStreak
                ? "Do a lesson today to start a new streak!"
                : `${streakCount} day streak! Complete a lesson daily to keep it alive.`}
            </div>
          )}
        </div>

        {/* GEMS */}
        <div
          className="relative flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          onMouseEnter={() => setHoveredItem("gems")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <GemIcon className="w-5 h-5 sm:w-6 sm:h-6 text-beetle" />
          <span className="text-sm sm:text-base font-extrabold text-beetle">
            {user?.gems ?? 0}
          </span>

          {hoveredItem === "gems" && (
            <div className="absolute top-10 right-0 w-48 bg-snow border-2 border-swan rounded-card p-3 shadow-lg text-xs font-bold text-eel z-40 animate-pop">
              <span className="text-beetle font-extrabold block mb-1 uppercase tracking-wider">
                Gems
              </span>
              Use gems in the shop or to refill your hearts instantly during lessons.
            </div>
          )}
        </div>

        {/* HEARTS */}
        <div
          className="relative flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          onMouseEnter={() => setHoveredItem("hearts")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cardinal" />
          <span className="text-sm sm:text-base font-extrabold text-cardinal">
            {user?.hearts ?? 0}
          </span>

          {hoveredItem === "hearts" && (
            <div className="absolute top-10 right-0 w-52 bg-snow border-2 border-swan rounded-card p-3 shadow-lg text-xs font-bold text-eel z-40 animate-pop">
              <span className="text-cardinal font-extrabold block mb-1 uppercase tracking-wider">
                Hearts
              </span>
              Hearts let you practice lessons. They regenerate automatically every 4 hours.
            </div>
          )}
        </div>

        {/* XP (Hidden below 420px for mobile F2) */}
        <div
          className="relative hidden min-[420px]:flex items-center gap-1 sm:gap-1.5 cursor-pointer"
          onMouseEnter={() => setHoveredItem("xp")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <XpBoltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-bee" />
          <span className="text-sm sm:text-base font-extrabold text-bee">
            {user?.total_xp ?? 0}
          </span>

          {hoveredItem === "xp" && (
            <div className="absolute top-10 right-0 w-48 bg-snow border-2 border-swan rounded-card p-3 shadow-lg text-xs font-bold text-eel z-40 animate-pop">
              <span className="text-bee font-extrabold block mb-1 uppercase tracking-wider">
                Total XP
              </span>
              Experience points earned across completed lessons and practice sessions.
            </div>
          )}
        </div>

        {/* SOUND MUTE TOGGLE BUTTON (G4) */}
        <button
          type="button"
          onClick={toggleSound}
          className="p-1.5 rounded-full hover:bg-polar transition-colors text-wolf hover:text-eel cursor-pointer"
          title={soundEnabled ? "Mute audio" : "Enable audio"}
        >
          {soundEnabled ? (
            <SpeakerIcon className="w-5 h-5 text-macaw" />
          ) : (
            <SpeakerMutedIcon className="w-5 h-5 text-hare" />
          )}
        </button>

        {/* MOBILE SETTINGS ICON (MD HIDDEN) */}
        <Link
          href="/settings"
          className="md:hidden p-1.5 rounded-full hover:bg-polar text-wolf transition-colors"
          title="Settings"
        >
          <DotsIcon className="w-5 h-5 text-wolf" />
        </Link>
      </div>
    </header>
  );
}
