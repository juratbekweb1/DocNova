import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateGeminiJson } from "@/lib/gemini";
import { trackAIUsage } from "@/lib/limits";
import {
  AmaliyIshFormInput,
  generateDeterministicAmaliyIsh,
  renderAmaliyIshToMarkdown,
} from "@/lib/amaliy-ish-generator";

export const maxDuration = 60;

interface AiAmaliyEnrichment {
  introduction?: {
    relevance?: string;
    purpose?: string;
    tasks?: string[];
    objectAndSubject?: string;
    methods?: string[];
  };
  theoreticalSummary?: string;
  problem1Condition?: string;
  problem1Interpretation?: string;
  problem1Recommendations?: string[];
  problem2Condition?: string;
  problem2Interpretation?: string;
  problem2Recommendations?: string[];
  problem3Condition?: string;
  problem3Interpretation?: string;
  problem3Recommendations?: string[];
  problem4Condition?: string;
  problem4Interpretation?: string;
  problem4Recommendations?: string[];
  conclusions?: string[];
  practicalRecommendations?: string[];
  references?: string[];
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<AmaliyIshFormInput> & {
      forceAi?: boolean;
      useAi?: boolean;
    };

    const subject = String(body.subject || "").trim();
    const topic = String(body.topic || "").trim();

    if (!subject && !topic) {
      return NextResponse.json(
        {
          error: "Iltimos, fan nomi va amaliy ish mavzusini kiriting.",
        },
        { status: 400 }
      );
    }

    const rawCount = Number(body.problemCount || 4);
    const problemCount: 2 | 3 | 4 = rawCount === 2 ? 2 : rawCount === 3 ? 3 : 4;

    const cleanInput: Partial<AmaliyIshFormInput> = {
      university: String(body.university || "Toshkent to'qimachilik va yengil sanoat instituti")
        .trim()
        .slice(0, 220),
      department: String(body.department || "Iqtisodiyot va raqamli texnologiyalar kafedrasi")
        .trim()
        .slice(0, 220),
      subject: (subject || "Iqtisodiyotda ma'lumotlar tahlili").slice(0, 200),
      topic: (topic || "Bir omilli va ikki omilli dispersion tahlil").slice(0, 250),
      situation: String(body.situation || "Ishlab chiqarish smenalari va xodimlar so'rovi")
        .trim()
        .slice(0, 300),
      variant: String(body.variant || "18-variant")
        .trim()
        .slice(0, 40),
      problemCount,
      studentName: String(body.studentName || "Karimov Sardorbek Anvar o'g'li")
        .trim()
        .slice(0, 150),
      studentGroup: String(body.studentGroup || "IQT-22-18")
        .trim()
        .slice(0, 60),
      teacherName: String(body.teacherName || "dots. Raximov B.SH.")
        .trim()
        .slice(0, 150),
      city: String(body.city || "Toshkent")
        .trim()
        .slice(0, 80),
      year: String(body.year || new Date().getFullYear())
        .trim()
        .slice(0, 10),
      language: body.language === "ru" || body.language === "en" ? body.language : "uz",
      customProblemText: body.customProblemText
        ? String(body.customProblemText).trim().slice(0, 2000)
        : undefined,
    };

    const document = generateDeterministicAmaliyIsh(cleanInput);

    // AI enrichment for custom topics/subjects/languages, non-default variants, or when explicitly requested
    const isDefault18 =
      (cleanInput.language || "uz") === "uz" &&
      Boolean(cleanInput.variant?.toLowerCase().includes("18")) &&
      cleanInput.topic?.toLowerCase().includes("bir omilli va ikki omilli dispersion tahlil") &&
      cleanInput.situation?.toLowerCase().includes("ishlab chiqarish smenalari") &&
      !cleanInput.customProblemText &&
      !body.forceAi &&
      !body.useAi;

