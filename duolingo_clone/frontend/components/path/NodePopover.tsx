"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { SkillOverview } from "@/lib/types";

interface NodePopoverProps {
  skill: SkillOverview;
  unitThemeColor: string;
  onClose: () => void;
}

export function NodePopover({
  skill,
  unitThemeColor,
  onClose,
}: NodePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const isLocked = skill.state === "locked";
  const isCompleted = skill.state === "completed";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const buttonText = isCompleted
    ? "PRACTICE +5 XP"
    : skill.crown_level > 0 || skill.lessons_done_in_level > 0
    ? "CONTINUE"
    : "START";

  const lessonSubtext = isCompleted
    ? "All levels completed"
    : `Lesson ${skill.lessons_done_in_level + 1} of ${skill.lessons_per_level}`;

  if (isLocked) {
    return (
      <div
        ref={popoverRef}
        className="absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 z-50 w-64 max-w-[calc(100vw-32px)] sm:max-w-xs bg-swan border-2 border-[#b7b7b7] rounded-card p-4 shadow-xl flex flex-col items-center text-center animate-pop"
      >
        {/* Upward triangle tail */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-swan" />

        <h4 className="text-base font-extrabold text-eel mb-1">{skill.title}</h4>
        <p className="text-xs font-semibold text-wolf mb-4">
          Complete all levels above to unlock this skill!
        </p>

        <button
          type="button"
          disabled
          className="w-full py-2.5 rounded-btn bg-[#d0d0d0] text-hare font-extrabold text-xs uppercase tracking-wider cursor-not-allowed"
        >
          LOCKED
        </button>
      </div>
    );
  }

  return (
    <div
      ref={popoverRef}
      className="absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 z-50 w-72 max-w-[calc(100vw-32px)] sm:max-w-xs rounded-card p-5 shadow-2xl flex flex-col items-center text-center text-snow animate-pop"
      style={{ backgroundColor: unitThemeColor }}
    >
      {/* Upward triangle tail */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-b-8"
        style={{ borderBottomColor: unitThemeColor }}
      />

      <h4 className="text-xl font-black text-snow mb-0.5">{skill.title}</h4>
      <p className="text-xs font-bold text-snow/80 mb-4">{lessonSubtext}</p>

      <Link
        href={`/lesson/${skill.id}`}
        className="w-full no-underline"
        onClick={onClose}
      >
        <button
          type="button"
          className="w-full py-3 rounded-btn bg-snow font-black text-sm uppercase tracking-wider select-none transition-all [box-shadow:0_4px_0_rgba(0,0,0,0.15)] active:translate-y-1 active:[box-shadow:none] hover:brightness-105"
          style={{ color: unitThemeColor }}
        >
          {buttonText}
        </button>
      </Link>
    </div>
  );
}
