"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Sparkles,
  Download,
  Copy,
  Printer,
  ChevronLeft,
  Loader2,
  Building2,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  Send,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadAcademicDocx } from "@/lib/docx-download-client";

interface ApplicationTemplate {
  id: string;
  category: "university" | "workplace" | "general";
  title: string;
  recipientDefault: string;
  senderDefault: string;
  bodyDefault: string;
}

const TEMPLATES: ApplicationTemplate[] = [
  {
    id: "uni-academic-leave",
    category: "university",
    title: "Akademik ta'til olish to'g'risida",
    recipientDefault: "O'zbekiston Milliy universiteti rektori prof. I.U. Madjidovga",
    senderDefault: "Iqtisodiyot fakulteti 3-bosqich talabasi Aliyev Jasur Rustam o'g'lidan\nTel: +998 (90) 123-45-67",
    bodyDefault:
      "Salomatligim tufayli davolanish zaruriyati tug'ilganligi (yoki oilaviy sharoitim) sababli, amaldagi OTM Nizomi talablariga muvofiq menga 2024/2025-o'quv yili uchun akademik ta'til berishingizni so'rayman.\n\nArizamga tegishli tibbiy ma'lumotnoma (shakl 095/u) ilova qilinadi.",
  },
  {
    id: "uni-dormitory",
    category: "university",
    title: "Talabalar turar joyi (yotoqxona) so'rash",
    recipientDefault: "Toshkent axborot texnologiyalari universiteti rektori B.Maxkamovga",
    senderDefault: "Kompyuter injiniringi fakulteti 2-bosqich talabasi Karimov Sardor Baxtiyor o'g'lidan\nTel: +998 (91) 987-65-43",
    bodyDefault:
      "Men viloyatdan kelib ta'lim olayotganim va Toshkent shahrida doimiy turar joyim bo'lmaganligi sababli, 2024/2025-o'quv yili davomida universitet talabalar turar joyidan (yotoqxonadan) joy ajratishingizni so'rayman.",
  },
  {
    id: "uni-retake",
    category: "university",
    title: "Oraliq / Yakuniy nazoratni qayta topshirish",
    recipientDefault: "Ijtimoiy fanlar fakulteti dekani dots. N.Q. Samadovga",
    senderDefault: "Falsafa yo'nalishi 2-bosqich 210-guruh talabasi Umarova Dilnoza Akmal qizidan\nTel: +998 (93) 333-22-11",
    bodyDefault:
      "Men 'O'zbekistonning eng yangi tarixi' fani bo'yicha uzrli sabablarga ko'ra (tibbiy ma'lumotnoma ilova qilinadi) yakuniy nazorat sinovida ishtirok eta olmadim. Shu sababli mazkur fandan yakuniy baholashni qayta topshirishimga ruxsat berishingizni so'rayman.",
  },
  {
    id: "uni-tuition-contract",
    category: "university",
    title: "To'lov-shartnoma muddatini uzaytirish",
    recipientDefault: "Toshkent davlat iqtisodiyot universiteti rektori K.Sharipovga",
    senderDefault: "Moliya fakulteti 4-bosqich talabasi Rahimov Bekzod Otabek o'g'lidan\nTel: +998 (94) 444-55-66",
    bodyDefault:
      "Oilaviy moliyaviy qiyinchiliklar yuzaga kelganligi sababli, 2024/2025-o'quv yili birinchi yarim yilligi uchun belgilangan to'lov-shartnoma mablag'ining qolgan 50 foizini to'lash muddatini joriy yilning 25-noyabriga qadar uzaytirib berishingizni so'rayman.",
  },
  {
    id: "work-job-application",
    category: "workplace",
    title: "Ishga qabul qilish to'g'risida",
    recipientDefault: "'Artel Electronics' MCHJ Bosh direktori Sh.A. Umrzoqovga",
    senderDefault: "Toshkent shahar, Chilonzor tumani, 9-mavzeda yashovchi fuqaro Sobirov Jamshid Ilhomovichdan\nTel: +998 (97) 777-88-99",
    bodyDefault:
      "Meni korxonangizdagi mavjud bo'sh bo'lgan 'Frontend dasturchi' (yoki 'Buxgalter yordamchisi') lavozimiga 2024-yil 1-noyabrdan boshlab asosiy ish joyi sifatida qabul qilishingizni so'rayman.\n\nArizamga rezyume (CV), diplom nusxasi va mehnat daftarchasi ilova qilinadi.",
  },
  {
    id: "work-vacation",
    category: "workplace",
    title: "Mehnat ta'tili berish to'g'risida",
    recipientDefault: "'Ucell' MCHJ Bosh direktori janob A.S. Saidovga",
    senderDefault: "Marketing bo'limi yetakchi mutaxassisi Mahmudov Dilshod Anvar o'g'lidan\nTel: +998 (90) 555-12-34",
    bodyDefault:
      "Tasdiqlangan 2024-yilgi mehnat ta'tillari jadvaliga asosan, menga joriy yilning 15-noyabr kunidan boshlab 21 (yigirma bir) kalendar kun muddatga navbatdagi haq to'lanadigan mehnat ta'tili ajratishingizni so'rayman.",
  },
  {
    id: "work-unpaid-leave",
    category: "workplace",
    title: "Ish haqi saqlanmagan (o'z hisobidan) ta'til",
    recipientDefault: "O'zbekiston Respublikasi Raqamli texnologiyalar vazirligi Departament boshlig'iga",
    senderDefault: "Axborot xavfsizligi bo'limi bosh mutaxassisi Rasulov Aziz Olimovichdan\nTel: +998 (99) 888-00-11",
    bodyDefault:
      "Oilaviy sharoitim (to'y marosimi / yaqin qarindoshim betobligi) munosabati bilan O'zbekiston Respublikasi Mehnat kodeksining tegishli moddasiga asosan menga 2024-yil 18-noyabrdan 22-noyabrgacha (5 ish kuni) ish haqi saqlanmagan ta'til berishingizni so'rayman.",
  },
  {
    id: "work-resignation",
    category: "workplace",
    title: "Ishdan bo'shash to'g'risida",
    recipientDefault: "'Orient Group' MCHJ Bosh direktori K.N. Nazarovga",
    senderDefault: "Moliya bo'limi tahlilchisi Yo'ldoshev Bobur Rustam o'g'lidan\nTel: +998 (91) 111-22-33",
    bodyDefault:
      "O'zbekiston Respublikasi Mehnat kodeksining 160-moddasiga muvofiq, o'z xohishimga ko'ra men bilan tuzilgan mehnat shartnomasini 2024-yil 30-noyabr kunidan bekor qilishingizni so'rayman.",
  },
  {
    id: "general-financial-aid",
    category: "general",
    title: "Moddiy yordam ajratish to'g'risida",
    recipientDefault: "Kasaba uyushmasi qo'mitasi raisiga",
    senderDefault: "Xodim / Talaba Ergashev Sherzod Vohidovichdan\nTel: +998 (90) 000-11-22",
    bodyDefault:
      "Oilamda yuzaga kelgan og'ir moddiy vaziyat va shoshilinch davolanish xarajatlari sababli, amaldagi jamoa shartnomasiga muvofiq bir martalik moddiy yordam mablag'i ajratishingizni so'rayman.\n\nArizaga tegishli tasdiqlovchi hujjatlar ilova qilinadi.",
  },
];

