"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { advanceDay, getLeaderboard, resetUser, setHearts } from "@/lib/api";
import { LeaderboardEntry } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { DuoButton } from "@/components/ui/DuoButton";
import { ChestIcon, TrophyIcon } from "@/components/ui/Icons";

export function DailyGoalCard() {
  const { user } = useUser();
  const dailyGoal = user?.daily_goal_xp || 50;
  const xpToday = user?.xp_today || 0;
  const goalMet = user?.goal_met || xpToday >= dailyGoal;
  const progressRatio = Math.min(1, xpToday / dailyGoal);

  return (
    <div className="bg-snow border-2 border-swan rounded-card p-5 shadow-xs flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-eel uppercase tracking-wider">
          Daily Quests
        </h3>
        <span className="text-xs font-bold text-wolf">
          {goalMet ? "Completed!" : "In Progress"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-bee/20 flex items-center justify-center text-bee shrink-0">
          <ChestIcon className="w-6 h-6 text-bee" />
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-eel">
            <span>Earn {dailyGoal} XP</span>
            <span className="text-wolf">
              {xpToday} / {dailyGoal}
            </span>
          </div>

          <div className="w-full h-3 bg-swan rounded-pill overflow-hidden">
            <div
              className="h-full bg-bee progress-fill"
              style={{ width: `${Math.round(progressRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DevSwitcherCard() {
  const { userId, usersList, switchUser, refreshUser } = useUser();
  const [devLoading, setDevLoading] = useState<boolean>(false);

  const handleAdvanceDay = async () => {
    if (!userId || devLoading) return;
    try {
      setDevLoading(true);
      await advanceDay(userId, 1);
      await refreshUser();
    } finally {
      setDevLoading(false);
    }
  };

  const handleSetZeroHearts = async () => {
    if (!userId || devLoading) return;
    try {
      setDevLoading(true);
      await setHearts(userId, 0);
      await refreshUser();
    } finally {
      setDevLoading(false);
    }
  };

  const handleResetUser = async () => {
    if (!userId || devLoading) return;
    try {
      setDevLoading(true);
      await resetUser(userId);
      await refreshUser();
    } finally {
      setDevLoading(false);
    }
  };

  return (
    <div className="bg-polar border-2 border-dashed border-swan rounded-card p-4 flex flex-col gap-3 w-full">
      <span className="text-[11px] font-black text-wolf uppercase tracking-wider">
        DEV — SWITCH LEARNER
      </span>

      <select
        value={userId}
        onChange={(e) => switchUser(parseInt(e.target.value, 10))}
        className="w-full bg-snow border-2 border-swan rounded-btn px-3 py-2 text-xs font-extrabold text-eel outline-none cursor-pointer focus:border-macaw"
        aria-label="Switch User Profile"
      >
        {usersList.map((u) => (
          <option key={u.id} value={u.id}>
            {u.display_name} ({u.username})
          </option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-1.5 mt-1">
        <button
          type="button"
          disabled={devLoading}
          onClick={handleAdvanceDay}
          className="py-1.5 px-1 bg-snow border-2 border-swan rounded-btn text-[10px] font-extrabold text-wolf hover:bg-polar active:bg-swan text-center transition-colors disabled:opacity-50"
        >
          +1 DAY
        </button>
        <button
          type="button"
          disabled={devLoading}
          onClick={handleSetZeroHearts}
          className="py-1.5 px-1 bg-snow border-2 border-swan rounded-btn text-[10px] font-extrabold text-cardinal hover:bg-walkingFish active:bg-cardinal active:text-snow text-center transition-colors disabled:opacity-50"
        >
          0 HEARTS
        </button>
        <button
          type="button"
          disabled={devLoading}
          onClick={handleResetUser}
          className="py-1.5 px-1 bg-snow border-2 border-swan rounded-btn text-[10px] font-extrabold text-wolf hover:bg-polar active:bg-swan text-center transition-colors disabled:opacity-50"
        >
          RESET
        </button>
      </div>
    </div>
  );
}

export function RightRail() {
  const { user, userId } = useUser();
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboard(userId, 3)
      .then((data) => setTopUsers(data.entries.slice(0, 3)))
      .catch((err) => console.error("Failed to load leaderboard teaser:", err));
  }, [userId, user]);

  const rankBadgeColors: Record<number, string> = {
    1: "bg-bee text-snow",
    2: "bg-swan text-wolf",
    3: "bg-fox text-snow",
  };

  return (
    <aside className="hidden min-[1200px]:flex fixed top-0 right-0 bottom-0 w-80 bg-snow border-l-2 border-swan p-6 flex-col gap-6 overflow-y-auto select-none z-20">
      {/* 1. DAILY QUESTS CARD */}
      <DailyGoalCard />

      {/* 2. LEADERBOARD TEASER CARD */}
      <div className="bg-snow border-2 border-swan rounded-card p-5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-eel uppercase tracking-wider">
            Leaderboard
          </h3>
          <Link
            href="/leaderboard"
            className="text-xs font-black text-macaw uppercase tracking-wider hover:underline"
          >
            VIEW LEAGUE
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {topUsers.map((u) => (
            <div
              key={u.user_id}
              className={`flex items-center justify-between p-2 rounded-btn ${
                u.is_current_user ? "bg-iguana/60 border border-humpback" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center ${
                    rankBadgeColors[u.rank] || "bg-polar text-wolf"
                  }`}
                >
                  {u.rank}
                </span>

                <Avatar
                  displayName={u.display_name}
                  color={u.avatar_color}
                  size={28}
                />

                <span className="text-xs font-extrabold text-eel truncate max-w-[110px]">
                  {u.display_name}
                </span>
              </div>

              <span className="text-xs font-extrabold text-wolf">{u.total_xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. DEV SWITCHER CARD */}
      <DevSwitcherCard />
    </aside>
  );
}
