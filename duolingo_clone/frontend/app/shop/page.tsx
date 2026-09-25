"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import { refillHearts } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Mascot } from "@/components/ui/Mascot";
import { DuoButton } from "@/components/ui/DuoButton";
import { FlameIcon, GemIcon, HeartIcon, TargetIcon, XpBoltIcon } from "@/components/ui/Icons";
import { PaymentModal } from "@/components/modals/PaymentModal";
import { Toast } from "@/components/ui/Toast";

interface GemBundle {
  amount: number;
  price: string;
}

const GEM_BUNDLES: GemBundle[] = [
  { amount: 500, price: "$4.99" },
  { amount: 1200, price: "$9.99" },
  { amount: 3000, price: "$19.99" },
  { amount: 6500, price: "$39.99" },
];

export default function ShopPage() {
  const { user, userId, refreshUser } = useUser();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refilling, setRefilling] = useState<boolean>(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<"gems" | "super">("super");
  const [selectedBundle, setSelectedBundle] = useState<GemBundle | null>(null);

  const openSuperModal = () => {
    setPaymentMode("super");
    setSelectedBundle(null);
    setPaymentModalOpen(true);
  };

  const openGemsModal = (bundle: GemBundle) => {
    setPaymentMode("gems");
    setSelectedBundle(bundle);
    setPaymentModalOpen(true);
  };

  const handleHeartRefill = async () => {
    if (!userId || refilling) return;
    const gems = user?.gems ?? 0;
    const hearts = user?.hearts ?? 5;

    if (hearts >= 5 || gems < 350) return;

    try {
      setRefilling(true);
      await refillHearts(userId);
      await refreshUser();
      setToastMessage("Hearts refilled!");
    } catch (err) {
      console.error("Failed to refill hearts:", err);
    } finally {
      setRefilling(false);
    }
  };

  const currentHearts = user?.hearts ?? 5;
  const currentGems = user?.gems ?? 0;

  return (
    <AppShell>
      <div className="max-w-[600px] w-full mx-auto flex flex-col gap-8 py-6 px-4 select-none">
        {/* 1. SUPER BANNER */}
        <div className="relative rounded-[16px] border-2 border-beetle bg-gradient-to-r from-beetle to-macaw p-[28px] text-snow overflow-hidden shadow-md">
          <div className="max-w-[340px] flex flex-col">
            <h1 className="text-[26px] font-black text-snow leading-tight">
              Try Super Duolingo
            </h1>
            <p className="text-[16px] font-bold text-snow/90 mt-2 mb-6">
              Unlimited hearts, no ads, and personalised practice
            </p>
            <div>
              <button
                type="button"
                onClick={openSuperModal}
                className="py-3 px-6 rounded-btn bg-snow text-beetle font-black text-sm uppercase tracking-wider transition-all shadow-sm hover:brightness-105 active:translate-y-0.5 cursor-pointer"
              >
                TRY 2 WEEKS FREE
              </button>
            </div>
          </div>

          <div className="absolute -right-3 -bottom-3 pointer-events-none hidden sm:block">
            <Mascot mood="cheer" size={120} />
          </div>
        </div>

        {/* 2. POWER-UPS */}
        <div className="flex flex-col">
          <h2 className="text-[22px] font-black text-eel mb-4">Power-Ups</h2>
          <div className="flex flex-col gap-4">
            {/* Heart Refill */}
            <div className="bg-snow border-2 border-swan rounded-[16px] p-[20px] flex items-center justify-between gap-4 shadow-xs">
              <div className="w-[56px] h-[56px] rounded-card bg-cardinal/15 flex items-center justify-center shrink-0">
                <HeartIcon className="w-8 h-8 text-cardinal" size={32} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-[17px] font-black text-eel leading-snug">
                  Heart Refill
                </span>
                <span className="text-xs font-bold text-wolf line-clamp-2">
                  Get full hearts so you can worry less about mistakes
                </span>
              </div>
              <div className="shrink-0">
                {currentHearts >= 5 ? (
                  <DuoButton variant="disabled" size="sm" disabled>
                    FULL
                  </DuoButton>
                ) : currentGems < 350 ? (
                  <DuoButton variant="disabled" size="sm" disabled>
                    NOT ENOUGH GEMS
                  </DuoButton>
                ) : (
                  <DuoButton
                    variant="primary"
                    size="sm"
                    disabled={refilling}
                    onClick={handleHeartRefill}
                    className="flex items-center gap-1.5"
                  >
                    <span>350</span>
                    <GemIcon className="w-4 h-4 text-snow" size={16} />
                  </DuoButton>
                )}
              </div>
            </div>

            {/* Streak Freeze */}
            <div className="bg-snow border-2 border-swan rounded-[16px] p-[20px] flex items-center justify-between gap-4 shadow-xs opacity-70 cursor-not-allowed">
              <div className="w-[56px] h-[56px] rounded-card bg-fox/15 flex items-center justify-center shrink-0">
                <FlameIcon className="w-8 h-8 text-fox" size={32} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-[17px] font-black text-eel leading-snug">
                  Streak Freeze
                </span>
                <span className="text-xs font-bold text-wolf line-clamp-2">
                  Protect your streak for 1 day of inactivity
                </span>
              </div>
              <div className="shrink-0">
                <DuoButton variant="disabled" size="sm" disabled>
                  COMING SOON
                </DuoButton>
              </div>
            </div>

            {/* Double or Nothing */}
            <div className="bg-snow border-2 border-swan rounded-[16px] p-[20px] flex items-center justify-between gap-4 shadow-xs opacity-70 cursor-not-allowed">
              <div className="w-[56px] h-[56px] rounded-card bg-bee/15 flex items-center justify-center shrink-0">
                <GemIcon className="w-8 h-8 text-bee" size={32} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-[17px] font-black text-eel leading-snug">
                  Double or Nothing
                </span>
                <span className="text-xs font-bold text-wolf line-clamp-2">
                  Double your 50 gem wager by maintaining a 7-day streak
                </span>
              </div>
              <div className="shrink-0">
                <DuoButton variant="disabled" size="sm" disabled>
                  COMING SOON
                </DuoButton>
              </div>
            </div>

            {/* Timer Boost */}
            <div className="bg-snow border-2 border-swan rounded-[16px] p-[20px] flex items-center justify-between gap-4 shadow-xs opacity-70 cursor-not-allowed">
              <div className="w-[56px] h-[56px] rounded-card bg-macaw/15 flex items-center justify-center shrink-0">
                <XpBoltIcon className="w-8 h-8 text-macaw" size={32} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-[17px] font-black text-eel leading-snug">
                  Timer Boost
                </span>
                <span className="text-xs font-bold text-wolf line-clamp-2">
                  Add extra time to timed challenge lessons
                </span>
              </div>
              <div className="shrink-0">
                <DuoButton variant="disabled" size="sm" disabled>
                  COMING SOON
                </DuoButton>
              </div>
            </div>
          </div>
        </div>

        {/* 3. GEM BUNDLES */}
        <div className="flex flex-col">
          <h2 className="text-[22px] font-black text-eel mb-4">Get Gems</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GEM_BUNDLES.map((bundle) => (
              <div
                key={bundle.amount}
                className="bg-snow border-2 border-swan rounded-[16px] p-5 flex flex-col items-center text-center gap-3 shadow-xs"
              >
                <div className="w-16 h-16 rounded-full bg-beetle/15 flex items-center justify-center">
                  <GemIcon className="w-10 h-10 text-beetle" size={40} />
                </div>

                <span className="text-[20px] font-black text-eel">
                  {bundle.amount} Gems
                </span>

                <DuoButton
                  variant="info"
                  size="md"
                  fullWidth
                  onClick={() => openGemsModal(bundle)}
                >
                  {bundle.price}
                </DuoButton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        mode={paymentMode}
        bundle={selectedBundle}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </AppShell>
  );
}
