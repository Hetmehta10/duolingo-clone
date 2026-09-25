"use client";

import React, { useEffect } from "react";
import { DuoButton } from "@/components/ui/DuoButton";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "gems" | "super";
  bundle?: { amount: number; price: string } | null;
}

export function PaymentModal({
  isOpen,
  onClose,
  mode,
  bundle,
}: PaymentModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title =
    mode === "super"
      ? "Super Duolingo — 2 weeks free, then $12.99/month"
      : `Purchase ${bundle?.amount ?? 0} Gems`;

  const itemLabel =
    mode === "super"
      ? "Super Duolingo (14-Day Free Trial)"
      : `${bundle?.amount ?? 0} Gem Cluster`;

  const itemPrice = mode === "super" ? "$0.00" : bundle?.price ?? "$0.00";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-eel/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-snow rounded-[16px] p-6 flex flex-col gap-5 shadow-2xl animate-pop relative border-2 border-swan"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Warning Strip */}
        <div className="bg-bee/15 border border-bee/40 text-eel rounded-[12px] p-3 text-[14px] font-bold text-center">
          Demo only — no real payment is processed.
        </div>

        {/* Heading */}
        <h3 className="text-xl font-black text-eel leading-snug">{title}</h3>

        {/* Order Summary Row */}
        <div className="flex justify-between items-center text-base font-extrabold text-eel py-3 border-y-2 border-swan">
          <span className="truncate max-w-[240px]">{itemLabel}</span>
          <span className="text-feather">{itemPrice}</span>
        </div>

        {/* Purely Visual Disabled Card Form */}
        <div className="flex flex-col gap-3 opacity-70 pointer-events-none">
          <div className="flex flex-col gap-1 text-xs font-extrabold text-wolf uppercase">
            <span>Cardholder Name</span>
            <input
              disabled
              value="DEMO USER"
              className="bg-polar border-2 border-swan text-hare rounded-[12px] p-3 font-bold text-sm w-full outline-none"
            />
          </div>

          <div className="flex flex-col gap-1 text-xs font-extrabold text-wolf uppercase">
            <span>Card Number</span>
            <input
              disabled
              value="4242 4242 4242 4242"
              className="bg-polar border-2 border-swan text-hare rounded-[12px] p-3 font-bold text-sm w-full outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 text-xs font-extrabold text-wolf uppercase">
              <span>Expires</span>
              <input
                disabled
                value="12/29"
                className="bg-polar border-2 border-swan text-hare rounded-[12px] p-3 font-bold text-sm w-full outline-none"
              />
            </div>
            <div className="flex flex-col gap-1 text-xs font-extrabold text-wolf uppercase">
              <span>CVC</span>
              <input
                disabled
                value="123"
                className="bg-polar border-2 border-swan text-hare rounded-[12px] p-3 font-bold text-sm w-full outline-none"
              />
            </div>
          </div>
        </div>

        {/* Greyed Payment Tiles */}
        <div className="grid grid-cols-4 gap-2 opacity-50 cursor-not-allowed pointer-events-none my-1">
          {["Card", "PayPal", "GPay", "Apple"].map((method) => (
            <div
              key={method}
              className="bg-polar border-2 border-swan rounded-btn p-2 text-center text-xs font-extrabold text-hare"
            >
              {method}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <DuoButton variant="disabled" size="lg" fullWidth disabled>
            COMPLETE PURCHASE — COMING SOON
          </DuoButton>

          <DuoButton variant="ghost" size="md" fullWidth onClick={onClose}>
            CANCEL
          </DuoButton>
        </div>
      </div>
    </div>
  );
}
