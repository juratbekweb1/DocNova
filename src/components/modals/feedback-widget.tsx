"use client";

import React, { useState } from "react";
import { MessageSquarePlus, X, Send, Loader2, CheckCircle2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "🐞 Xatolik / Kamchilik", label: "🐞 Xatolik / Kamchilik" },
  { id: "❓ Tushunmovchilik", label: "❓ Tushunmovchilik" },
  { id: "💡 Taklif va g'oya", label: "💡 Taklif va g'oya" },
  { id: "💳 To'lov / Limit", label: "💳 To'lov / Limit" },
];

export function FeedbackWidget() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 3) {
      toast({
        title: "Matn kiriting",
        description: "Iltimos, kamchilik yoki taklifingizni qisqacha yozing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          rating,
          message: message.trim(),
          contact: contact.trim(),
          pageUrl: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Xatolik yuz berdi");
      }

      setSent(true);
      setMessage("");
      toast({
        title: "Xabaringiz yuborildi! ✅",
        description: "Fikr va mulohazangiz to'g'ridan-to'g'ri adminlarga yetkazildi.",
      });

      setTimeout(() => {
        setSent(false);
        setIsOpen(false);
      }, 2000);
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        title: "Xatolik yuz berdi",
        description: e.message || "Iltimos, qayta urinib ko'ring.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="print:hidden">
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-primary/40 bg-surface/95 text-foreground hover:border-primary hover:bg-primary/10 fixed bottom-5 left-5 z-40 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur-md transition-all hover:scale-105"
        title="Kamchilik yoki taklif bildirish"
      >
        <MessageSquarePlus className="text-primary h-4 w-4" />
        <span>Fikr bildirish</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="border-border bg-surface relative w-full max-w-md rounded-2xl border p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-foreground-muted hover:bg-surface-elevated hover:text-foreground absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-foreground text-lg font-bold">
                  Rahmat! Murojaatingiz qabul qilindi
                </h3>
                <p className="text-foreground-secondary mt-1 text-xs">
                  Sizning fikringiz DocNova jamoasiga Telegram orqali darhol yetkazildi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="bg-primary/10 text-primary mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold">
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    <span>Qayta aloqa va Qo&apos;llab-quvvatlash</span>
                  </div>
                  <h3 className="text-foreground text-lg font-extrabold">
                    Fikr yoki kamchilik bildirish
                  </h3>
                  <p className="text-foreground-secondary mt-0.5 text-xs">
                    Saytda qandaydir xatolik, tushunmovchilik yoki taklifingiz bo&apos;lsa yozib
                    qoldiring.
                  </p>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="text-foreground-secondary mb-1.5 block text-xs font-semibold">
                    Murojaat turi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`cursor-pointer rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all ${
                          category === c.id
                            ? "border-primary bg-primary/15 text-primary shadow-sm"
                            : "border-border bg-background text-foreground-secondary hover:text-foreground"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="text-foreground-secondary mb-1.5 block text-xs font-semibold">
                    Platformaga bahoyingiz
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-foreground-muted"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Xabar matni *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Qaysi bo'limda qanday muammo yoki tushunmovchilik bo'ldi? Batafsil yozing..."
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border p-3 text-xs focus:outline-none sm:text-sm"
                  />
                </div>

                {/* Optional Contact */}
                <div>
                  <label className="text-foreground-secondary mb-1 block text-xs font-semibold">
                    Telegram username yoki Telefon (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="@username yoki +998 90 123 45 67"
                    className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Yuborish</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
