"use client";

import React from "react";
import { PricingSection } from "@/components/marketing/pricing-section";

export default function PricingPage() {
  return (
    <div className="bg-background min-h-screen overflow-hidden px-4 pt-10 pb-20 sm:px-6 lg:px-8">
      <PricingSection />

      {/* Payment Systems Placeholder */}
      <div className="border-border/50 relative z-10 mx-auto mt-20 max-w-7xl border-t px-6 pt-10">
        <p className="text-foreground-secondary mb-6 text-center text-sm font-medium">
          Quyidagi to&apos;lov tizimlari orqali ishonchli va xavfsiz to&apos;lang
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 md:gap-16">
          <div className="text-foreground flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500 text-white">
              C
            </div>
            Click
          </div>
          <div className="text-foreground flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-teal-500 text-white">
              P
            </div>
            Payme
          </div>
          <div className="text-foreground flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-600 text-white">
              U
            </div>
            Uzum Bank
          </div>
          <div className="text-foreground flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-500 text-white">
              S
            </div>
            Stripe
          </div>
        </div>
      </div>
    </div>
  );
}