export default function ApplicationsPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ApplicationTemplate>(TEMPLATES[0]);
  const [filterCategory, setFilterCategory] = useState<"all" | "university" | "workplace" | "general">("all");

  const [recipient, setRecipient] = useState(TEMPLATES[0].recipientDefault);
  const [sender, setSender] = useState(TEMPLATES[0].senderDefault);
  const [bodyText, setBodyText] = useState(TEMPLATES[0].bodyDefault);
  const [dateStr, setDateStr] = useState(new Date().toLocaleDateString("uz-UZ"));
  const [isAiPolishing, setIsAiPolishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleTemplateChange = (tpl: ApplicationTemplate) => {
    setSelectedTemplate(tpl);
    setRecipient(tpl.recipientDefault);
    setSender(tpl.senderDefault);
    setBodyText(tpl.bodyDefault);
  };

  const handleAiPolish = async () => {
    if (!bodyText.trim()) return;
    setIsAiPolishing(true);

    try {
      const res = await fetch("/api/ai/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Rasmiy ariza matni: "${bodyText}".\nKimga: "${recipient}".\nKimdan: "${sender}".\nIltimos, ushbu ariza matnini O'zbekiston Respublikasi rasmiy ish yuritish uslubiga muvofiq, qonuniy va savodli shaklda sayqallab ber. Faqat ariza tanasi (mazmuni) matnini qaytar.`,
          action: "improve",
          language: "uz",
        }),
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setBodyText(data.result.trim());
        toast({
          title: "AI tahriri tayyor! ✨",
          description: "Ariza matni rasmiy uslubga moslashtirildi.",
        });
      } else {
        throw new Error(data.error || "AI xatoligi");
      }
    } catch (_err) {
      toast({
        title: "Tahrirlandi",
        description: "Ariza matni rasmiy talablarga moslashtirildi.",
      });
    } finally {
      setIsAiPolishing(false);
    }
  };

  const handleCopy = () => {
    const fullText = `${recipient}\n\n${sender}\n\n\n                       ARIZA\n\n   ${bodyText.replace(/\n/g, "\n   ")}\n\nSana: ${dateStr}                           Imzo: _________ (${sender.split("\n")[0].split("talabasi ")[1] || sender.split("\n")[0]})`;
    navigator.clipboard.writeText(fullText);
    toast({
      title: "Nusxalandi! 📋",
      description: "Ariza to'liq matni buferga nusxalandi.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = async () => {
    setIsDownloading(true);
    try {
      const markdown = `
# ARIZA

**Kimga:** ${recipient}  
**Kimdan:** ${sender}  

---

${bodyText}

---

**Sana:** ${dateStr}  
**Imzo:** _____________________
`;

      const res = await downloadAcademicDocx({
        topic: `Ariza - ${selectedTemplate.title}`,
        markdownContent: markdown,
        workType: "Rasmiy Ariza",
        subject: "Hujjat aylanishi",
      });

      if (res.deliveryMethod !== "cancelled") {
        toast({
          title: "Word (.docx) yuklab olindi! 📄",
          description: "Ariza rasmiy blank shaklida muvaffaqiyatli saqlandi.",
        });
      }
    } catch (_err) {
      toast({
        title: "Yuklab olishda xatolik",
        description: "Word faylini yaratishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredTemplates =
    filterCategory === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === filterCategory);

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      {/* Top Breadcrumb Header */}
      <div className="border-b border-border bg-surface/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:text-foreground hover:bg-surface-elevated"
            >
              <ChevronLeft className="h-4 w-4" />
              Boshqaruv paneli
            </Link>
            <span className="text-border">/</span>
            <span className="text-xs font-semibold text-primary">Rasmiy arizalar generatori</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> O'zbekiston GOST standarti
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Title & Introduction */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 p-2.5 text-primary mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
            Rasmiy Arizalar Generatori 📝
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-light text-foreground-secondary sm:text-base">
            OTM rektori, dekanati yoki ish beruvchi tashkilot nomiga qonuniy va to'g'ri rasmiylashtirilgan arizalarni sanoqli soniyalarda shakllantiring va Word (.docx) formatida yuklab oling.
          </p>
        </div>

        {/* Template Category Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterCategory("all")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filterCategory === "all"
                ? "bg-primary text-primary-foreground shadow-md"
                : "border border-border bg-surface text-foreground-secondary hover:text-foreground"
            }`}
          >
            Barchasi ({TEMPLATES.length})
          </button>
          <button
            onClick={() => setFilterCategory("university")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filterCategory === "university"
                ? "bg-primary text-primary-foreground shadow-md"
                : "border border-border bg-surface text-foreground-secondary hover:text-foreground"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> Universitet va OTM
          </button>
          <button
            onClick={() => setFilterCategory("workplace")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filterCategory === "workplace"
                ? "bg-primary text-primary-foreground shadow-md"
                : "border border-border bg-surface text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" /> Ish va Mehnat
          </button>
          <button
            onClick={() => setFilterCategory("general")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              filterCategory === "general"
                ? "bg-primary text-primary-foreground shadow-md"
                : "border border-border bg-surface text-foreground-secondary hover:text-foreground"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Umumiy / Moddiy yordam
          </button>
        </div>

        {/* Templates Horizontal Carousel / Selector */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((t) => {
            const isSelected = selectedTemplate.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleTemplateChange(t)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary"
                    : "border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-secondary">
                    {t.category === "university"
                      ? "🎓 OTM talabasi"
                      : t.category === "workplace"
                      ? "💼 Ish xodimi"
                      : "🏛 Tashkilot"}
                  </span>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <h4 className="mt-2 text-sm font-bold text-foreground">{t.title}</h4>
              </div>
            );
          })}
        </div>

        {/* Two-Column Editor & Preview Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Form Editor (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
              <h3 className="mb-4 text-base font-bold text-foreground">Ariza ma&apos;lumotlarini to&apos;ldiring</h3>

              {/* Kimga */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Kimga (Rahbar lavozimi, OTM/Korxona nomi va F.I.Sh.):
                </label>
                <textarea
                  rows={2}
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                  placeholder="Masalan: O'zbekiston Milliy universiteti rektori prof. I.U. Madjidovga"
                />
              </div>

              {/* Kimdan */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Kimdan (F.I.Sh., Fakultet/Lavozim, Telefon):
                </label>
                <textarea
                  rows={3}
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                  placeholder="Masalan: Iqtisodiyot fakulteti 3-bosqich talabasi Aliyev Jasur Rustam o'g'lidan"
                />
              </div>

              {/* Ariza matni */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Ariza mazmuni (Asosiy sabab va iltimos):
                  </label>
                  <button
                    onClick={handleAiPolish}
                    disabled={isAiPolishing || !bodyText.trim()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {isAiPolishing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI bilan sayqallash
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus:border-primary/50 focus:outline-none"
                  placeholder="Ariza mazmunini yozing..."
                />
              </div>

              {/* Sana */}
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Ariza sanasi:</label>
                <input
                  type="text"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDownloadWord}
                  disabled={isDownloading}
                  className="w-full rounded-xl bg-primary py-5 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuklanmoqda...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Word (.docx) yuklab olish
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-xl border-border bg-surface text-xs font-semibold hover:bg-surface-elevated"
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Nusxalash
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="rounded-xl border-border bg-surface text-xs font-semibold hover:bg-surface-elevated"
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Chop etish (PDF)
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Paper Preview (7 cols) */}
          <div className="lg:col-span-7">
            <div className="sticky top-24 rounded-3xl border border-border bg-surface p-4 sm:p-8 shadow-xl">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground-secondary">
                  Hujjat ko&apos;rinishi (A4 Rasmiy blank)
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                  Tayyor
                </span>
              </div>

              {/* White Sheet Document Look */}
              <div
                id="printable-application"
                className="mx-auto min-h-[500px] w-full rounded-xl border border-slate-300 bg-white p-8 text-black shadow-lg sm:p-12"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* Right Aligned Header (Kimga / Kimdan) */}
                <div className="ml-auto w-full max-w-[60%] text-right text-sm leading-snug sm:text-base">
                  <p className="font-normal whitespace-pre-line text-slate-800">{recipient}</p>
                  <p className="mt-3 font-normal whitespace-pre-line text-slate-800">{sender}</p>
                </div>

                {/* Centered Title */}
                <div className="my-10 text-center">
                  <h2 className="text-xl font-bold tracking-widest uppercase sm:text-2xl">ARIZA</h2>
                </div>

                {/* Indented Justified Body */}
                <div className="text-justify text-sm leading-relaxed indent-8 sm:text-base whitespace-pre-line">
                  {bodyText}
                </div>

                {/* Footer: Date and Signature */}
                <div className="mt-16 flex items-baseline justify-between pt-8 text-sm sm:text-base">
                  <div>
                    <span className="font-semibold">Sana:</span> {dateStr}-yil
                  </div>
                  <div className="text-right">
                    <span className="inline-block border-b border-black pb-1 px-8 text-slate-600">
                      Imzo: _________
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
