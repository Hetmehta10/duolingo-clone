"use client";

import React, { useState } from "react";
import { BookIcon, CloseXIcon } from "@/components/ui/Icons";

interface UnitHeaderProps {
  orderIndex: number;
  title: string;
  description: string;
  themeColor: string;
}

export function UnitHeader({
  orderIndex,
  title,
  description,
  themeColor,
}: UnitHeaderProps) {
  const [showGuidebook, setShowGuidebook] = useState<boolean>(false);

  return (
    <>
      <div
        className="sticky top-[70px] z-20 w-full rounded-card p-5 mb-6 flex items-center justify-between text-snow shadow-sm"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-wider text-snow/80">
            Unit {orderIndex}
          </span>
          <h2 className="text-2xl font-black text-snow mt-0.5">{title}</h2>
        </div>

        <button
          type="button"
          onClick={() => setShowGuidebook(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-btn border-2 border-snow bg-transparent text-snow font-extrabold text-xs uppercase tracking-wider select-none transition-all [box-shadow:0_4px_0_rgba(255,255,255,0.3)] hover:bg-snow/10 active:translate-y-1 active:[box-shadow:none]"
        >
          <BookIcon className="w-4 h-4 text-snow" />
          <span>GUIDEBOOK</span>
        </button>
      </div>

      {/* Guidebook Modal */}
      {showGuidebook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-snow rounded-card border-2 border-swan p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-pop">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-snow mb-4"
              style={{ backgroundColor: themeColor }}
            >
              <BookIcon className="w-8 h-8 text-snow" />
            </div>

            <h3 className="text-2xl font-extrabold text-eel">Guidebook</h3>
            <span className="text-xs font-black text-wolf uppercase tracking-wider mt-1 mb-3">
              Unit {orderIndex}: {title}
            </span>

            <p className="text-sm font-semibold text-wolf mb-6">{description}</p>

            <button
              type="button"
              onClick={() => setShowGuidebook(false)}
              className="w-full py-3 bg-feather text-snow font-extrabold text-sm uppercase tracking-wider rounded-btn [box-shadow:0_4px_0_#58a700] active:translate-y-1 active:[box-shadow:none]"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
