"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { RightRail } from "./RightRail";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base text-ink flex">
      {/* Sidebar & Mobile Bottom Navigation */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 pl-0 md:pl-[88px] min-[1200px]:pl-64 min-[1200px]:pr-80 pb-[76px] md:pb-0 flex flex-col min-h-screen transition-all">
        <TopBar />
        <main className="flex-1 w-full max-w-[640px] mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col items-center">
          {children}
        </main>
      </div>

      {/* Fixed Right Rail (320px) */}
      <RightRail />
    </div>
  );
}
