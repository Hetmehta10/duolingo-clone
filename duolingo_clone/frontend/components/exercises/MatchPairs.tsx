import React, { useState, useEffect } from "react";
import { SessionExercise } from "@/lib/types";

interface ExerciseProps {
  exercise: SessionExercise;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

interface MatchItem {
  id: string;
  text: string;
  pairKey: string;
  isLeft: boolean;
}

export function MatchPairs({ exercise, onChange, disabled }: ExerciseProps) {
  const [leftItems, setLeftItems] = useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = useState<MatchItem[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<MatchItem | null>(null);
  const [selectedRight, setSelectedRight] = useState<MatchItem | null>(null);

  const [matchedKeys, setMatchedKeys] = useState<Set<string>>(new Set());
  const [mismatchIds, setMismatchIds] = useState<Set<string>>(new Set());
  const [mismatchCount, setMismatchCount] = useState<number>(0);

  // Initialize pairs and shuffle independently
  useEffect(() => {
    const rawPairs = exercise.options?.pairs || [];
    const lefts: MatchItem[] = [];
    const rights: MatchItem[] = [];

    rawPairs.forEach(([spanish, english], idx) => {
      const pairKey = `pair-${idx}`;
      lefts.push({ id: `left-${idx}`, text: spanish, pairKey, isLeft: true });
      rights.push({ id: `right-${idx}`, text: english, pairKey, isLeft: false });
    });

    // Shuffle independently
    setLeftItems([...lefts].sort(() => Math.random() - 0.5));
    setRightItems([...rights].sort(() => Math.random() - 0.5));
    setMatchedKeys(new Set());
    setMismatchIds(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setMismatchCount(0);
    onChange("");
  }, [exercise, onChange]);

  const checkPair = (left: MatchItem, right: MatchItem) => {
    if (left.pairKey === right.pairKey) {
      // Correct Match
      const nextMatched = new Set(matchedKeys);
      nextMatched.add(left.pairKey);
      setMatchedKeys(nextMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      const totalPairs = (exercise.options?.pairs || []).length;
      if (nextMatched.size === totalPairs) {
        // All matched!
        if (mismatchCount === 0) {
          onChange("all_matched");
        } else {
          onChange(""); // will be graded as incorrect
        }
      }
    } else {
      // Wrong Match
      setMismatchCount((c) => {
        const next = c + 1;
        return next;
      });
      setMismatchIds(new Set([left.id, right.id]));

      setTimeout(() => {
        setMismatchIds(new Set());
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 500);
    }
  };

  const handleSelect = (item: MatchItem) => {
    if (disabled || matchedKeys.has(item.pairKey) || mismatchIds.size > 0) return;

    if (item.isLeft) {
      if (selectedLeft?.id === item.id) {
        setSelectedLeft(null);
      } else {
        setSelectedLeft(item);
        if (selectedRight) {
          checkPair(item, selectedRight);
        }
      }
    } else {
      if (selectedRight?.id === item.id) {
        setSelectedRight(null);
      } else {
        setSelectedRight(item);
        if (selectedLeft) {
          checkPair(selectedLeft, item);
        }
      }
    }
  };

  const getItemStyle = (item: MatchItem) => {
    const isMatched = matchedKeys.has(item.pairKey);
    const isSelected = selectedLeft?.id === item.id || selectedRight?.id === item.id;
    const isMismatch = mismatchIds.has(item.id);

    if (isMatched) {
      return "bg-seaSponge/30 border-treefrog/30 text-treefrog/40 opacity-30 cursor-not-allowed [box-shadow:none]";
    }
    if (isMismatch) {
      return "bg-walkingFish border-fireAnt text-fireAnt animate-shake [box-shadow:0_4px_0_#ea2b2b]";
    }
    if (isSelected) {
      return "bg-iguana border-humpback text-macaw [box-shadow:0_4px_0_#84d8ff]";
    }
    return "bg-snow border-swan text-eel [box-shadow:0_4px_0_#e5e5e5] hover:bg-polar cursor-pointer active:translate-y-1 active:[box-shadow:none]";
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-eel text-left">
        Tap the matching pairs
      </h2>

      {exercise.hint && (
        <p className="text-sm font-semibold text-wolf">{exercise.hint}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
        {/* Left Column (Spanish) */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {leftItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled || matchedKeys.has(item.pairKey)}
              onClick={() => handleSelect(item)}
              className={`p-3 sm:p-4 min-h-[56px] sm:min-h-[64px] rounded-card border-2 flex items-center justify-center font-extrabold text-sm sm:text-base select-none transition-all text-center ${getItemStyle(
                item
              )}`}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Right Column (English) */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {rightItems.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={disabled || matchedKeys.has(item.pairKey)}
              onClick={() => handleSelect(item)}
              className={`p-3 sm:p-4 min-h-[56px] sm:min-h-[64px] rounded-card border-2 flex items-center justify-center font-extrabold text-sm sm:text-base select-none transition-all text-center ${getItemStyle(
                item
              )}`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
