"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UnitOverview } from "@/lib/types";
import { TrophyIcon } from "@/components/ui/Icons";

interface LegendaryNodeProps {
  unit: UnitOverview;
}

export function LegendaryNode({ unit }: LegendaryNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isLegendary = unit.is_legendary ?? false;
  const isUnlocked = unit.legendary_unlocked ?? false;
  const isLocked = !isUnlocked;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  let nodeStyle: React.CSSProperties = {
    backgroundColor: "#e5e5e5",
    boxShadow: "0 8px 0 #b7b7b7",
  };
  let trophyClass = "w-9 h-9 text-hare";

  if (isLegendary) {
    nodeStyle = {
      background: "linear-gradient(135deg, #ce82ff 0%, #ffc800 100%)",
      boxShadow: "0 8px 0 #b558f6",
    };
    trophyClass = "w-9 h-9 text-snow";
  } else if (isUnlocked) {
    nodeStyle = {
      backgroundColor: "#ffc800",
      boxShadow: "0 8px 0 #e6a800",
    };
    trophyClass = "w-9 h-9 text-snow";
  }

  return (
    <div className="relative flex flex-col items-center select-none z-10 mt-2">
      {/* Outer Pulse Glow Ring when unlocked but not yet legendary */}
      {isUnlocked && !isLegendary && (
        <div className="absolute -top-2 -left-2 w-[92px] h-[92px] rounded-full border-4 border-bee animate-ping opacity-30 pointer-events-none" />
      )}

      {/* Main Legendary Node Button */}
      <button
        type="button"
        disabled={isLocked}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`relative w-[76px] h-[76px] rounded-full flex items-center justify-center transition-all ${
          isLocked
            ? "cursor-not-allowed"
            : "cursor-pointer active:translate-y-2 active:[box-shadow:none] hover:brightness-105"
        }`}
        style={nodeStyle}
        aria-label={`Legendary Challenge node for Unit ${unit.order_index}`}
      >
        <TrophyIcon className={trophyClass} size={36} />
      </button>

      {/* LEGENDARY Pill for Completed */}
      {isLegendary && (
        <div className="mt-2 bg-bee text-snow text-[10px] font-black uppercase px-2.5 py-0.5 rounded-pill shadow-xs tracking-widest">
          LEGENDARY
        </div>
      )}

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-[calc(100%+14px)] z-50 w-72 max-w-[calc(100vw-32px)] sm:max-w-xs rounded-card p-5 shadow-2xl flex flex-col items-center text-center text-snow animate-pop left-1/2 -translate-x-1/2 bg-bee"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-bee" />

          <h4 className="text-xl font-black text-snow mb-1">
            {isLegendary
              ? "Legendary!"
              : isUnlocked
              ? "Legendary Challenge"
              : "Legendary Locked"}
          </h4>

          <p className="text-xs font-bold text-snow/90 mb-4">
            {isLegendary
              ? "Unit mastered at Legendary level!"
              : isUnlocked
              ? "10 questions. 3 mistakes allowed. Hearts are not used."
              : "Complete every skill in this unit to unlock the Legendary Challenge"}
          </p>

          {isLocked ? (
            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-btn bg-[#d0d0d0] text-hare font-extrabold text-xs uppercase tracking-wider cursor-not-allowed"
            >
              LOCKED
            </button>
          ) : (
            <Link
              href={`/lesson/legendary/${unit.id}`}
              className="w-full no-underline"
              onClick={() => setIsOpen(false)}
            >
              <button
                type="button"
                className="w-full py-3 rounded-btn bg-snow text-bee font-black text-sm uppercase tracking-wider select-none transition-all [box-shadow:0_4px_0_rgba(0,0,0,0.15)] active:translate-y-1 active:[box-shadow:none] hover:brightness-105"
              >
                {isLegendary ? "PRACTICE AGAIN" : "START CHALLENGE +40 XP"}
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
