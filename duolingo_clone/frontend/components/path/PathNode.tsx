"use client";

import React from "react";
import { SkillOverview } from "@/lib/types";
import { CrownIcon, LockIcon, StarIcon } from "@/components/ui/Icons";

interface PathNodeProps {
  skill: SkillOverview;
  unitThemeColor: string;
  isCurrent: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function PathNode({
  skill,
  unitThemeColor,
  isCurrent,
  onClick,
}: PathNodeProps) {
  const isCompleted = skill.state === "completed";
  const isInProgress = skill.state === "in_progress";
  const isAvailable = skill.state === "available";
  const isLocked = skill.state === "locked";

  // Compute colors
  let fillColor = unitThemeColor;
  let shadowColor = "#48ab02"; // fallback dark

  if (isCompleted) {
    fillColor = "#ffc800";
    shadowColor = "#e6a800";
  } else if (isLocked) {
    fillColor = "#e5e5e5";
    shadowColor = "#b7b7b7";
  } else {
    // For unitThemeColor, compute a darker shade or use custom matching
    if (unitThemeColor === "#58cc02") shadowColor = "#48ab02";
    else if (unitThemeColor === "#1cb0f6") shadowColor = "#1899d6";
    else if (unitThemeColor === "#ce82ff") shadowColor = "#b558f6";
    else shadowColor = "rgba(0,0,0,0.2)";
  }

  // Progress Ring Calculation (for crown_level 1..max-1)
  const showProgressRing =
    isInProgress && skill.crown_level > 0 && skill.crown_level < skill.max_crown_level;
  const radius = 37;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = skill.crown_level / skill.max_crown_level;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="relative flex flex-col items-center select-none z-10">
      {/* Floating START Banner for Current Node */}
      {isCurrent && (
        <div className="absolute -top-10 z-20 flex flex-col items-center animate-bounce-soft pointer-events-none">
          <div className="bg-snow border-2 border-swan rounded-pill px-3 py-1 shadow-md">
            <span className="text-xs font-black text-feather uppercase tracking-widest">
              START
            </span>
          </div>
          {/* Downward triangle tail */}
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-swan" />
        </div>
      )}

      {/* Optional Progress Ring */}
      {showProgressRing && (
        <svg
          className="absolute -top-2.5 -left-2.5 w-[90px] h-[90px] pointer-events-none z-10"
          viewBox="0 0 90 90"
        >
          {/* Track */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth="7"
          />
          {/* Bee progress arc */}
          <circle
            cx="45"
            cy="45"
            r={radius}
            fill="none"
            stroke="#ffc800"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 45 45)"
            className="transition-all duration-500 ease-out"
          />
        </svg>
      )}

      {/* Main Node Circle (70px) */}
      <button
        type="button"
        disabled={isLocked}
        onClick={onClick}
        className={`relative w-[70px] h-[70px] rounded-full flex items-center justify-center transition-all select-none ${
          isLocked
            ? "cursor-not-allowed"
            : "cursor-pointer active:translate-y-2 active:[box-shadow:none] hover:brightness-105"
        }`}
        style={{
          backgroundColor: fillColor,
          boxShadow: isLocked ? `0 8px 0 ${shadowColor}` : `0 8px 0 ${shadowColor}`,
        }}
        aria-label={`${skill.title} node, state: ${skill.state}`}
      >
        {isCompleted && <CrownIcon className="w-8 h-8 text-snow" />}
        {(isInProgress || isAvailable) && <StarIcon className="w-8 h-8 text-snow" />}
        {isLocked && <LockIcon className="w-8 h-8 text-[#afafaf]" />}
      </button>
    </div>
  );
}
