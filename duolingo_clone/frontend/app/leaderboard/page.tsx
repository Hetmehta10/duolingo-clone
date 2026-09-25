"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getLeaderboard } from "@/lib/api";
import { LeaderboardResponse, LeaderboardEntry } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import { Mascot } from "@/components/ui/Mascot";
import { DuoButton } from "@/components/ui/DuoButton";

export default function LeaderboardPage() {
  const { user, userId, isLoading: userLoading } = useUser();
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"league" | "friends">("league");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getLeaderboard(userId, 10)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error("Failed to load leaderboard:", err);
        setError("Failed to load leaderboard. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, user]);

  return (
    <AppShell>
      {loading || userLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-feather border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error || !data ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-base font-bold text-eel">
            {error || "Leaderboard not found."}
          </p>
        </div>
      ) : (
        <div className="max-w-[600px] w-full mx-auto flex flex-col gap-6 py-6 px-4">
          {/* 1. LEAGUE BANNER */}
          <div className="bg-snow border-2 border-swan rounded-card p-8 flex flex-col items-center text-center">
            {/* Hand-authored shield SVG in bronze brown with "1" in its centre */}
            <div className="relative w-20 h-24 flex items-center justify-center">
              <svg
                viewBox="0 0 100 120"
                className="w-full h-full drop-shadow-sm"
                fill="none"
              >
                <path
                  d="M50 0L10 18V55C10 85 50 115 50 115C50 115 90 85 90 55V18L50 0Z"
                  fill="#cd7f32"
                />
                <path
                  d="M50 8L18 22V55C18 78 50 103 50 103C50 103 82 78 82 55V22L50 8Z"
                  fill="#a05a1c"
                  opacity="0.35"
                />
                <text
                  x="50"
                  y="68"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="38"
                  fontWeight="900"
                  fontFamily="inherit"
                >
                  1
                </text>
              </svg>
            </div>

            <h1 className="text-[26px] font-black text-eel leading-tight mt-3">
              Bronze League
            </h1>
            <p className="text-[15px] font-bold text-wolf mt-1">
              Top 3 learners advance to the next league
            </p>

            {data.current_user_rank !== null && (
              <p className="text-[15px] font-black text-eel mt-3">
                You are ranked #{data.current_user_rank} of {data.entries.length}
              </p>
            )}
          </div>

          {/* TAB SWITCHER */}
          <div className="flex border-b-2 border-swan gap-8 px-2 select-none">
            <button
              type="button"
              onClick={() => setActiveTab("league")}
              className={`pb-3 text-sm font-black uppercase tracking-wider transition-colors relative ${
                activeTab === "league"
                  ? "text-macaw border-b-2 border-macaw -mb-[2px]"
                  : "text-wolf hover:text-eel"
              }`}
            >
              LEAGUE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`pb-3 text-sm font-black uppercase tracking-wider transition-colors relative ${
                activeTab === "friends"
                  ? "text-macaw border-b-2 border-macaw -mb-[2px]"
                  : "text-wolf hover:text-eel"
              }`}
            >
              FRIENDS
            </button>
          </div>

          {/* 2. TAB CONTENTS */}
          {activeTab === "league" ? (
            <>
              <div className="bg-snow border-2 border-swan rounded-card p-4 sm:p-6 flex flex-col">
                {data.entries.map((entry: LeaderboardEntry, idx: number) => {
                  const showPromoDivider = idx === 3;

                  let rankBadge = (
                    <span className="w-8 h-8 flex items-center justify-center text-[17px] font-bold text-wolf shrink-0">
                      {entry.rank}
                    </span>
                  );

                  if (entry.rank === 1) {
                    rankBadge = (
                      <span className="w-8 h-8 rounded-full bg-bee text-snow text-sm font-black flex items-center justify-center shrink-0">
                        1
                      </span>
                    );
                  } else if (entry.rank === 2) {
                    rankBadge = (
                      <span className="w-8 h-8 rounded-full bg-swan text-eel text-sm font-black flex items-center justify-center shrink-0">
                        2
                      </span>
                    );
                  } else if (entry.rank === 3) {
                    rankBadge = (
                      <span className="w-8 h-8 rounded-full bg-fox text-snow text-sm font-black flex items-center justify-center shrink-0">
                        3
                      </span>
                    );
                  }

                  const isCurrentUser = entry.is_current_user;
                  const isLast = idx === data.entries.length - 1;

                  return (
                    <React.Fragment key={entry.user_id}>
                      {showPromoDivider && (
                        <div className="relative my-4 flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-dashed border-swan" />
                          </div>
                          <div className="relative bg-snow px-3">
                            <span className="text-[12px] font-black text-hare uppercase tracking-wider">
                              PROMOTION ZONE
                            </span>
                          </div>
                        </div>
                      )}

                      <div
                        className={`flex items-center gap-3.5 py-3.5 px-3 transition-colors ${
                          isCurrentUser
                            ? "bg-iguana border-2 border-humpback rounded-btn my-1"
                            : !isLast && !showPromoDivider
                            ? "border-b-2 border-swan"
                            : !isLast
                            ? "border-b-2 border-swan"
                            : ""
                        }`}
                      >
                        {rankBadge}

                        <Avatar
                          displayName={entry.display_name}
                          color={entry.avatar_color}
                          size={44}
                        />

                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[17px] font-bold text-eel truncate">
                            {entry.display_name}
                          </span>
                          {isCurrentUser && (
                            <span className="bg-macaw text-snow text-[11px] font-black px-2 py-0.5 rounded-pill uppercase tracking-wider shrink-0">
                              YOU
                            </span>
                          )}
                        </div>

                        <span className="text-base font-bold text-wolf shrink-0">
                          {entry.total_xp} XP
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* FOOTER */}
              <p className="text-sm font-bold text-wolf text-center">
                Leaderboard is seeded with sample learners. Friends and real leagues are
                not implemented.
              </p>
            </>
          ) : (
            /* FRIENDS TAB EMPTY STATE CARD */
            <div className="bg-snow border-2 border-swan rounded-card p-8 flex flex-col items-center text-center gap-4">
              <Mascot mood="idle" size={120} />
              <h2 className="text-xl font-black text-eel">Friends leaderboards</h2>
              <p className="text-sm font-bold text-wolf max-w-sm">
                Connect with friends to compare progress
              </p>
              <DuoButton variant="ghost" disabled className="mt-2 opacity-60">
                ADD FRIENDS — COMING SOON
              </DuoButton>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
