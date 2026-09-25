"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-snow border-2 border-swan rounded-[12px] px-5 py-3 shadow-xl flex items-center gap-3 animate-slide-up text-sm font-extrabold text-eel select-none">
      <span>{message}</span>
    </div>
  );
}
