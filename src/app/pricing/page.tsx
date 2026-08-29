"use client";

import React from "react";
import { PricingSection } from "@/components/marketing/pricing-section";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background pt-10 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <PricingSection />
      
      {/* Payment Systems Placeholder */}
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-border/50 relative z-10 px-6">
        <p className="text-center text-sm font-medium text-foreground-secondary mb-6">
          Quyidagi to'lov tizimlari orqali ishonchli va xavfsiz to'lang
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white">C</div>
            Click
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <div className="w-8 h-8 rounded bg-teal-500 flex items-center justify-center text-white">P</div>
            Payme
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-white">U</div>
            Uzum Bank
          </div>
          <div className="flex items-center gap-2 font-bold text-xl text-foreground">
            <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center text-white">S</div>
            Stripe
          </div>
        </div>
      </div>
    </div>
  );
}
