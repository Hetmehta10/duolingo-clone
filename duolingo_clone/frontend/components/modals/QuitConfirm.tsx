import React, { useEffect } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { DuoButton } from "@/components/ui/DuoButton";

interface QuitConfirmProps {
  isOpen: boolean;
  onQuit: () => void;
  onStay: () => void;
}

export function QuitConfirm({ isOpen, onQuit, onStay }: QuitConfirmProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onStay();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-snow rounded-card border-2 border-swan p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-pop">
        <Mascot mood="sad" size={100} />

        <h3 className="text-2xl font-extrabold text-eel mt-4">
          Are you sure you want to quit?
        </h3>
        <p className="text-sm font-semibold text-wolf mt-2 mb-6">
          All progress in this session will be lost.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <DuoButton variant="danger" size="md" fullWidth onClick={onQuit}>
            END SESSION
          </DuoButton>
          <DuoButton variant="ghost" size="md" fullWidth onClick={onStay}>
            STAY
          </DuoButton>
        </div>
      </div>
    </div>
  );
}
