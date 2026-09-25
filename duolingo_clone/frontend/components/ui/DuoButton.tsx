import React from "react";

export type DuoButtonVariant = "primary" | "danger" | "info" | "gold" | "ghost" | "disabled";
export type DuoButtonSize = "sm" | "md" | "lg";

interface DuoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DuoButtonVariant;
  size?: DuoButtonSize;
  fullWidth?: boolean;
}

export function DuoButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  children,
  className = "",
  type = "button",
  ...props
}: DuoButtonProps) {
  const effectiveVariant = disabled ? "disabled" : variant;

  const baseStyles =
    "inline-flex items-center justify-center font-extrabold uppercase rounded-btn select-none transition-all duration-75 text-center";

  const sizeStyles: Record<DuoButtonSize, string> = {
    sm: "py-2 px-4 text-xs tracking-[2px]",
    md: "py-3 px-6 text-sm tracking-[2px]",
    lg: "py-4 px-8 text-base tracking-[2px]",
  };

  const variantStyles: Record<DuoButtonVariant, string> = {
    primary:
      "bg-feather text-snow [box-shadow:0_4px_0_#58a700] hover:brightness-105 active:translate-y-1 active:[box-shadow:0_0px_0_#58a700]",
    danger:
      "bg-cardinal text-snow [box-shadow:0_4px_0_#ea2b2b] hover:brightness-105 active:translate-y-1 active:[box-shadow:0_0px_0_#ea2b2b]",
    info:
      "bg-macaw text-snow [box-shadow:0_4px_0_#1899d6] hover:brightness-105 active:translate-y-1 active:[box-shadow:0_0px_0_#1899d6]",
    gold:
      "bg-bee text-snow [box-shadow:0_4px_0_#e6a800] hover:brightness-105 active:translate-y-1 active:[box-shadow:0_0px_0_#e6a800]",
    ghost:
      "bg-transparent border-2 border-swan text-wolf hover:bg-polar active:translate-y-1 active:bg-swan",
    disabled:
      "bg-swan text-hare cursor-not-allowed shadow-none active:translate-y-0",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      disabled={disabled || effectiveVariant === "disabled"}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[effectiveVariant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
