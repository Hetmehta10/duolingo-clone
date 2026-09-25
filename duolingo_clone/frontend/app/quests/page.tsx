"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarIcon, ChestIcon } from "@/components/ui/Icons";

export default function QuestsPage() {
  const { user } = useUser();

  const dailyGoal = user?.daily_goal_xp || 50;
  const xpToday = user?.xp_today || 0;
  const goalMet = user?.goal_met || xpToday >= dailyGoal;
  const progressRatio = Math.min(1, xpToday / dailyGoal);

  return (
    <AppShell>
      <div className="max-w-[600px] w-full mx-auto flex flex-col gap-6 py-6 px-4 select-none">
        {/* Title */}
        <h1 className="text-[32px] font-black text-eel leading-tight">Quests</h1>

        {/* 1. DAILY QUESTS CARD */}
        <div className="bg-snow border-2 border-swan rounded-card p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-eel uppercase tracking-wider">
              Daily Quests
            </h2>
            <span className="text-xs font-bold text-wolf uppercase tracking-wider">
              {goalMet ? "Completed!" : "In Progress"}
            </span>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="w-12 h-12 rounded-full bg-bee/20 flex items-center justify-center text-bee shrink-0">
              <ChestIcon className="w-7 h-7 text-bee" size={28} />
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm font-extrabold text-eel">
                <span>Earn {dailyGoal} XP</span>
                <span className="text-wolf">
                  {xpToday} / {dailyGoal}
                </span>
              </div>

              <div className="w-full h-3.5 bg-swan rounded-pill overflow-hidden">
                <div
                  className="h-full bg-bee progress-fill"
                  style={{ width: `${Math.round(progressRatio * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. FRIENDS QUESTS CARD (Placeholder) */}
        <div className="bg-snow border-2 border-swan rounded-card p-6 flex items-center justify-between gap-4 opacity-55 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-card bg-bee/20 flex items-center justify-center text-bee shrink-0">
              <CalendarIcon className="w-7 h-7 text-bee" size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-eel leading-tight">
                Friends Quests
              </span>
              <span className="text-xs font-bold text-wolf mt-0.5">
                Complete shared challenges with your friends
              </span>
            </div>
          </div>
          <span className="bg-polar text-hare text-xs font-black px-2.5 py-1 rounded-pill border border-swan uppercase tracking-wider shrink-0">
            COMING SOON
          </span>
        </div>

        {/* 3. MONTHLY CHALLENGE CARD (Placeholder) */}
        <div className="bg-snow border-2 border-swan rounded-card p-6 flex items-center justify-between gap-4 opacity-55 cursor-not-allowed">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-card bg-bee/20 flex items-center justify-center text-bee shrink-0">
              <CalendarIcon className="w-7 h-7 text-bee" size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-eel leading-tight">
                Monthly Challenge
              </span>
              <span className="text-xs font-bold text-wolf mt-0.5">
                Earn 10 quest points this month to unlock an exclusive badge
              </span>
            </div>
          </div>
          <span className="bg-polar text-hare text-xs font-black px-2.5 py-1 rounded-pill border border-swan uppercase tracking-wider shrink-0">
            COMING SOON
          </span>
        </div>
      </div>
    </AppShell>
  );
}
