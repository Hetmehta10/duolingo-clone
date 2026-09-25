import React from "react";

export type MascotMood = "idle" | "cheer" | "sad";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

export function Mascot({ mood = "idle", size = 120, className = "" }: MascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none ${className}`}
    >
      {/* Feet */}
      <ellipse cx="62" cy="148" rx="14" ry="7" fill="#ffc800" />
      <ellipse cx="98" cy="148" rx="14" ry="7" fill="#ffc800" />

      {/* Main Body */}
      <path
        d="M80 20C48 20 30 48 30 92C30 134 50 148 80 148C110 148 130 134 130 92C130 48 112 20 80 20Z"
        fill="#58cc02"
      />

      {/* Feather Belly Patch */}
      <path
        d="M80 75C60 75 48 94 48 116C48 138 62 144 80 144C98 144 112 138 112 116C112 94 100 75 80 75Z"
        fill="#89e219"
      />
      {/* Belly markings */}
      <path
        d="M74 95Q80 102 86 95"
        stroke="#58a700"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M68 112Q74 118 80 112"
        stroke="#58a700"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M80 112Q86 118 92 112"
        stroke="#58a700"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wings based on mood */}
      {mood === "cheer" ? (
        <>
          {/* Wings raised up in celebration */}
          <path
            d="M32 80C16 65 14 36 28 32C38 30 46 54 44 75Z"
            fill="#58a700"
          />
          <path
            d="M128 80C144 65 146 36 132 32C122 30 114 54 116 75Z"
            fill="#58a700"
          />
        </>
      ) : (
        <>
          {/* Default resting wings */}
          <path
            d="M32 75C22 88 22 115 34 125C38 120 40 105 38 88Z"
            fill="#58a700"
          />
          <path
            d="M128 75C138 88 138 115 126 125C122 120 120 105 122 88Z"
            fill="#58a700"
          />
        </>
      )}

      {/* Eyes & Eyeballs based on mood */}
      {mood === "idle" && (
        <>
          {/* Left Eye */}
          <circle cx="58" cy="56" r="18" fill="#ffffff" />
          <circle cx="60" cy="56" r="9" fill="#4b4b4b" />
          <circle cx="63" cy="53" r="3.5" fill="#ffffff" />

          {/* Right Eye */}
          <circle cx="102" cy="56" r="18" fill="#ffffff" />
          <circle cx="100" cy="56" r="9" fill="#4b4b4b" />
          <circle cx="103" cy="53" r="3.5" fill="#ffffff" />
        </>
      )}

      {mood === "cheer" && (
        <>
          {/* Joyful arched happy eyes */}
          <path
            d="M44 58C44 48 70 48 70 58"
            stroke="#4b4b4b"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M90 58C90 48 116 48 116 58"
            stroke="#4b4b4b"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Cheerful blush */}
          <circle cx="44" cy="68" r="6" fill="#ff4b4b" opacity="0.35" />
          <circle cx="116" cy="68" r="6" fill="#ff4b4b" opacity="0.35" />
        </>
      )}

      {mood === "sad" && (
        <>
          {/* Sad drooping eyes */}
          <circle cx="58" cy="60" r="17" fill="#ffffff" />
          <circle cx="59" cy="64" r="8" fill="#4b4b4b" />
          <circle cx="62" cy="62" r="3" fill="#ffffff" />
          {/* Drooped left eyelid */}
          <path d="M41 54C46 48 70 50 75 58" stroke="#58a700" strokeWidth="6" strokeLinecap="round" />

          <circle cx="102" cy="60" r="17" fill="#ffffff" />
          <circle cx="101" cy="64" r="8" fill="#4b4b4b" />
          <circle cx="104" cy="62" r="3" fill="#ffffff" />
          {/* Drooped right eyelid */}
          <path d="M119 54C114 48 90 50 85 58" stroke="#58a700" strokeWidth="6" strokeLinecap="round" />

          {/* Teardrop */}
          <path
            d="M44 76C42 82 48 86 50 82C52 78 46 72 44 76Z"
            fill="#1cb0f6"
          />
        </>
      )}

      {/* Beak */}
      <polygon points="80,58 70,72 90,72" fill="#ffc800" />
      <polygon points="80,74 72,72 88,72" fill="#e5b400" />
    </svg>
  );
}
