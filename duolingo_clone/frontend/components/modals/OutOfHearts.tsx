import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/ui/Mascot";
import { DuoButton } from "@/components/ui/DuoButton";
import { GemIcon } from "@/components/ui/Icons";

interface OutOfHeartsProps {
  isOpen: boolean;
  userGems: number;
  secondsUntilNext: number | null;
  onRefill: () => Promise<void>;
  onAbandon: () => void;
}

export function OutOfHearts({
  isOpen,
  userGems,
  secondsUntilNext,
  onRefill,
  onAbandon,
}: OutOfHeartsProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState<number>(secondsUntilNext || 240 * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const canAfford = userGems >= 350;

  useEffect(() => {
    if (secondsUntilNext !== null && secondsUntilNext > 0) {
      setCountdown(secondsUntilNext);
    }
  }, [secondsUntilNext]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const handleRefillClick = async () => {
    if (!canAfford || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onRefill();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-snow rounded-card border-2 border-swan p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-pop">
        <Mascot mood="sad" size={110} />

        <h3 className="text-2xl font-extrabold text-cardinal mt-4">
          You ran out of hearts!
        </h3>
        <p className="text-sm font-semibold text-wolf mt-2">
          Hearts refill automatically over time so you can practice again.
        </p>

        {/* Live Timer Card */}
        <div className="bg-polar border-2 border-swan rounded-card px-6 py-3 my-5 flex flex-col items-center">
          <span className="text-xs uppercase font-extrabold tracking-wider text-wolf">
            Next heart in
          </span>
          <span className="text-2xl font-extrabold text-eel tracking-wider">
            {timeFormatted}
          </span>
        </div>

        {/* Refill Button */}
        <div className="flex flex-col gap-3 w-full">
          <DuoButton
            variant={canAfford ? "primary" : "disabled"}
            size="md"
            fullWidth
            disabled={!canAfford || isSubmitting}
            onClick={handleRefillClick}
            className="flex items-center justify-center gap-2"
          >
            <span>REFILL FOR 350</span>
            <GemIcon className="w-5 h-5 text-snow inline" />
          </DuoButton>

          {!canAfford && (
            <>
              <p className="text-xs font-bold text-cardinal">
                Need 350 gems (you have {userGems})
              </p>

              <DuoButton
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => {
                  onAbandon();
                  router.push("/shop");
                }}
              >
                GET MORE GEMS
              </DuoButton>
            </>
          )}

          <DuoButton variant="ghost" size="md" fullWidth onClick={onAbandon}>
            NO THANKS
          </DuoButton>
        </div>
      </div>
    </div>
  );
}
