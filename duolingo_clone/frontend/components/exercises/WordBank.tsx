"use client";

import React, { useState, useEffect } from "react";
import { SessionExercise } from "@/lib/types";
import { Mascot } from "@/components/ui/Mascot";
import { MicrophoneIcon, SpeakerIcon } from "@/components/ui/Icons";
import { usePreferences } from "@/context/PreferencesContext";
import { speak, isSupported } from "@/lib/speech";
import { Toast } from "@/components/ui/Toast";

interface ExerciseProps {
  exercise: SessionExercise;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

interface BankItem {
  id: number;
  word: string;
  isPlaced: boolean;
}

export function WordBank({ exercise, onChange, disabled }: ExerciseProps) {
  const { soundEnabled } = usePreferences();
  const [bankItems, setBankItems] = useState<BankItem[]>([]);
  const [placedOrder, setPlacedOrder] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Initialize word bank on exercise change
  useEffect(() => {
    const rawBank = exercise.options?.bank || [];
    const items = rawBank.map((word, index) => ({
      id: index,
      word,
      isPlaced: false,
    }));
    setBankItems(items);
    setPlacedOrder([]);

    const textToSpeak = exercise.correct_answer.value || exercise.prompt;
    if (soundEnabled && isSupported()) {
      speak(textToSpeak);
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [exercise.id, soundEnabled]);

  const handleSpeakerClick = () => {
    if (!soundEnabled || !isSupported()) {
      setToastMessage("Audio is not supported or muted in settings.");
      return;
    }
    const textToSpeak = exercise.correct_answer.value || exercise.prompt;
    speak(textToSpeak);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  const handleTileClick = (item: BankItem) => {
    if (disabled) return;

    if (item.isPlaced) {
      // Return to bank
      const newPlaced = placedOrder.filter((id) => id !== item.id);
      setPlacedOrder(newPlaced);
      setBankItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isPlaced: false } : it))
      );

      const assembled = newPlaced
        .map((id) => bankItems.find((b) => b.id === id)?.word || "")
        .filter(Boolean)
        .join(" ");
      onChange(assembled);
    } else {
      // Place into answer area
      const newPlaced = [...placedOrder, item.id];
      setPlacedOrder(newPlaced);
      setBankItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isPlaced: true } : it))
      );

      const assembled = newPlaced
        .map((id) => (id === item.id ? item.word : bankItems.find((b) => b.id === id)?.word || ""))
        .filter(Boolean)
        .join(" ");
      onChange(assembled);
    }
  };

  // Strip prefix "Translate this sentence:" if in prompt
  const displayPrompt = exercise.prompt.replace(/^Translate this sentence:\s*/i, "").trim();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <h2 className="text-xl sm:text-3xl font-extrabold text-eel text-left">
        Translate this sentence
      </h2>

      {/* Mascot + Audio & Mic Stack + Speech bubble */}
      <div className="flex items-center gap-4 my-2">
        <Mascot mood="idle" size={80} />

        {/* Audio & Microphone Stack */}
        <div className="flex flex-col gap-2 items-center shrink-0">
          <button
            type="button"
            onClick={handleSpeakerClick}
            disabled={!soundEnabled || !isSupported()}
            className={`w-10 h-10 rounded-full border-2 border-swan flex items-center justify-center transition-all ${
              isSpeaking
                ? "bg-blueJay text-snow border-blueJay scale-105 animate-pulse"
                : soundEnabled && isSupported()
                ? "bg-snow border-swan text-macaw hover:bg-polar cursor-pointer"
                : "bg-swan border-swan text-hare cursor-not-allowed opacity-60"
            }`}
            title="Listen to Spanish audio"
          >
            <SpeakerIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setToastMessage("Speaking exercises — Coming Soon")}
            className="w-8 h-8 rounded-full bg-swan text-hare flex items-center justify-center cursor-pointer hover:brightness-95 transition-all opacity-80"
            title="Speaking exercises"
          >
            <MicrophoneIcon className="w-4 h-4 text-hare" />
          </button>
        </div>

        <div className="relative bg-snow border-2 border-swan rounded-card px-5 py-4 text-lg font-bold text-eel shadow-sm flex-1">
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-swan" />
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-r-6 border-r-snow" />
          <p>{displayPrompt}</p>
        </div>
      </div>

      {/* Answer Construction Area */}
      <div className="flex flex-col gap-2 min-h-[110px] py-3 border-y-2 border-swan justify-center">
        <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center min-h-[44px]">
          {placedOrder.map((id) => {
            const item = bankItems.find((b) => b.id === id);
            if (!item) return null;
            return (
              <button
                key={`placed-${item.id}`}
                type="button"
                disabled={disabled}
                onClick={() => handleTileClick(item)}
                className="bg-snow border-2 border-swan [box-shadow:0_3px_0_#e5e5e5] rounded-btn px-3 sm:px-4 py-2 text-sm sm:text-base font-extrabold text-eel hover:bg-polar active:translate-y-1 active:[box-shadow:none] transition-all select-none"
              >
                {item.word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Word Bank Grid with Ghosts */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center items-center mt-4">
        {bankItems.map((item) => {
          if (item.isPlaced) {
            return (
              <div
                key={`ghost-${item.id}`}
                className="bg-swan/60 border-2 border-dashed border-swan rounded-btn px-3 sm:px-4 py-2 text-sm sm:text-base font-extrabold text-transparent select-none"
              >
                {item.word}
              </div>
            );
          }

          return (
            <button
              key={`bank-${item.id}`}
              type="button"
              disabled={disabled}
              onClick={() => handleTileClick(item)}
              className="bg-snow border-2 border-swan [box-shadow:0_4px_0_#e5e5e5] rounded-btn px-3 sm:px-4 py-2 text-sm sm:text-base font-extrabold text-eel hover:bg-polar active:translate-y-1 active:[box-shadow:none] transition-all select-none"
            >
              {item.word}
            </button>
          );
        })}
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
