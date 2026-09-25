"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getProfile } from "@/lib/api";
import { UserProfile, UserAchievementDetail } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/ui/Avatar";
import {
  FlameIcon,
  XpBoltIcon,
  CrownIcon,
  BookIcon,
  StarIcon,
  TrophyIcon,
  TargetIcon,
  CameraIcon,
} from "@/components/ui/Icons";

function getAchievementIcon(iconName: string, earned: boolean) {
  const iconClass = earned ? "w-7 h-7 text-snow" : "w-7 h-7 text-hare";
  switch (iconName) {
    case "fire":
      return <FlameIcon className={iconClass} size={28} />;
    case "sparkles":
      return <StarIcon className={iconClass} size={28} />;
    case "graduation_cap":
      return <BookIcon className={iconClass} size={28} />;
    case "crown":
      return <CrownIcon className={iconClass} size={28} />;
    case "trophy":
      return <TrophyIcon className={iconClass} size={28} />;
    case "target":
      return <TargetIcon className={iconClass} size={28} />;
    case "camera":
      return <CameraIcon className={iconClass} size={28} />;
    case "lightning":
      return <XpBoltIcon className={iconClass} size={28} />;
    default:
      return <StarIcon className={iconClass} size={28} />;
  }
}

export default function ProfilePage() {
  const { user, userId, isLoading: userLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    getProfile(userId)
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("Failed to load user profile:", err);
        setError("Failed to load profile. Please try again later.");
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
      ) : error || !profile ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-base font-bold text-eel">{error || "Profile not found."}</p>
        </div>
      ) : (
        <div className="max-w-[600px] w-full mx-auto flex flex-col gap-6 py-6 px-4">
          {/* 1. PROFILE HEADER */}
          <div className="bg-snow border-2 border-swan rounded-card p-6 flex items-center gap-6">
            <Avatar
              displayName={profile.display_name}
              color={profile.avatar_color}
              size={96}
            />
            <div className="flex flex-col">
              <h1 className="text-[28px] font-black text-eel leading-tight">
                {profile.display_name}
              </h1>
              <span className="text-base font-bold text-wolf">
                @{profile.username}
              </span>
              <span className="text-[15px] font-bold text-wolf mt-1">
                Joined{" "}
                {new Date(profile.joined_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* 2. STATISTICS */}
          <div className="flex flex-col">
            <h2 className="text-[22px] font-black text-eel mb-3">Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-snow border-2 border-swan rounded-card p-4 flex items-center gap-3.5">
                <FlameIcon className="w-7 h-7 text-fox shrink-0" size={28} />
                <div className="flex flex-col">
                  <span className="text-[20px] font-black text-eel leading-tight">
                    {profile.current_streak}
                  </span>
                  <span className="text-sm font-bold text-wolf">Day streak</span>
                </div>
              </div>

              <div className="bg-snow border-2 border-swan rounded-card p-4 flex items-center gap-3.5">
                <XpBoltIcon className="w-7 h-7 text-bee shrink-0" size={28} />
                <div className="flex flex-col">
                  <span className="text-[20px] font-black text-eel leading-tight">
                    {profile.total_xp}
                  </span>
                  <span className="text-sm font-bold text-wolf">Total XP</span>
                </div>
              </div>

              <div className="bg-snow border-2 border-swan rounded-card p-4 flex items-center gap-3.5">
                <CrownIcon className="w-7 h-7 text-bee shrink-0" size={28} />
                <div className="flex flex-col">
                  <span className="text-[20px] font-black text-eel leading-tight">
                    {profile.total_crowns}
                  </span>
                  <span className="text-sm font-bold text-wolf">Crowns earned</span>
                </div>
              </div>

              <div className="bg-snow border-2 border-swan rounded-card p-4 flex items-center gap-3.5">
                <BookIcon className="w-7 h-7 text-macaw shrink-0" size={28} />
                <div className="flex flex-col">
                  <span className="text-[20px] font-black text-eel leading-tight">
                    {profile.total_lessons_completed}
                  </span>
                  <span className="text-sm font-bold text-wolf">Lessons completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. STREAK CALENDAR */}
          <div className="flex flex-col">
            <h2 className="text-[22px] font-black text-eel mb-3">Last 7 days</h2>
            <div className="bg-snow border-2 border-swan rounded-card p-5">
              <div className="grid grid-cols-7 gap-2">
                {profile.streak_calendar.map((item, index) => {
                  const dateObj = new Date(
                    item.date.includes("T") ? item.date : `${item.date}T00:00:00`
                  );
                  const weekdayInitial = ["S", "M", "T", "W", "T", "F", "S"][dateObj.getDay()];
                  const isToday = index === profile.streak_calendar.length - 1;

                  return (
                    <div
                      key={item.date}
                      className={`flex flex-col items-center gap-2 p-1 rounded-card ${
                        isToday ? "ring-2 ring-eel" : ""
                      }`}
                    >
                      <span className="text-[13px] font-bold text-wolf">
                        {weekdayInitial}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.goal_met
                            ? "bg-fox text-snow"
                            : "bg-swan text-hare"
                        }`}
                      >
                        {item.goal_met ? (
                          <FlameIcon className="w-5 h-5 text-snow" size={20} />
                        ) : (
                          <span className="text-[13px] font-bold text-hare">
                            {item.xp_earned}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. ACHIEVEMENTS */}
          <div className="flex flex-col">
            <h2 className="text-[22px] font-black text-eel mb-3">Achievements</h2>
            <div className="flex flex-col gap-3">
              {profile.achievements.map((achievement) => {
                const isEarned = achievement.is_earned;
                const progressRatio = Math.min(
                  achievement.progress / achievement.threshold,
                  1
                );

                return (
                  <div
                    key={achievement.code}
                    className={`bg-snow border-2 border-swan rounded-card p-4 flex items-center gap-4 ${
                      !isEarned ? "opacity-60" : ""
                    }`}
                  >
                    {/* Badge Tile */}
                    <div
                      className={`w-14 h-14 rounded-card flex items-center justify-center shrink-0 ${
                        isEarned ? "bg-bee" : "bg-polar"
                      }`}
                    >
                      {getAchievementIcon(achievement.icon_name, isEarned)}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-[17px] font-black text-eel leading-snug truncate">
                        {achievement.title}
                      </span>
                      <span className="text-sm font-bold text-wolf line-clamp-2">
                        {achievement.description}
                      </span>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-3 bg-swan rounded-pill overflow-hidden">
                          <div
                            className="h-full bg-bee progress-fill"
                            style={{
                              width: `${Math.round(progressRatio * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[13px] font-bold text-wolf shrink-0">
                          {achievement.progress}/{achievement.threshold}
                        </span>
                      </div>
                    </div>

                    {/* Right Earned Pill */}
                    {isEarned && (
                      <div className="bg-bee text-snow text-xs font-black px-3 py-1 rounded-pill tracking-wide shrink-0">
                        EARNED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
