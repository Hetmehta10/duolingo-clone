"use client";

import React, { useRef, useEffect, useState } from "react";
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
  onEnter?: () => void;
}

export function TypeAnswer({ exercise, value, onChange, disabled, onEnter }: ExerciseProps) {
  const { soundEnabled } = usePreferences();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const displayPrompt = exercise.prompt.replace(/^Write this in Spanish:\s*/i, "").trim();

  // Focus textarea & auto-play on exercise change
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }

    if (soundEnabled && isSupported()) {
      speak(displayPrompt);
      setIsSpeaking(true);
      const timer = setTimeout(() => setIsSpeaking(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [exercise.id, disabled, soundEnabled, displayPrompt]);

  const handleSpeakerClick = () => {
    if (!soundEnabled || !isSupported()) {
      setToastMessage("Audio is not supported or muted in settings.");
      return;
    }
    speak(displayPrompt);
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && onEnter) {
        onEnter();
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-xl sm:text-3xl font-extrabold text-eel text-left">
        Write this in Spanish
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

      {exercise.hint && (
        <p className="text-sm font-semibold text-wolf">{exercise.hint}</p>
      )}

      {/* Text Area Input */}
      <div className="w-full mt-2">
        <textarea
          ref={inputRef}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type in Spanish"
          rows={3}
          className="w-full min-h-[120px] p-4 bg-polar border-2 border-swan rounded-card text-lg font-bold text-eel placeholder:text-hare placeholder:font-semibold outline-none focus:border-humpback focus:bg-snow focus:ring-2 focus:ring-humpback/50 resize-none transition-all disabled:opacity-60"
        />
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
