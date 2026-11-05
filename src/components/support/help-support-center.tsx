"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  HelpCircle,
  MessageSquareWarning,
  Send,
  Loader2,
  CheckCircle2,
  Star,
  Clock,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  CreditCard,
  Bug,
  Lightbulb,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupportTicketItem {
  id: string;
  category: string;
  subject: string;
  message: string;
  contact: string;
  rating: number;
  status: string;
  createdAt: string;
}

const SUPPORT_CATEGORIES = [
  {
    id: "🚨 Shikoyat / Norozilik",
    label: "Shikoyat / Norozilik",
    desc: "Xizmat sifati yoki natijadan norozilik",
    icon: AlertTriangle,
    color: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  },
  {
    id: "💳 To'lov va Tarif muammosi",
    label: "To'lov / Limit muammosi",
    desc: "To'lov o'tmagani yoki limit xatoligi",
    icon: CreditCard,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
  {
    id: "🐞 Texnik xatolik / Hujjat",
    label: "Texnik xatolik / Bug",
    desc: "Fayl yuklanmasligi yoki AI xatosi",
    icon: Bug,
    color: "text-sky-400 border-sky-500/30 bg-sky-500/10",
  },
  {
    id: "❓ Savol va Tushunmovchilik",
    label: "Savol va Yordam",
    desc: "Platformadan foydalanish bo'yicha savol",
    icon: HelpCircle,
    color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
  },
  {
    id: "💡 Taklif va g'oya",
    label: "Taklif va G'oya",
    desc: "Yangi imkoniyat qo'shish taklifi",
    icon: Lightbulb,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
];

const FAQ_ITEMS = [
  {
    q: "Kurs ishi yoki referat yaratishda xatolik bersa limitim kuyadimi?",
    a: "Yo'q. Agar sun'iy intellekt texnik sababga ko'ra hujjatni tayyorlay olmasa, tizim avtomatik ravishda sarflangan limitni hisobingizga qaytaradi (Refund tizimi faol). Shunday holat kuzatilsa, quyidagi forma orqali bizga yozing.",
  },
  {
    q: "To'lov qildim, lekin PRO yoki PREMIUM tarifim darhol yonmadi. Nima qilishim kerak?",
    a: "Click yoki Payme orqali to'lov amalga oshirilgach tarif odatda 5-15 soniyada avtomatik faollashadi. Agar kechikish bo'lsa, 'To'lov / Limit muammosi' bo'limini tanlab, to'lov vaqti va telefon raqamingizni yozib yuboring — adminlarimiz darhol tekshirib yoqib berishadi.",
  },
  {
    q: "Tayyor bo'lgan hujjatni Microsoft Word (.docx / .doc) formatda qanday yuklab olaman?",
    a: "Akademik bo'limda (Kurs ishi, Referat, BMI) hujjat yaratilgach, natija oynasining yuqori o'ng burchagida 'Word (.doc) yuklab olish' tugmasi chiqadi. Shuningdek, @DocNovaAI_bot Telegram botimiz orqali ham tayyor Word faylni qabul qilib olishingiz mumkin.",
  },
  {
    q: "Yaratilgan kurs ishi yoki referat menga yoqmasa qayta o'zgartira olamanmi?",
    a: "Ha! Ham veb-saytda, ham @DocNovaAI_bot Telegram botimizda hujjat yaratilgandan so'ng uning alohida boblarini tahrirlash, hajmini kengaytirish yoki akademik uslubini oshirish imkoniyati mavjud.",
  },
];

export function HelpSupportCenter({
  defaultName,
  defaultEmail,
}: {
  defaultName?: string | null;
  defaultEmail?: string | null;
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState(SUPPORT_CATEGORIES[0].id);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState(defaultEmail || "");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/feedback")
      .then((res) => (res.ok ? res.json() : { tickets: [] }))
      .then((data) => {
        if (active) {
          setTickets(data.tickets || []);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (active) {
          setLoadingTickets(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 5) {
      toast({
        title: "Xabar matni juda qisqa",
        description: "Iltimos, muammo yoki murojaatingizni batafsilroq yozing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSubmittedTicketId(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          message: message.trim(),
          contact: contact.trim(),
          rating,
          pageUrl: "/help",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Xabarni yuborishda xatolik yuz berdi");
      }

      setSubmittedTicketId(data.ticketId || "OK");
      setSubject("");
      setMessage("");
      toast({
        title: "Murojaatingiz qabul qilindi! ✅",
        description: "Xabaringiz Super Admin va qo'llab-quvvatlash jamoasiga darhol yetkazildi.",
      });
      void loadTickets();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Qaytadan urinib ko'ring";
      toast({
        title: "Xatolik yuz berdi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/50 p-6 shadow-2xl sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold text-sky-400">
              <MessageSquareWarning className="h-3.5 w-3.5" />
              <span>24/7 Qo&apos;llab-quvvatlash va Shikoyatlar markazi</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Yordam va Qo&apos;llab-quvvatlash
            </h1>
            <p className="max-w-2xl text-sm text-slate-300">
              {defaultName ? `Hurmatli ${defaultName}, s` : "S"}ayt ishlashida qandaydir xatolik,
              norozilik, limit yoki to&apos;lov bilan bog&apos;liq muammo yuzaga keldimi? Quyidagi
              forma orqali yozib qoldiring — murojaatingiz to&apos;g&apos;ridan-to&apos;g&apos;ri
              loyiha rahbariyatiga (Super Admin) yetib boradi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://t.me/DocNovaAI_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/15 px-4 py-2.5 text-xs font-bold text-sky-300 transition hover:bg-sky-500/25 sm:text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Telegram Bot (@DocNovaAI_bot)</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Complaint/Support Form, Right = Direct Contact + FAQ + History */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Support & Complaint Form (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-md sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                Shikoyat, muammo yoki taklif yuborish
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Har bir murojaat ro&apos;yxatga olinadi va Telegram orqali ma&apos;muriyatga darhol
                yuboriladi.
              </p>
            </div>

            {submittedTicketId && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-emerald-300">
                    Murojaatingiz muvaffaqiyatli yuborildi! (ID: #
                    {submittedTicketId.slice(-6).toUpperCase()})
                  </p>
                  <p className="mt-1 text-emerald-200/80">
                    Xabaringiz Super Adminga yetkazildi. Ko&apos;rsatilgan aloqa manzilingiz orqali
                    siz bilan bog&apos;lanamiz.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Category selection */}
              <div>
                <label className="mb-2 block text-xs font-bold tracking-wider text-slate-300 uppercase">
                  1. Murojaat turini tanlang
                </label>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SUPPORT_CATEGORIES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = category === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategory(item.id)}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                          isSelected
                            ? "border-sky-500 bg-sky-500/15 shadow-md"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div className={`rounded-xl border p-2 ${item.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white sm:text-sm">
                            {item.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">{item.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  2. Qisqacha mavzu (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Masalan: Kurs ishi Word fayli yuklanmadi yoki PRO tarif yonmadi"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* 3. Detailed Message */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-300">
                  3. Muammo yoki shikoyat matni *
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Qaysi bo'limda qanday xatolik bo'ldi? Sizga nima ma'qul kelmadi yoki qanday yordam kerak? Batafsil yozing..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* 4. Contact & Rating */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    4. Bog&apos;lanish uchun Telegram yoki Telefon *
                  </label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="@username, +998901234567 yoki email"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-300">
                    5. Xizmatga bahoyingiz
                  </label>
                  <div className="flex h-[42px] items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="cursor-pointer p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-semibold text-slate-400">{rating} / 5</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Murojaatni ma&apos;muriyatga yuborish</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: User's Ticket History & FAQ (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Guarantee Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex items-start gap-3.5">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">100% Murojaatlar nazorati</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Yuborilgan har bir shikoyat va taklif darhol Super Admin paneliga hamda rasmiy
                  Telegram monitoring botiga tushadi. O&apos;rtacha javob berish vaqti: 15–60
                  daqiqa.
                </p>
              </div>
            </div>
          </div>

          {/* Recent User Tickets */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Sizning so&apos;nggi murojaatlaringiz</h3>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-300">
                {tickets.length} ta
              </span>
            </div>

            {loadingTickets ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yuklanmoqda...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                Hozircha yuborilgan murojaatlar yo&apos;q.
              </div>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {tickets.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sky-400">{t.category}</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <Clock className="h-2.5 w-2.5" />
                        Yetkazildi
                      </span>
                    </div>
                    {t.subject && (
                      <div className="mt-1 font-semibold text-white">{t.subject}</div>
                    )}
                    <p className="mt-1 line-clamp-2 text-slate-300">{t.message}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>ID: #{t.id.slice(-6).toUpperCase()}</span>
                      <span>{new Date(t.createdAt).toLocaleString("uz-UZ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQ Accordion */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
            <h3 className="mb-4 text-base font-bold text-white">
              Ko&apos;p uchraydigan muammolar va yechimlar
            </h3>
            <div className="space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left text-xs font-bold text-white sm:text-sm"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                          isOpen ? "rotate-180 text-sky-400" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-800/80 px-4 py-3 text-xs leading-relaxed text-slate-300">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
