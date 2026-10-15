"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  RefreshCw,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

function CircularProgress({
  score,
  size = 140,
  label,
}: {
  score: number;
  size?: number;
  label: string;
}) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeDash = (animated / 100) * circumference;
  const color = score < 50 ? "#ef4444" : score < 75 ? "#f59e0b" : "#22c55e";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-foreground text-3xl font-bold">{animated}</span>
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}

export default function ATSFormattingPage() {
  const { t, lang } = useLanguage();

  const getLocalizedData = () => {
    switch (lang) {
      case "uz":
        return {
          scoreDesc:
            "Resumeyingiz o'rtacha darajadan past baholandi. Balingizni 80 dan oshirish uchun quyidagi tavsiyalarni qo'llang.",
          sampleResume: `Jon Smit - Dastur muhandisi\n\nTajriba:\nTechCorp da Dasturchi (2021-2024)\n- React yordamida veb ilovalar qildim\n- Ma'lumotlar bazasi so'rovlari ustida ishladim\n- Xatolarni tuzatdim va kod yozdim\n- Uchrashuvlarda qatnashdim va hisobot berdim\n\nTa'lim:\nBS Kompyuter fanlari, Davlat universiteti 2021\n\nKo'nikmalar: JavaScript, HTML, CSS, Git`,
          allKeywords: [
            { word: "React", found: true },
            { word: "JavaScript", found: true },
            { word: "Git", found: true },
            { word: "Python", found: false },
            { word: "SQL", found: false },
            { word: "API", found: false },
            { word: "TypeScript", found: false },
            { word: "Agile", found: false },
            { word: "Node.js", found: false },
            { word: "Testing", found: false },
          ],
          issues: [
            "Bandlarda miqdoriy ko'rsatkichlar yo'q (raqamlar, foizlar)",
            'Ish nomida norasmiy til ishlatilgan ("qildim", "tuzatdim")',
            "LinkedIn yoki GitHub profil havolasi yo'q",
            "Tajriba bo'limida o'lchanadigan yutuqlar yo'q",
            "Ko'nikmalar bo'limi juda siyrak — tegishli vositalar bilan kengaytiring",
          ],
          suggestions: [
            'Ko\'rsatkichlarni qo\'shing: "tezlikni oshirdim" o\'rniga "ish faoliyatini 40% ga oshirdim"',
            "Ko'nikmalar bo'limiga ish ta'rifidagi kalit so'zlarni kiriting",
            "Butun davomida izchil sana formatidan foydalaning (masalan, Yan 2021 – Mar 2024)",
            "Yuqorida professional qisqacha ma'lumot bo'limini qo'shing",
            "Maqsadli rolingizga tegishli sertifikatlar yoki kurslarni ro'yxatga kiriting",
            'Kuchsiz fe\'llarni ("ustida ishladim") kuchlilariga ("loyihalashtirdim", "ishlab chiqdim") almashtiring',
          ],
        };
      case "ru":
        return {
          scoreDesc:
            "Ваше резюме набрало ниже среднего балла. Примените рекомендации ниже, чтобы увеличить балл выше 80.",
          sampleResume: `Джон Смит - Инженер-программист\n\nОпыт:\nРазработчик ПО в TechCorp (2021-2024)\n- Создавал веб-приложения с использованием React\n- Работал над запросами к базе данных\n- Исправлял ошибки и писал код\n- Посещал встречи и давал отчеты\n\nОбразование:\nБакалавр компьютерных наук, Государственный университет 2021\n\nНавыки: JavaScript, HTML, CSS, Git`,
          allKeywords: [
            { word: "React", found: true },
            { word: "JavaScript", found: true },
            { word: "Git", found: true },
            { word: "Python", found: false },
            { word: "SQL", found: false },
            { word: "API", found: false },
            { word: "TypeScript", found: false },
            { word: "Agile", found: false },
            { word: "Node.js", found: false },
            { word: "Testing", found: false },
          ],
          issues: [
            "В пунктах отсутствуют количественные показатели (цифры, проценты)",
            'В названии должности используется неформальный язык ("Создавал", "Исправлял ошибки")',
            "Отсутствует URL-адрес профиля LinkedIn или GitHub",
            "В разделе опыта нет измеримых достижений",
            "Раздел навыков слишком скудный — расширьте его с помощью соответствующих инструментов",
          ],
          suggestions: [
            'Добавьте метрики: "Увеличил производительность на 40%" вместо "улучшил скорость"',
            "Включите ключевые слова из описания вакансии в раздел навыков",
            "Используйте единый формат дат (например, Янв 2021 – Мар 2024)",
            "Добавьте раздел профессионального резюме в самом начале",
            "Укажите сертификаты или курсы, соответствующие вашей целевой роли",
            'Замените слабые глаголы ("работал над") на сильные ("спроектировал", "разработал")',
          ],
        };
      case "tr":
        return {
          scoreDesc:
            "Özgeçmişiniz ortalamanın altında puan aldı. Puanınızı 80'in üzerine çıkarmak için aşağıdaki önerileri uygulayın.",
          sampleResume: `John Smith - Yazılım Mühendisi\n\nDeneyim:\nTechCorp'ta Yazılım Geliştirici (2021-2024)\n- React kullanarak web uygulamaları oluşturdu\n- Veritabanı sorguları üzerinde çalıştı\n- Hataları düzeltti ve kod yazdı\n- Toplantılara katıldı ve güncellemeler verdi\n\nEğitim:\nBS Bilgisayar Bilimleri, Eyalet Üniversitesi 2021\n\nBeceriler: JavaScript, HTML, CSS, Git`,
          allKeywords: [
            { word: "React", found: true },
            { word: "JavaScript", found: true },
            { word: "Git", found: true },
            { word: "Python", found: false },
            { word: "SQL", found: false },
            { word: "API", found: false },
            { word: "TypeScript", found: false },
            { word: "Agile", found: false },
            { word: "Node.js", found: false },
            { word: "Testing", found: false },
          ],
          issues: [
            "Madde işaretlerinde ölçülebilir metrikler eksik (sayılar, yüzdeler)",
            'İş unvanı gayri resmi dil kullanıyor ("Oluşturdu", "Hataları düzeltti")',
            "LinkedIn veya GitHub profil URL'si eksik",
            "Deneyim bölümünün ölçülebilir başarıları yok",
            "Beceriler bölümü çok seyrek — ilgili araçlarla genişletin",
          ],
          suggestions: [
            'Metrikler ekleyin: "hızı artırdı" yerine "performansı %40 artırdı"',
            "Beceriler bölümünüze iş tanımından anahtar kelimeler ekleyin",
            "Tutarlı tarih biçimi kullanın (örneğin, Oca 2021 – Mar 2024)",
            "En üste profesyonel bir özet bölümü ekleyin",
            "Hedef rolünüzle ilgili sertifikaları veya kursları listeleyin",
            'Zayıf fiilleri ("üzerinde çalıştı") güçlü fiillerle ("tasarladı", "geliştirdi") değiştirin',
          ],
        };
      case "en":
      default:
        return {
          scoreDesc:
            "Your resume scored below average. Apply the suggestions below to increase your score above 80.",
          sampleResume: `John Smith - Software Engineer\n\nExperience:\nSoftware Developer at TechCorp (2021-2024)\n- Built web applications using React\n- Worked on database queries\n- Fixed bugs and wrote code\n- Attended meetings and gave updates\n\nEducation:\nBS Computer Science, State University 2021\n\nSkills: JavaScript, HTML, CSS, Git`,
          allKeywords: [
            { word: "React", found: true },
            { word: "JavaScript", found: true },
            { word: "Git", found: true },
            { word: "Python", found: false },
            { word: "SQL", found: false },
            { word: "API", found: false },
            { word: "TypeScript", found: false },
            { word: "Agile", found: false },
            { word: "Node.js", found: false },
            { word: "Testing", found: false },
          ],
          issues: [
            "Bullet points lack quantifiable metrics (numbers, percentages)",
            'Job title uses informal language ("Built", "Fixed bugs")',
            "Missing LinkedIn or GitHub profile URL",
            "Experience section has no measurable achievements",
            "Skills section is too sparse — expand with relevant tools",
          ],
          suggestions: [
            'Add metrics: "Increased performance by 40%" instead of "improved speed"',
            "Include keywords from the job description in your skills section",
            "Use consistent date format throughout (e.g., Jan 2021 – Mar 2024)",
            "Add a professional summary section at the top",
            "List certifications or courses relevant to your target role",
            'Replace weak verbs ("worked on") with strong ones ("architected", "engineered")',
          ],
        };
    }
  };

  const {
    sampleResume,
    allKeywords: defaultKeywords,
    issues: defaultIssues,
    suggestions: defaultSuggestions,
    scoreDesc: defaultScoreDesc,
  } = getLocalizedData();
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dynamicScore, setDynamicScore] = useState(42);
  const [analyzedKeywords, setAnalyzedKeywords] = useState<{ word: string; found: boolean }[]>([]);
  const [detectedIssues, setDetectedIssues] = useState<string[]>([]);
  const [actionableSuggestions, setActionableSuggestions] = useState<string[]>([]);
  const [summaryText, setSummaryText] = useState("");

  const runLocalAtsAnalysis = (text: string) => {
    let score = 0;
    const issuesList: string[] = [];
    const suggestionsList: string[] = [];

    // 1. Contact Info check (up to 20 pts)
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
    const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,9}/.test(text);
    const hasLink = /(?:linkedin\.com|github\.com|t\.me|https?:\/\/)/i.test(text);

    if (hasEmail) score += 8;
    else
      issuesList.push(
        lang === "uz"
          ? "Email manzili aniqlanmadi"
          : lang === "ru"
            ? "Не указан адрес электронной почты"
            : "Email address not detected"
      );

    if (hasPhone) score += 7;
    else
      issuesList.push(
        lang === "uz"
          ? "Telefon raqami topilmadi"
          : lang === "ru"
            ? "Не указан номер телефона"
            : "Phone number not detected"
      );

    if (hasLink) score += 5;
    else
      issuesList.push(
        lang === "uz"
          ? "LinkedIn yoki GitHub profil havolasi yo'q"
          : lang === "ru"
            ? "Отсутствует ссылка на профиль LinkedIn/GitHub"
            : "Missing LinkedIn or GitHub profile link"
      );

    // 2. Sections check (up to 25 pts)
    const hasExperience = /(?:tajriba|experience|опыт|deneyim)/i.test(text);
    const hasEducation =
      /(?:ta'lim|education|образование|eğitim|universitet|university|institut)/i.test(text);
    const hasSkills = /(?:ko'nikma|skills|навыки|beceriler|texnologiya)/i.test(text);
    const hasSummary = /(?:xulosa|summary|резюме|haqida|about|maqsad)/i.test(text);

    if (hasExperience) score += 10;
    else
      issuesList.push(
        lang === "uz"
          ? "Ish tajribasi bo'limi aniq ajratilmagan"
          : lang === "ru"
            ? "Раздел опыта работы четко не выделен"
            : "Experience section not clearly identified"
      );

    if (hasEducation) score += 7;
    else
      suggestionsList.push(
        lang === "uz"
          ? "Ta'lim bo'limini va o'qish yillarini aniq ko'rsating"
          : lang === "ru"
            ? "Укажите раздел образования и годы обучения"
            : "Add an education section with degree and years"
      );

    if (hasSkills) score += 5;
    else
      issuesList.push(
        lang === "uz"
          ? "Ko'nikmalar (Skills) bo'limi topilmadi"
          : lang === "ru"
            ? "Отсутствует блок профессиональных навыков"
            : "Skills section not found"
      );

    if (hasSummary) score += 3;
    else
      suggestionsList.push(
        lang === "uz"
          ? "Yuqorida 2-3 qatordan iborat Professional Summary qo'shing"
          : lang === "ru"
            ? "Добавьте краткое Professional Summary в начале"
            : "Add a 2-3 line professional summary at the top"
      );

    // 3. Metrics & Numbers (up to 25 pts)
    const hasPercentages = /%\s*|\b\d+%\b/.test(text);
    const hasNumbers = /\b\d{2,}\b|\$\d+|\b\d+k\b/i.test(text);

    if (hasPercentages && hasNumbers) score += 25;
    else if (hasNumbers || hasPercentages) {
      score += 14;
      suggestionsList.push(
        lang === "uz"
          ? "Yutuqlaringizni foiz va raqamlar bilan asoslang (masalan, 'samaradorlikni 35% ga oshirdi')"
          : lang === "ru"
            ? "Усиливайте достижения цифрами и процентами (например, 'увеличил продажи на 35%')"
            : "Quantify your achievements with numbers and percentages"
      );
    } else {
      issuesList.push(
        lang === "uz"
          ? "Yutuqlar miqdoriy ko'rsatkichlarsiz (raqamlar va foizlarsiz) yozilgan"
          : lang === "ru"
            ? "В описании опыта нет количественных показателей"
            : "No measurable metrics or percentages detected in bullet points"
      );
    }

    // 4. Keyword Detection (up to 30 pts)
    const coreKeywords = [
      "React",
      "JavaScript",
      "TypeScript",
      "Node.js",
      "Python",
      "SQL",
      "Git",
      "API",
      "Docker",
      "AWS",
      "Agile",
      "Figma",
      "CI/CD",
      "Marketing",
      "Excel",
    ];
    const detectedKws = coreKeywords.map((kw) => ({
      word: kw,
      found: new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i").test(text),
    }));

    const foundCount = detectedKws.filter((k) => k.found).length;
    score += Math.min(30, foundCount * 5);

    if (foundCount < 3) {
      issuesList.push(
        lang === "uz"
          ? "ATS kalit so'zlari juda kam uchradi (kamida 4-5 ta sohaviy termin kiriting)"
          : lang === "ru"
            ? "Слишком мало ключевых слов для прохождения ATS"
            : "Very few ATS keywords detected — add more industry terminology"
      );
    }

    // 5. Length & Formatting
    const words = text.trim().split(/\s+/).length;
    if (words < 60) {
      score = Math.min(score, 35);
      issuesList.push(
        lang === "uz"
          ? "Matn hajmi juda qisqa (kamida 150-300 so'z tavsiya etiladi)"
          : lang === "ru"
            ? "Текст резюме слишком короткий"
            : "Resume content is too short"
      );
    } else if (words > 120) {
      score = Math.min(100, score + 5);
    }

    if (suggestionsList.length === 0) {
      suggestionsList.push(
        lang === "uz"
          ? "Har bir bandni kuchli harakat fe'li bilan boshlang (masalan, 'loyihalashtirdi', 'ishlab chiqdi')"
          : lang === "ru"
            ? "Начинайте каждый пункт с сильного глагола действия"
            : "Start each bullet point with a powerful action verb"
      );
      suggestionsList.push(
        lang === "uz"
          ? "Sanalarni izchil formatda saqlang (masalan, 2021 – 2024)"
          : lang === "ru"
            ? "Используйте единообразный формат дат"
            : "Keep date formatting uniform throughout"
      );
    }

    const finalScore = Math.max(20, Math.min(98, score));
    return { finalScore, detectedKws, issuesList, suggestionsList };
  };

  const handleCheck = async () => {
    if (!resumeText.trim()) return;
    setIsLoading(true);
    setShowResults(false);

    try {
      // First attempt server-side Gemini ATS analyzer
      const res = await fetch("/api/ai/ats-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.overallScore !== undefined) {
          setDynamicScore(data.overallScore);
          setSummaryText(data.summary || "");
          if (Array.isArray(data.missingKeywords)) {
            const serverKws = [
              ...(data.strengths || []).map((s: string) => ({ word: s, found: true })),
              ...data.missingKeywords.map((k: string) => ({ word: k, found: false })),
            ].slice(0, 10);
            if (serverKws.length > 0) setAnalyzedKeywords(serverKws);
          }
          if (Array.isArray(data.criticalFixes) && data.criticalFixes.length > 0) {
            setDetectedIssues(data.criticalFixes);
          }
          if (
            Array.isArray(data.improvementSuggestions) &&
            data.improvementSuggestions.length > 0
          ) {
            setActionableSuggestions(data.improvementSuggestions);
          }
          setIsLoading(false);
          setShowResults(true);
          return;
        }
      }
    } catch (e) {
      console.warn("ATS server analyzer offline, using comprehensive local engine:", e);
    }

    // Run comprehensive local ATS heuristic calculation
    await new Promise((r) => setTimeout(r, 600));
    const analysis = runLocalAtsAnalysis(resumeText);
    setDynamicScore(analysis.finalScore);
    setAnalyzedKeywords(analysis.detectedKws);
    setDetectedIssues(analysis.issuesList.length > 0 ? analysis.issuesList : defaultIssues);
    setActionableSuggestions(
      analysis.suggestionsList.length > 0 ? analysis.suggestionsList : defaultSuggestions
    );
    setSummaryText(
      analysis.finalScore >= 80
        ? lang === "uz"
          ? "Ajoyib natija! Resumeyingiz ATS filtrlari va botlaridan 90%+ ehtimollik bilan muvaffaqiyatli o'tadi."
          : "Отличный результат! Резюме успешно пройдет ATS фильтры."
        : defaultScoreDesc
    );

    setIsLoading(false);
    setShowResults(true);
  };

  const handleSample = () => {
    setResumeText(sampleResume);
    setShowResults(false);
  };

  const handleReset = () => {
    setResumeText("");
    setShowResults(false);
  };

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Hero */}
      <div className="border-border relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-purple-500/10">
              <ShieldCheck className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest text-violet-400 uppercase">
                {t.atsFeature}
              </div>
              <h1 className="text-foreground text-2xl font-bold">{t.atsTitle}</h1>
            </div>
          </div>
          <p className="text-foreground-secondary max-w-2xl">{t.atsDesc}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="border-border bg-surface-elevated rounded-2xl border p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-400" />
                <span className="text-foreground text-sm font-semibold">{t.pasteResume}</span>
              </div>
              <button
                onClick={handleSample}
                className="border-border text-foreground-secondary hover:text-foreground rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-white/20"
              >
                {t.useSample}
              </button>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={t.atsPlaceholder}
              rows={14}
              className="border-border bg-surface-elevated text-foreground w-full resize-none rounded-xl border px-4 py-3 text-sm placeholder-slate-500 focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 focus:outline-none"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleCheck}
                disabled={!resumeText.trim() || isLoading}
                className="text-foreground flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-2.5 text-sm font-semibold shadow-lg shadow-violet-500/30 transition-all hover:from-violet-400 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> {t.analyzing}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> {t.checkATS}
                  </span>
                )}
              </button>
              <button
                onClick={handleReset}
                className="border-border text-foreground-secondary hover:text-foreground rounded-xl border px-4 py-2.5 text-sm transition-colors"
              >
                {t.reset}
              </button>
            </div>
          </div>

          {/* Results */}
          <div>
            {!showResults && !isLoading && (
              <div className="border-border bg-surface-elevated/40 flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border p-8 text-center">
                <div className="border-border bg-surface-elevated mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
                  <ShieldCheck className="text-foreground-secondary h-8 w-8" />
                </div>
                <p className="text-foreground-secondary text-sm">{t.atsWaiting}</p>
              </div>
            )}

            {isLoading && (
              <div className="border-border bg-surface-elevated flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-2xl border">
                <RefreshCw className="h-10 w-10 animate-spin text-violet-400" />
                <p className="text-foreground-secondary text-sm">{t.atsAnalyzing}</p>
              </div>
            )}

            <AnimatePresence>
              {showResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Score card */}
                  <div className="border-border bg-surface-elevated rounded-2xl border p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                      <CircularProgress
                        score={dynamicScore}
                        label={
                          dynamicScore >= 80
                            ? "ATS Ready"
                            : dynamicScore >= 60
                              ? "Moderate"
                              : t.needsWork
                        }
                      />
                      <div>
                        <div className="text-foreground-secondary mb-1 text-xs font-semibold tracking-widest uppercase">
                          {t.atsScore}
                        </div>
                        <div
                          className={`text-2xl font-bold ${dynamicScore >= 80 ? "text-emerald-400" : dynamicScore >= 60 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {dynamicScore >= 80
                            ? lang === "uz"
                              ? "A'lo daraja (ATS 100%)"
                              : "Отличный результат"
                            : dynamicScore >= 60
                              ? lang === "uz"
                                ? "Yaxshi daraja"
                                : "Хороший уровень"
                              : t.needsWork}
                        </div>
                        <p className="text-foreground-secondary mt-2 text-sm">
                          {summaryText || defaultScoreDesc}
                        </p>
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {t.potentialScore}:{" "}
                          <span className="font-bold">{Math.min(99, dynamicScore + 22)}/100</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-border mt-5 flex justify-end border-t pt-4">
                      <a
                        href="/cv-builder?tab=editor"
                        onClick={() => {
                          try {
                            localStorage.setItem("docnova_ats_checked_text", resumeText);
                          } catch {}
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-95"
                      >
                        CV Builder&apos;da to&apos;g&apos;rilash &rarr;
                      </a>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="border-border bg-surface-elevated rounded-2xl border p-5 backdrop-blur-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-foreground text-sm font-semibold">{t.keywordAnalysis}</h3>
                      <span className="text-foreground-secondary text-xs">
                        Topilgan:{" "}
                        {
                          (analyzedKeywords.length > 0 ? analyzedKeywords : defaultKeywords).filter(
                            (k) => k.found
                          ).length
                        }
                        /{(analyzedKeywords.length > 0 ? analyzedKeywords : defaultKeywords).length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(analyzedKeywords.length > 0 ? analyzedKeywords : defaultKeywords).map(
                        (kw) => (
                          <span
                            key={kw.word}
                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                              kw.found
                                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                : "border-red-400/30 bg-red-400/10 text-red-300"
                            }`}
                          >
                            {kw.found ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {kw.word}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-5">
                    <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                      <XCircle className="h-4 w-4 text-red-400" /> {t.issuesFound} (
                      {(detectedIssues.length > 0 ? detectedIssues : defaultIssues).length})
                    </h3>
                    <div className="space-y-2">
                      {(detectedIssues.length > 0 ? detectedIssues : defaultIssues).map(
                        (issue, i) => (
                          <div key={i} className="flex gap-2.5 text-sm text-slate-300">
                            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                            {issue}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="border-primary/15 bg-primary/5 rounded-2xl border p-5">
                    <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Lightbulb className="text-primary h-4 w-4" /> {t.suggestions}
                    </h3>
                    <div className="space-y-2">
                      {(actionableSuggestions.length > 0
                        ? actionableSuggestions
                        : defaultSuggestions
                      ).map((s, i) => (
                        <div key={i} className="flex gap-2.5 text-sm text-slate-300">
                          <CheckCircle className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
