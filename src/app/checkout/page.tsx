"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CreditCard, ShieldCheck, CheckCircle, Loader2, Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/components/providers/language-provider";

function CheckoutContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const _router = useRouter();
  const { status } = useSession();

  const plan = searchParams?.get("plan") === "premium" ? "premium" : "pro";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState<"click" | "payme" | "payx">("click");
  const [isProcessing, setIsProcessing] = useState(false);

  // If not logged in, redirect to login
  if (status === "unauthenticated") {
    _router.push(`/login?callbackUrl=/checkout?plan=${plan}`);
    return null;
  }

  const isPremium = plan === "premium";
  const planName = isPremium ? t.premiumPlan : t.proPlan;
  const planPrice = isPremium ? t.pricePremium : t.pricePro;
  const planDesc = isPremium ? t.premiumPlanDesc : t.proPlanDesc;

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const cleanCard = cardNumber.replace(/\s+/g, "");
      const detectedCardType = cleanCard.startsWith("9860") ? "humo" : "uzcard";
      const endpoint = provider === "payx" ? "/api/checkout/payx" : "/api/payments/checkout";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: provider === "payx" ? plan : plan.toUpperCase(),
          provider,
          cardType: detectedCardType,
          phoneNumber,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate payment url");
      }

      const data = await res.json();
      const targetUrl = data.pay_url || data.paymentUrl || data.url;

      if (targetUrl) {
        window.location.href = targetUrl;
      } else {
        throw new Error("No payment url returned");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "To'lov tizimi bilan bog'lanishda xatolik yuz berdi";
      console.error(err);
      setIsProcessing(false);
      alert(`Xatolik: ${errorMsg}`);
    }
  };

  return (
    <div className="text-foreground relative min-h-screen overflow-hidden bg-transparent">
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-24">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.checkoutTitle}</h1>
          <p className="text-foreground-secondary mt-4 max-w-2xl">{t.checkoutDesc}</p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-24">
          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <CreditCard className="text-primary h-5 w-5" />
              {t.paymentMethod}
            </h2>

            <form
              onSubmit={handlePayment}
              className="bg-surface-elevated/50 border-border space-y-6 rounded-3xl border p-6 shadow-lg backdrop-blur-xl sm:p-8"
            >
              <div className="grid grid-cols-3 gap-2">
                {(["click", "payme", "payx"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`cursor-pointer rounded-xl border py-2.5 text-xs font-bold uppercase transition-all ${
                      provider === p
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-surface text-foreground hover:border-primary/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-foreground-secondary mb-2 block text-sm font-semibold">
                    Telefon raqami (Click / SMS tasdiqlash)
                  </label>
                  <input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-surface border-border text-foreground placeholder-foreground-secondary/50 focus:border-primary focus:ring-primary w-full rounded-xl border px-4 py-3.5 transition-all focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-foreground-secondary mb-2 block text-sm font-semibold">
                    {t.cardNumber}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="8600 / 9860 **** **** ****"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="bg-surface border-border text-foreground placeholder-foreground-secondary/50 focus:border-primary focus:ring-primary w-full rounded-xl border px-4 py-3.5 pl-12 transition-all focus:ring-1 focus:outline-none"
                    />
                    <CreditCard className="text-foreground-secondary absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="text-foreground-secondary mb-2 block text-sm font-semibold">
                    {t.cardHolder}
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-surface border-border text-foreground placeholder-foreground-secondary/50 focus:border-primary focus:ring-primary w-full rounded-xl border px-4 py-3.5 transition-all focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-foreground-secondary mb-2 block text-sm font-semibold">
                    {t.expiryDate}
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, "");
                      if (val.length > 2) val = val.substring(0, 2) + "/" + val.substring(2, 4);
                      setExpiry(val);
                    }}
                    className="bg-surface border-border text-foreground placeholder-foreground-secondary/50 focus:border-primary focus:ring-primary w-full rounded-xl border px-4 py-3.5 transition-all focus:ring-1 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="group bg-primary text-primary-foreground relative mt-8 w-full overflow-hidden rounded-xl p-px font-bold shadow-lg transition-all hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="bg-primary relative flex items-center justify-center gap-2 rounded-xl px-6 py-4">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      {t.payNow} — {planPrice}
                    </>
                  )}
                </div>
              </button>
              <p className="text-foreground-secondary mt-4 flex items-center justify-center gap-1.5 text-center text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                Payments are secure and encrypted
              </p>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div
              className={`relative overflow-hidden rounded-3xl border p-8 shadow-lg ${isPremium ? "bg-surface-elevated/40 border-violet-500/30" : "bg-surface-elevated/40 border-primary/30"}`}
            >
              <div
                className={`pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${isPremium ? "bg-violet-500/10" : "bg-primary/10"}`}
              />

              <h2 className="text-foreground relative z-10 mb-6 text-xl font-bold">
                {t.orderSummary}
              </h2>

              <div className="border-border relative z-10 mb-6 border-b pb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-foreground-secondary text-lg font-medium">{planName}</span>
                  <span className="text-foreground text-3xl font-black">{planPrice}</span>
                </div>
                <p className="text-foreground-secondary text-sm">{planDesc}</p>
              </div>

              <ul className="relative z-10 space-y-4">
                {[
                  t.featAiWritingTitle,
                  t.featAtsTitle,
                  t.featExportTitle,
                  t.featPreviewTitle,
                  t.featTemplatesTitle,
                  t.featVersionsTitle,
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle
                      className={`h-5 w-5 shrink-0 ${isPremium ? "text-violet-500" : "text-primary"}`}
                    />
                    <span className="text-foreground text-sm font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
      <CheckoutContent />
    </Suspense>
  );
}
