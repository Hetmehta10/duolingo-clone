import React from "react";
import { CompleteSessionResponse } from "@/lib/types";
import { Mascot } from "@/components/ui/Mascot";
import { DuoButton } from "@/components/ui/DuoButton";
import { CrownIcon, FlameIcon, StarIcon, XpBoltIcon } from "@/components/ui/Icons";

interface LessonCompleteProps {
  result: CompleteSessionResponse;
  onContinue: () => void;
}

export function LessonComplete({ result, onContinue }: LessonCompleteProps) {
  const isFailure = result.status === "failed";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-snow p-6 sm:p-10 animate-pop overflow-y-auto">
      {/* Top / Mascot Section */}
      <div className="flex flex-col items-center justify-center flex-1 max-w-md w-full text-center my-auto">
        <Mascot mood={isFailure ? "sad" : "cheer"} size={140} />

        <h1
          className={`text-3xl sm:text-4xl font-extrabold mt-6 ${
            isFailure ? "text-cardinal" : "text-feather"
          }`}
        >
          {isFailure ? "Lesson Failed" : result.is_practice ? "Practice Complete!" : "Lesson Complete!"}
        </h1>

        <p className="text-base font-bold text-wolf mt-2">
          {isFailure
            ? "You ran out of hearts. Practice again to earn XP!"
            : result.is_practice
            ? "Practice complete! 5 XP awarded."
            : result.perfect
            ? "Flawless session! Bonus XP awarded!"
            : "Great practice! Keep up the momentum!"}
        </p>

        {/* Leveled Up & Completed Highlights */}
        {result.leveled_up && !isFailure && (
          <div className="flex items-center gap-2 bg-polar border-2 border-bee rounded-pill px-5 py-2 mt-4 text-bee font-extrabold text-sm animate-pop">
            <CrownIcon className="w-5 h-5 text-bee" />
            <span>Crown Level {result.crown_level} Reached!</span>
          </div>
        )}

        {result.skill_completed && !isFailure && (
          <div className="flex items-center gap-2 bg-seaSponge border-2 border-treefrog rounded-pill px-5 py-2 mt-2 text-treefrog font-extrabold text-sm animate-pop">
            <CrownIcon className="w-5 h-5 text-treefrog" />
            <span>Skill Mastered!</span>
          </div>
        )}

        {/* 3 Stat Cards Row */}
        <div className="grid grid-cols-3 gap-3 w-full mt-8">
          {/* TOTAL XP */}
          <div className="bg-snow border-2 border-bee rounded-card overflow-hidden flex flex-col text-center shadow-xs">
            <div className="bg-bee text-snow text-[11px] font-extrabold uppercase py-1 tracking-wider">
              Total XP
            </div>
            <div className="flex items-center justify-center gap-1 py-3 text-bee">
              <XpBoltIcon className="w-6 h-6" />
              <span className="text-2xl font-black text-eel">{result.xp_awarded}</span>
            </div>
          </div>

          {/* COMMITTED (Streak) */}
          <div className="bg-snow border-2 border-fox rounded-card overflow-hidden flex flex-col text-center shadow-xs">
            <div className="bg-fox text-snow text-[11px] font-extrabold uppercase py-1 tracking-wider">
              Committed
            </div>
            <div className="flex items-center justify-center gap-1 py-3 text-fox">
              <FlameIcon className="w-6 h-6" />
              <span className="text-2xl font-black text-eel">{result.current_streak}</span>
            </div>
          </div>

          {/* GREAT (Accuracy) */}
          <div className="bg-snow border-2 border-macaw rounded-card overflow-hidden flex flex-col text-center shadow-xs">
            <div className="bg-macaw text-snow text-[11px] font-extrabold uppercase py-1 tracking-wider">
              Accuracy
            </div>
            <div className="flex items-center justify-center gap-1 py-3 text-macaw">
              <StarIcon className="w-6 h-6" />
              <span className="text-2xl font-black text-eel">{result.accuracy_pct}%</span>
            </div>
          </div>
        </div>

        {/* Newly Unlocked Achievements */}
        {result.new_achievements && result.new_achievements.length > 0 && (
          <div className="w-full mt-6 flex flex-col gap-2">
            <span className="text-xs uppercase font-extrabold text-wolf tracking-wider">
              New Achievement Unlocked!
            </span>
            {result.new_achievements.map((ach) => (
              <div
                key={ach.code}
                className="flex items-center gap-3 bg-polar border-2 border-swan rounded-card p-3 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-bee/20 flex items-center justify-center text-bee">
                  <StarIcon className="w-6 h-6" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-eel">{ach.title}</span>
                  <span className="text-xs font-semibold text-wolf">{ach.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed-Bottom Continue Action */}
      <div className="w-full max-w-md pt-4 border-t-2 border-swan mt-6">
        <DuoButton variant="primary" size="lg" fullWidth onClick={onContinue}>
          CONTINUE
        </DuoButton>
      </div>
    </div>
  );
}
