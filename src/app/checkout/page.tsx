'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { CreditCard, ShieldCheck, CheckCircle, Loader2, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';

function CheckoutContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const _router = useRouter();
  const { data: session, status } = useSession();
  
  const plan = searchParams?.get('plan') === 'premium' ? 'premium' : 'pro';
  
  // If not logged in, redirect to login
  if (status === 'unauthenticated') {
    _router.push(`/login?callbackUrl=/checkout?plan=${plan}`);
    return null;
  }
  
  const isPremium = plan === 'premium';
  const planName = isPremium ? t.premiumPlan : t.proPlan;
  const planPrice = isPremium ? t.pricePremium : t.pricePro;
  const planDesc = isPremium ? t.premiumPlanDesc : t.proPlanDesc;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [name, setName] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/checkout/payx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate payment url");
      }
      
      const data = await res.json();
      
      if (data.pay_url) {
        window.location.href = data.pay_url;
      } else {
        throw new Error("No payment url returned");
      }
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      alert(`Xatolik: ${err.message || "To'lov tizimi bilan bog'lanishda xatolik yuz berdi"}`);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground relative overflow-hidden">
      
      <main className="max-w-7xl mx-auto px-6 py-12 lg:py-24 relative z-10">
        <div className="mb-12">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{t.checkoutTitle}</h1>
          <p className="mt-4 text-foreground-secondary max-w-2xl">{t.checkoutDesc}</p>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-24">
          {/* Payment Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {t.paymentMethod}
            </h2>
            
            <form onSubmit={handlePayment} className="space-y-6 bg-surface-elevated/50 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-border shadow-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground-secondary mb-2">{t.cardNumber}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 pl-12 text-foreground placeholder-foreground-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground-secondary mb-2">{t.cardHolder}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-foreground-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground-secondary mb-2">{t.expiryDate}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                      setExpiry(val);
                    }}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-foreground placeholder-foreground-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full mt-8 relative group overflow-hidden rounded-xl bg-primary p-px font-bold text-primary-foreground transition-all hover:shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
              >
                <div className="relative flex items-center justify-center gap-2 bg-primary px-6 py-4 rounded-xl">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.processing}
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      {t.payNow} — {planPrice}
                    </>
                  )}
                </div>
              </button>
              <p className="text-center text-xs text-foreground-secondary mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Payments are secure and encrypted
              </p>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <div className={`relative p-8 rounded-3xl border overflow-hidden shadow-lg ${isPremium ? 'bg-surface-elevated/40 border-violet-500/30' : 'bg-surface-elevated/40 border-primary/30'}`}>
              <div className={`absolute top-0 right-0 w-64 h-64 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none ${isPremium ? 'bg-violet-500/10' : 'bg-primary/10'}`} />
              
              <h2 className="text-xl font-bold mb-6 relative z-10 text-foreground">{t.orderSummary}</h2>
              
              <div className="relative z-10 pb-6 border-b border-border mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg text-foreground-secondary font-medium">{planName}</span>
                  <span className="text-3xl font-black text-foreground">{planPrice}</span>
                </div>
                <p className="text-sm text-foreground-secondary">{planDesc}</p>
              </div>

              <ul className="space-y-4 relative z-10">
                {[
                  t.featAiWritingTitle,
                  t.featAtsTitle,
                  t.featExportTitle,
                  t.featPreviewTitle,
                  t.featTemplatesTitle,
                  t.featVersionsTitle
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 shrink-0 ${isPremium ? 'text-violet-500' : 'text-primary'}`} />
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