    if (!isDefault18) {
      try {
        const langName =
          cleanInput.language === "ru"
            ? "rus tilida (на русском языке)"
            : cleanInput.language === "en"
              ? "ingliz tilida (in English)"
              : "o'zbek tilida";

        const combinedContext = `${cleanInput.subject || ""} ${cleanInput.topic || ""} ${cleanInput.situation || ""} ${cleanInput.customProblemText || ""}`;
        const isAnovaDomain =
          /dispersion|anova|fisher|smena|smene|lsd|ekonometrika|statistika/i.test(combinedContext);

        const promptRoleHeader = isAnovaDomain
          ? `Siz O‘zbekiston Respublikasi Oliy ta’lim, fan va innovatsiyalar vazirligi davlat ta’lim standartlari (Toshkent davlat iqtisodiyot universiteti — TDIU, Toshkent to‘qimachilik va yengil sanoat instituti — TTESI, O‘zbekiston Milliy universiteti — O‘zMU) bo‘yicha ekonometrika va iqtisodiy-statistik modellashtirish kafedrasi bosh professori hamda akademik muharririsiz.

Vazifangiz: Talabaning "Ekonometrika / Ma'lumotlar tahlili / Statistika" fani bo‘yicha amaliy ishini haqiqiy oliy bahoga (A/90-100 ball) loyiq, OTM kafedrasi talablariga to'liq javob beruvchi professional akademik tahlillar bilan ${langName} boyitish.`
          : `Siz O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi davlat ta'lim standartlari bo'yicha "${cleanInput.subject}" fani yetakchi professori hamda akademik muharririsiz.

Vazifangiz: Barcha matnlar, ${problemCount} ta amaliy masala sharti, tahliliy talqinlar, xulosalar va adabiyotlarni FAQAT VA FAQAT "${cleanInput.topic}" mavzusi va "${cleanInput.subject}" fani doirasida ${langName} professional tarzda tayyorlab bering (dispersion tahlil yoki begona fan atamalarini aralashtirmang!).`;

        const domainRequirements = isAnovaDomain
          ? `QAT'IY AKADEMIK TALABLAR:
1. Akademik ilmiy uslub: Matn rasmiy-ilmiy tilda, O'zbekiston Respublikasining me'yoriy-huquqiy bazasi (PF-6079 "Raqamli O'zbekiston – 2030" strategiyasi) va real ishlab chiqarish/iqtisodiyot korxonalari (to'qimachilik va yengil sanoat klasterlari, mashinasozlik, agrologistika, farmatsevtika, tijorat banklari) amaliyotiga tayansin.
2. Kirish qismi (Introduction):
   - Mavzuning dolzarbligi (O'zbekiston korxonalarida mahsulot sifatini boshqarish va mehnat unumdorligini oshirishda statistik modellashtirishning ahamiyati, 3-4 jumla);
   - Amaliy ishning maqsadi (dispersion tahlil va MS Excel vositalarida omillarning natijaviy ko'rsatkichga ta'sirini baholash);
   - 5 ta aniq vazifasi (boshlang'ich ma'lumotlarni shakllantirish, gipotezalarni tekshirish, ANOVA jadvalini qurish, Fisher mezonini hisoblash, boshqaruv qarorlarini ishlab chiqish);
   - Tadqiqot obyekti va predmeti;
   - Qo'llanilgan ilmiy metodlar va dasturiy vositalar (One-Way & Two-Way ANOVA, Fisher F-test, LSD juftlik taqqoslash, MS Excel Data Analysis).
3. Nazariy-uslubiy asoslar: Dispersion tahlilning mohiyati, dispersiyalarning additivlik qoidasi (SS_total = SS_factor + SS_error), erkinlik darajalari (df), determinatsiya koeffitsiyenti (eta^2) va Fisher LSD chegarasining matematik ma'nosini ilmiy asoslab bering.
4. Masalalar sharti va iqtisodiy talqini: Har bir masala uchun real o'quv qo'llanmalari darajasidagi mazmunli shart, har bir smena/guruh bo'yicha oraliq xulosa, Fisher mezoni asosidagi qat'iy statistik qaror va korxona rahbariyati uchun 2 tadan amaliy tavsiya bering.
5. Yakuniy xulosalar va tavsiyalar: Barcha ${problemCount} ta masala bo'yicha ilmiy-amaliy umumlashtiruvchi xulosalar hamda korxona samaradorligini oshirish bo'yicha kamida 3 ta amaliy boshqaruv tavsiyasi bering.
6. Adabiyotlar ro'yxati: O'zbekiston OTMlarida amalda qo'llanilayotgan darsliklar (Shodiyev, Berkinov, Xodiyev, Xurramov, Alimov), xorijiy adabiyotlar (Levin & Rubin, Montgomery) va normativ hujjatlardan 5-6 ta manba keltiring.

Faqat quyidagi toza JSON formatida javob bering (hech qanday qo'shimcha matnsiz):
{
  "introduction": {
    "relevance": "Mavzuning dolzarbligi matni",
    "purpose": "Amaliy ishning aniq maqsadi",
    "tasks": ["1-vazifa", "2-vazifa", "3-vazifa", "4-vazifa", "5-vazifa"],
    "objectAndSubject": "Tadqiqot obyekti: ...; Tadqiqot predmeti: ...",
    "methods": ["Dispersion tahlil (ANOVA)", "Fisher F-test va LSD kriteriysi", "MS Excel Data Analysis paketi"]
  },
  "theoreticalSummary": "Dispersion tahlilning nazariy va uslubiy asoslari bo'yicha ilmiy xulosa (1-2 abzas)",
  "problem1Condition": "1-masala sharti (bir omilli tahlil, 3 guruh x 5 kuzatuv, korxona smenalari misolida)",
  "problem1Interpretation": "1-masala yakuniy iqtisodiy va statistik talqini",
  "problem1Recommendations": ["1-tavsiya", "2-tavsiya"],
  "problem2Condition": "2-masala sharti (yig'ma statistikalar bo'yicha tahlil, teng bo'lmagan 3 ta sex)",
  "problem2Interpretation": "2-masala talqini",
  "problem2Recommendations": ["1-tavsiya", "2-tavsiya"],
  "problem3Condition": "3-masala sharti (ikki omilli tahlil: smena x malaka toifasi)",
  "problem3Interpretation": "3-masala talqini",
  "problem3Recommendations": ["1-tavsiya", "2-tavsiya"],
  "problem4Condition": "4-masala sharti (ANOVA jadvalini to'ldirish va Fisher LSD juftlik tahlili)",
  "problem4Interpretation": "4-masala talqini",
  "problem4Recommendations": ["1-tavsiya", "2-tavsiya"],
  "conclusions": ["1-ilmiy xulosa", "2-ilmiy xulosa", "3-ilmiy xulosa", "4-ilmiy xulosa"],
  "practicalRecommendations": ["1-boshqaruv tavsiyasi", "2-boshqaruv tavsiyasi", "3-boshqaruv tavsiyasi"],
  "references": [
    "1. Darslik / Manba 1",
    "2. Darslik / Manba 2",
    "3. Darslik / Manba 3",
    "4. Darslik / Manba 4",
    "5. Darslik / Manba 5"
  ]
}`
          : `QAT'IY AKADEMIK TALABLAR:
1. Akademik ilmiy uslub: Barcha matnlar FAQAT "${cleanInput.subject}" fani va "${cleanInput.topic}" mavzusiga bag'ishlangan rasmiy-ilmiy uslubda yozilsin (boshqa begona fan yoki dispersion/ANOVA shablonlariga chalg'ish taqiqlanadi).
2. Kirish qismi (Introduction):
   - Mavzuning dolzarbligi ("${cleanInput.topic}" mavzusining "${cleanInput.subject}" fanidagi nazariy va amaliy ahamiyati, 3-4 jumla);
   - Amaliy ishning aniq maqsadi;
   - 5 ta mantiqiy ketma-ket vazifa;
   - Tadqiqot obyekti va predmeti (aynan "${cleanInput.topic}" bo'yicha);
   - Sohaga xos qo'llanilgan ilmiy metodlar va tahlil vositalari.
3. Nazariy-uslubiy asoslar: "${cleanInput.topic}" mavzusining asosiy qonuniyatlari, formulalari, tushunchalari va hisoblash/tahlil algoritmini ilmiy asoslab bering.
4. Masalalar sharti va amaliy talqini: Har bir (${problemCount} tagacha) masala uchun "${cleanInput.topic}" mavzusiga xos real topshiriq sharti, yechim mantiqining chuqur talqini va 2 tadan amaliy tavsiya bering.
5. Yakuniy xulosalar va adabiyotlar: "${cleanInput.subject}" fani bo'yicha nufuzli darsliklar, ilmiy maqolalar va me'yoriy manbalardan 5-6 ta aniq adabiyot keltiring.

Faqat quyidagi toza JSON formatida javob bering (hech qanday qo'shimcha matnsiz):
{
  "introduction": {
    "relevance": "Mavzuning dolzarbligi matni",
    "purpose": "Amaliy ishning aniq maqsadi",
    "tasks": ["1-vazifa", "2-vazifa", "3-vazifa", "4-vazifa", "5-vazifa"],
    "objectAndSubject": "Tadqiqot obyekti: ...; Tadqiqot predmeti: ...",
    "methods": ["1-ilmiy metod", "2-tahlil usuli", "3-amaliy vosita"]
  },
  "theoreticalSummary": "${cleanInput.topic} mavzusining nazariy va uslubiy asoslari (1-2 abzas)",
  "problem1Condition": "1-masala/topshiriq sharti (${cleanInput.topic} bo'yicha)",
  "problem1Interpretation": "1-masala yechimi va tahliliy talqini",
  "problem1Recommendations": ["1-tavsiya", "2-tavsiya"],
  "problem2Condition": "2-masala/topshiriq sharti",
  "problem2Interpretation": "2-masala yechimi va tahliliy talqini",
  "problem2Recommendations": ["1-tavsiya", "2-tavsiya"],
  "problem3Condition": "3-masala/topshiriq sharti",
  "problem3Interpretation": "3-masala yechimi va tahliliy talqini",
  "problem3Recommendations": ["1-tavsiya", "2-tavsiya"],
  "problem4Condition": "4-masala/topshiriq sharti",
  "problem4Interpretation": "4-masala yechimi va tahliliy talqini",
  "problem4Recommendations": ["1-tavsiya", "2-tavsiya"],
  "conclusions": ["1-ilmiy xulosa", "2-ilmiy xulosa", "3-ilmiy xulosa", "4-ilmiy xulosa"],
  "practicalRecommendations": ["1-amaliy tavsiya", "2-amaliy tavsiya", "3-amaliy tavsiya"],
  "references": [
    "1. Darslik / Manba 1",
    "2. Darslik / Manba 2",
    "3. Darslik / Manba 3",
    "4. Darslik / Manba 4",
    "5. Darslik / Manba 5"
  ]
}`;

        const prompt = `${promptRoleHeader}

AMALIY ISH PARAMETRLARI:
- OTM: "${cleanInput.university}"
- Kafedra: "${cleanInput.department}"
- Fan: "${cleanInput.subject}"
- Mavzu: "${cleanInput.topic}"
- Vaziyat / keys: "${cleanInput.situation}"
- Variant: "${cleanInput.variant}"
- Masalalar soni: ${problemCount}
- Til: "${cleanInput.language || "uz"}"
${cleanInput.customProblemText ? `- Talaba kiritgan / rasmdan yuklangan masala va talablar (HAMMASINI SAQLA VA YORIT):\n"""\n${cleanInput.customProblemText}\n"""` : ""}

${domainRequirements}`;

        const aiRes = await generateGeminiJson<AiAmaliyEnrichment>(prompt, {
          temperature: 0.3,
          maxOutputTokens: 2500,
          timeoutMs: 16_000,
        });

        const data = aiRes.data;
        if (data) {
          if (data.introduction?.relevance) {
            document.introduction.relevance = data.introduction.relevance;
          }
          if (data.introduction?.purpose) {
            document.introduction.purpose = data.introduction.purpose;
          }
          if (Array.isArray(data.introduction?.tasks) && data.introduction.tasks.length >= 2) {
            document.introduction.tasks = data.introduction.tasks;
          }
          if (data.introduction?.objectAndSubject) {
            document.introduction.objectAndSubject = data.introduction.objectAndSubject;
          }
          if (Array.isArray(data.introduction?.methods) && data.introduction.methods.length >= 2) {
            document.introduction.methods = data.introduction.methods;
          }
          if (data.theoreticalSummary) {
            document.theorySection.paragraphs[0] = data.theoreticalSummary;
          }
          if (data.problem1Condition && document.problems[0]) {
            document.problems[0].condition = data.problem1Condition;
          }
          if (data.problem1Interpretation && document.problems[0]) {
            document.problems[0].stepE.economicInterpretation = data.problem1Interpretation;
          }
          if (
            Array.isArray(data.problem1Recommendations) &&
            data.problem1Recommendations.length > 0 &&
            document.problems[0]
          ) {
            document.problems[0].stepE.recommendations = data.problem1Recommendations;
          }
          if (data.problem2Condition && document.problems[1]) {
            document.problems[1].condition = data.problem2Condition;
          }
          if (data.problem2Interpretation && document.problems[1]) {
            document.problems[1].stepE.economicInterpretation = data.problem2Interpretation;
          }
          if (
            Array.isArray(data.problem2Recommendations) &&
            data.problem2Recommendations.length > 0 &&
            document.problems[1]
          ) {
            document.problems[1].stepE.recommendations = data.problem2Recommendations;
          }
          if (data.problem3Condition && document.problems[2]) {
            document.problems[2].condition = data.problem3Condition;
          }
          if (data.problem3Interpretation && document.problems[2]) {
            document.problems[2].stepE.economicInterpretation = data.problem3Interpretation;
          }
          if (
            Array.isArray(data.problem3Recommendations) &&
            data.problem3Recommendations.length > 0 &&
            document.problems[2]
          ) {
            document.problems[2].stepE.recommendations = data.problem3Recommendations;
          }
          if (data.problem4Condition && document.problems[3]) {
            document.problems[3].condition = data.problem4Condition;
          }
          if (data.problem4Interpretation && document.problems[3]) {
            document.problems[3].stepE.economicInterpretation = data.problem4Interpretation;
          }
          if (
            Array.isArray(data.problem4Recommendations) &&
            data.problem4Recommendations.length > 0 &&
            document.problems[3]
          ) {
            document.problems[3].stepE.recommendations = data.problem4Recommendations;
          }
          if (Array.isArray(data.conclusions) && data.conclusions.length >= 2) {
            document.summarySection.conclusions = data.conclusions;
          }
          if (
            Array.isArray(data.practicalRecommendations) &&
            data.practicalRecommendations.length >= 2
          ) {
            document.summarySection.practicalRecommendations = data.practicalRecommendations;
          }
          if (Array.isArray(data.references) && data.references.length >= 3) {
            document.references = data.references;
          }
          document.markdown = renderAmaliyIshToMarkdown(document);
        }
      } catch {
        // Fallback to deterministic mathematical document seamlessly
      }
    }

    // Track usage if logged in (non-blocking)
    try {
      const session = await getServerSession(authOptions).catch(() => null);
      if (session?.user?.id) {
        await trackAIUsage({
          userId: session.user.id,
          plan: "FREE",
          feature: "AMALIY_ISH",
          status: "SUCCESS",
          requestDurationMs: Date.now() - startTime,
        });
      }
    } catch {
      // Ignore tracking errors
    }

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error("[AMALIY_ISH_API_ERR]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Amaliy ish generatsiyasida xatolik yuz berdi.",
      },
      { status: 500 }
    );
  }
}
