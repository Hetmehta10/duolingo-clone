import React from "react";
import { HeartIcon } from "./Icons";

interface HeartCounterProps {
  count: number;
  animatePop?: boolean;
  className?: string;
}

export function HeartCounter({ count, animatePop = false, className = "" }: HeartCounterProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 font-extrabold text-cardinal ${className}`}>
      <div className={animatePop ? "animate-pop" : ""}>
        <HeartIcon className="w-7 h-7 text-cardinal drop-shadow-sm" />
      </div>
      <span className="text-lg font-bold select-none">{count}</span>
    </div>
  );
}
