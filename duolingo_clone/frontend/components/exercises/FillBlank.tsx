import React from "react";
import { SessionExercise } from "@/lib/types";

interface ExerciseProps {
  exercise: SessionExercise;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export function FillBlank({ exercise, value, onChange, disabled }: ExerciseProps) {
  const choices = exercise.options?.choices || [];
  const parts = exercise.prompt.split("___");

  return (
    <div className="flex flex-col gap-8 w-full">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-eel text-left">
        Fill in the blank
      </h2>

      {/* Sentence with Blank Gap */}
      <div className="bg-polar border-2 border-swan rounded-card p-6 min-h-[100px] flex flex-wrap items-center justify-center gap-2 text-xl font-extrabold text-eel">
        {parts.map((part, index) => (
          <React.Fragment key={`part-${index}`}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <span
                className={`inline-flex items-center justify-center min-w-[100px] px-3 py-1 border-b-4 font-extrabold transition-all ${
                  value
                    ? "border-macaw text-macaw bg-iguana rounded-md"
                    : "border-hare text-hare"
                }`}
              >
                {value || "      "}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {exercise.hint && (
        <p className="text-sm font-semibold text-wolf text-center">{exercise.hint}</p>
      )}

      {/* Choice Chips */}
      <div className="flex flex-wrap gap-4 justify-center items-center mt-2">
        {choices.map((choice, index) => {
          const isSelected = value === choice;

          return (
            <button
              key={`${choice}-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(choice)}
              className={`px-6 py-3 rounded-pill border-2 font-extrabold text-lg select-none transition-all ${
                isSelected
                  ? "bg-iguana border-humpback text-macaw [box-shadow:0_4px_0_#84d8ff]"
                  : "bg-snow border-swan text-eel [box-shadow:0_4px_0_#e5e5e5] hover:bg-polar"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer active:translate-y-1 active:[box-shadow:none]"}`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
