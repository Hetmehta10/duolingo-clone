import React from "react";

interface ProgressBarProps {
  progress: number; // between 0 and 1
  className?: string;
}

export function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const percent = Math.round(clamped * 100);

  return (
    <div
      className={`relative w-full h-4 bg-swan rounded-pill overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-feather rounded-pill progress-fill"
        style={{ width: `${percent}%` }}
      />
      {/* Gloss reflection highlight */}
      {percent > 5 && (
        <div
          className="absolute top-1 left-2 h-1 bg-snow/30 rounded-pill progress-fill"
          style={{ width: `${Math.max(0, percent - 6)}%` }}
        />
      )}
    </div>
  );
}
