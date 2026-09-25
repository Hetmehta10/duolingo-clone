"use client";

import React, { useEffect, useState } from "react";
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

export function MultipleChoice({ exercise, value, onChange, disabled }: ExerciseProps) {
  const { soundEnabled } = usePreferences();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const choices = exercise.options?.choices || [];
  const textToSpeak = exercise.prompt;

  useEffect(() => {
    if (soundEnabled && isSupported()) {
      speak(textToSpeak);
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [exercise.id, soundEnabled, textToSpeak]);

  const handleSpeakerClick = () => {
    if (!soundEnabled || !isSupported()) {
      setToastMessage("Audio is not supported or muted in settings.");
      return;
    }
    speak(textToSpeak);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Title */}
      <h2 className="text-xl sm:text-3xl font-extrabold text-eel text-left">
        {exercise.prompt}
      </h2>

      {/* Mascot & Speech bubble with Audio + Mic Stack */}
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

        {exercise.hint && (
          <div className="relative bg-snow border-2 border-swan rounded-card px-4 py-3 text-sm text-wolf font-semibold shadow-sm flex-1">
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-swan" />
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-6 border-y-transparent border-r-6 border-r-snow" />
            <p>{exercise.hint}</p>
          </div>
        )}
      </div>

      {/* Options Grid (1 col on mobile, 2 col on sm+) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {choices.map((choice, index) => {
          const isSelected = value === choice;

          return (
            <button
              key={`${choice}-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(choice)}
              className={`relative flex flex-col items-center justify-center p-4 min-h-[110px] sm:min-h-[130px] rounded-card border-2 transition-all select-none text-center font-bold text-lg ${
                isSelected
                  ? "bg-iguana dark:bg-macaw/20 border-humpback text-macaw [box-shadow:0_4px_0_#84d8ff]"
                  : "bg-snow border-swan text-eel [box-shadow:0_4px_0_#e5e5e5] hover:bg-polar"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:translate-y-1 active:[box-shadow:0_0px_0_transparent]"}`}
            >
              <span
                className={`absolute top-2.5 left-2.5 w-6 h-6 rounded-md border text-xs font-extrabold flex items-center justify-center ${
                  isSelected
                    ? "border-humpback text-macaw bg-snow"
                    : "border-swan text-hare bg-polar"
                }`}
              >
                {index + 1}
              </span>
              <span className="mt-2 text-xl font-extrabold">{choice}</span>
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
