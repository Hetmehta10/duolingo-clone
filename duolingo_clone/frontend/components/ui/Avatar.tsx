import React from "react";

interface AvatarProps {
  displayName: string;
  color: string;
  size?: number;
  className?: string;
}

export function Avatar({
  displayName,
  color,
  size = 48,
  className = "",
}: AvatarProps) {
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";
  const fontSize = Math.max(12, Math.round(size * 0.44));

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full text-snow font-black select-none shrink-0 shadow-xs ${className}`}
      style={{
        backgroundColor: color || "#58cc02",
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${fontSize}px`,
      }}
      aria-label={`Avatar for ${displayName}`}
    >
      {initial}
    </div>
  );
}
