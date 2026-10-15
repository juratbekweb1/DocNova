import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface SlideItem {
  slideNumber: number;
  type:
    | "title"
    | "problem"
    | "goals"
    | "methodology"
    | "content"
    | "comparison"
    | "roadmap"
    | "conclusion"
    | "qa";
  title: string;
  subtitle?: string;
  badge?: string;
  bulletPoints: string[];
  speakerNotes: string;
  highlightMetric?: string;
}

export interface PresentationResponse {
  success: boolean;
  topic: string;
  style: "academic" | "modern" | "minimalist";
  slidesCount: number;
  language: string;
  slides: SlideItem[];
  generatedWith: string;
}

const GEMINI_MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-pro"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      sourceText = "",
      slidesCount = 10,
      style = "academic",
      language = "uz",
      presentationType = "defense",
    } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return NextResponse.json({ error: "Mavzu kiritilishi shart." }, { status: 400 });
    }

    const count = Math.min(Math.max(Number(slidesCount) || 10, 6), 20);
    const cleanTopic = topic.trim();
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `
Siz oliy ta'lim va ilmiy konferensiyalar uchun professional prezentatsiyalar (slaydlar) tayyorlovchi yetakchi ekspertsiz.
Quyidagi parametrlarga asosan akademik taqdimot (PowerPoint) slaydlar to'plamini tuzing:

MAVZU: "${cleanTopic}"
QO'SHIMCHA MATN / KURSER ISHI KONTENTI: ${sourceText ? `"${sourceText.slice(0, 3000)}"` : "Mavzu asosida to'liq ilmiy apparat bilan tuzilsin"}
SLAYDLAR SONI: ${count} ta slayd
DIZAYN USLUBI: ${style} (academic: qat'iy akademik, modern: zamonaviy texnologik, minimalist: lakonik aniq)
TAQDIMOT TURI: ${presentationType} (Himoya / Diplom ishi / Konferensiya)
TIL: ${language === "ru" ? "Rus tili" : language === "uz-cyrl" ? "O'zbek tili (kirill)" : language === "en" ? "Ingliz tili" : "O'zbek tili (lotin)"}

HAR BIR SLAYD UCHUN TALABLAR:
1. "slideNumber": 1 dan ${count} gacha ketma-ketlik.
2. "type": "title" (1-slayd), "problem" (2-slayd), "goals", "methodology", "content", "comparison", "roadmap", "conclusion", "qa" (oxirgi savol-javob slaydi).
3. "title": Qisqa va jarangdor ilmiy sarlavha (maksimal 7-9 so'z).
4. "subtitle": Kichik yo'naltiruvchi sarlavha yoki modul nomi.
5. "badge": Kichik toifa belgisi (masalan: "01 / Kirish", "Nazariy apparat", "Amaliy tahlil", "Tavsiyalar").
6. "bulletPoints": Aniq 3 yoki 4 ta asosiy tezis (har bir tezis bitta qatorda, ixcham va tushunarli).
7. "speakerNotes": Ma'ruzachi (talaba) ushbu slayd davomida komissiya oldida 1-1.5 daqiqa davomida so'zlaydigan to'liq, ravon nutq matni (Speaker Speech).
8. "highlightMetric": Muhim statistik ko'rsatkich yoki ilmiy natija xulosasi (masalan: "+28% samaradorlik", "100% GOST moslik", "3 ta asosiy yechim").

JAVOBNI FAQAT QUYIDAGI VALID JSON FORMATIDA BERING (boshqa hech qanday so'z yoki markdown fensingsiz):
{
  "slides": [
    {
      "slideNumber": 1,
      "type": "title",
      "title": "${cleanTopic}",
      "subtitle": "Ilmiy-amaliy tadqiqot natijalari va takliflar",
      "badge": "Taqdimot",
      "bulletPoints": [
        "Tadqiqot maqsadi va dolzarbligi",
        "Amaliy tahliliy natijalar",
        "Ishlab chiqilgan tavsiyalar va yechimlar"
      ],
      "speakerNotes": "Hurmatli Davlat attestatsiya komissiyasi a'zolari! E'tiboringizga '${cleanTopic}' mavzusidagi ilmiy ishim taqdimotini havola etishga ijozat bergaysiz...",
      "highlightMetric": "2026-yil"
    }
  ]
}
`;

      for (const modelName of GEMINI_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 8192,
            },
          });

          const rawText = result.response.text();
          const cleanJson = rawText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

          const parsed = JSON.parse(cleanJson);
          if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            const normalizedSlides: SlideItem[] = parsed.slides.map(
              (s: Record<string, unknown>, idx: number) => ({
                slideNumber: idx + 1,
                type: (typeof s.type === "string" ? s.type : "content") as SlideItem["type"],
                title: typeof s.title === "string" ? s.title : `Slayd ${idx + 1}`,
                subtitle: typeof s.subtitle === "string" ? s.subtitle : undefined,
                badge: typeof s.badge === "string" ? s.badge : `0${idx + 1} / Modul`,
                bulletPoints: Array.isArray(s.bulletPoints)
                  ? s.bulletPoints.map((b) => String(b))
                  : ["Asosiy tezis va ilmiy asoslar"],
                speakerNotes:
                  typeof s.speakerNotes === "string"
                    ? s.speakerNotes
                    : "Ushbu slayd davomida asosiy e'tiborni tadqiqot natijalariga qaratish tavsiya etiladi.",
                highlightMetric:
                  typeof s.highlightMetric === "string" ? s.highlightMetric : undefined,
              })
            );

            return NextResponse.json({
              success: true,
              topic: cleanTopic,
              style,
              slidesCount: normalizedSlides.length,
              language,
              slides: normalizedSlides,
              generatedWith: modelName,
            } satisfies PresentationResponse);
          }
        } catch (err) {
          console.warn(`[GEMINI_PRESENTATION_WARN] Model ${modelName} failed:`, err);
        }
      }
    }

    // High-grade fallback engine
    const fallbackSlides = generateFallbackSlides(cleanTopic, count, language, style);

    return NextResponse.json({
      success: true,
      topic: cleanTopic,
      style,
      slidesCount: fallbackSlides.length,
      language,
      slides: fallbackSlides,
      generatedWith: "docnova-presentation-engine",
    } satisfies PresentationResponse);
  } catch (error) {
    console.error("[GENERATE_PRESENTATION_ERROR]", error);
    return NextResponse.json(
      { error: "Prezentatsiya yaratishda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}

function generateFallbackSlides(
  topic: string,
  count: number,
  lang: string,
  _style: "academic" | "modern" | "minimalist"
): SlideItem[] {
  const isRu = lang === "ru";
  const isEn = lang === "en";

  const templateSlides: SlideItem[] = [
    {
      slideNumber: 1,
      type: "title",
      title: topic,
      subtitle: isRu
        ? "Научно-исследовательская работа и практические рекомендации"
        : isEn
          ? "Academic Research and Practical Recommendations"
          : "Ilmiy-tadqiqot ishi natijalari va takliflar",
      badge: isRu ? "Титульный слайд" : isEn ? "Title Slide" : "Titul slaydi",
      bulletPoints: isRu
        ? [
            "Актуальность выбранной темы в современных условиях",
            "Теоретические и методологические основы исследования",
            "Практический анализ и авторские предложения",
          ]
        : isEn
          ? [
              "Significance of the investigated problem",
              "Theoretical framework and methodology",
              "Practical analytical evaluation and proposals",
            ]
          : [
              "Mavzuning zamonaviy sharoitdagi dolzarbligi va zarurati",
              "Tadqiqotning nazariy va uslubiy apparati",
              "Amaliy tahliliy natijalar va ilmiy xulosalar",
            ],
      speakerNotes: isRu
        ? `Уважаемый председатель и члены государственной комиссии! Вашему вниманию представляется научно-исследовательская работа на тему "${topic}". В ходе доклада будут освещены ключевые результаты проведенного анализа.`
        : isEn
          ? `Distinguished members of the examination board! Allow me to present our research findings on "${topic}". Today we will outline the problem, empirical findings, and strategic solutions.`
          : `Hurmatli Davlat attestatsiya komissiyasi a'zolari! E'tiboringizga "${topic}" mavzusidagi ilmiy ishim taqdimotini havola etishga ijozat bergaysiz. Mazkur ishda olingan asosiy xulosalar va takliflar e'tiboringizga havola qilinadi.`,
      highlightMetric: "2026",
    },
    {
      slideNumber: 2,
      type: "problem",
      title: isRu
        ? "Актуальность и постановка проблемы"
        : isEn
          ? "Research Problem & Relevance"
          : "Mavzuning dolzarbligi va muammoning qo'yilishi",
      subtitle: isRu
        ? "Обоснование необходимости исследования"
        : isEn
          ? "Core Rationale"
          : "Tadqiqotning asosiy sababi",
      badge: "01 / Dolzarblik",
      bulletPoints: isRu
        ? [
            "Быстрая трансформация отрасли требует внедрения современных научно обоснованных подходов",
            "Недостаточная проработанность существующих методик в локальной практике",
            "Необходимость снижения издержек и повышение устойчивости системы",
          ]
        : isEn
          ? [
              "Rapid global shifts require evidence-based innovative frameworks",
              "Existing mechanisms exhibit operational bottlenecks and knowledge gaps",
              "High strategic demand for optimized resource allocation and stability",
            ]
          : [
              "Sohaning jadal rivojlanishi yangi ilmiy-amaliy yondashuvlarni joriy etishni talab etmoqda",
              "Mavjud mexanizmlardagi nomutanosibliklar va amaliyotdagi muammolar tahlili",
              "Resurslardan foydalanish samaradorligini keskin oshirish zarurati",
            ],
      speakerNotes: isRu
        ? `Исследуемая тема чрезвычайно актуальна, так как традиционные механизмы не в полной мере отвечают современным требованиям. Наша цель — устранить выявленные барьеры.`
        : isEn
          ? `The significance of this topic is underscored by emerging challenges in the field, necessitating fresh empirical and operational solutions.`
          : `Mavzuning dolzarbligi shundaki, an'anaviy mexanizmlar bugungi o'zgarishlar talabiga to'liq javob bermayapti. Shu bois tizimli muammolarni bartaraf etish talab qilinadi.`,
      highlightMetric: "+35% zarurat",
    },
    {
      slideNumber: 3,
      type: "goals",
      title: isRu
        ? "Цели и задачи исследования"
        : isEn
          ? "Research Goals and Objectives"
          : "Tadqiqot maqsadi va vazifalari",
      subtitle: isRu ? "Научный аппарат работы" : isEn ? "Key Milestones" : "Ilmiy apparat",
      badge: "02 / Maqsad",
      bulletPoints: isRu
        ? [
            "Цель: разработка практических механизмов совершенствования исследуемого процесса",
            "Задача 1: систематизация теоретических концепций отечественных и зарубежных авторов",
            "Задача 2: проведение детального количественного и качественного анализа текущего состояния",
            "Задача 3: формулирование обоснованных стратегических рекомендаций",
          ]
        : isEn
          ? [
              "Goal: Design a coherent framework to enhance operational efficiency",
              "Task 1: Systematize theoretical foundations and global academic literature",
              "Task 2: Perform empirical quantitative and qualitative state diagnostics",
              "Task 3: Formulate actionable strategic recommendations",
            ]
          : [
              "Asosiy maqsad: o'rganilayotgan jarayon samaradorligini oshirish mexanizmlarini ishlab chiqish",
              "1-vazifa: mavzuga doir ilmiy-nazariy qarashlar va xorijiy tajribani tizimlashtirish",
              "2-vazifa: joriy holat bo'yicha amaliy, statistik va qiyosiy tahlillarni o'tkazish",
              "3-vazifa: aniqlangan muammolar yuzasidan ilmiy asoslangan takliflar berish",
            ],
      speakerNotes: isRu
        ? `Перед нами стояла цель разработать прикладные рекомендации. Для ее достижения были решены три фундаментальные задачи.`
        : isEn
          ? `To achieve our overarching research goal, we formulated three consecutive milestones covering theory, analytics, and strategy.`
          : `Belgilangan maqsadga erishish uchun bir-biriga uzviy bog'liq bo'lgan uchta asosiy ilmiy va amaliy vazifalar muvaffaqiyatli hal etildi.`,
      highlightMetric: "3 ta vazifa",
    },
    {
      slideNumber: 4,
      type: "methodology",
      title: isRu
        ? "Методология и объект исследования"
        : isEn
          ? "Methodology & Research Scope"
          : "Tadqiqot obyekti va metodologiyasi",
      subtitle: isRu ? "Инструментарий анализа" : isEn ? "Analytical Tools" : "Tahlil usullari",
      badge: "03 / Metodologiya",
      bulletPoints: isRu
        ? [
            "Объект: ключевые структуры и процессы в рамках выбранной отрасли",
            "Предмет: социально-экономические, правовые и организационные отношения",
            "Методы: компаративный анализ, статистическое моделирование, SWOT-анализ",
            "Информационная база: официальные статистические сборники и нормативные акты",
          ]
        : isEn
          ? [
              "Object: Core functional nodes and structural units under review",
              "Subject: Interconnected legal, economic, and management workflows",
              "Methods: Comparative synthesis, empirical data regression, SWOT analysis",
              "Data source: National statistical yearbooks and peer-reviewed journals",
            ]
          : [
              "Tadqiqot obyekti: mazkur soha doirasidagi asosiy tuzilmalar va jarayonlar majmui",
              "Tadqiqot predmeti: ijtimoiy-iqtisodiy, huquqiy va tashkiliy munosabatlar",
              "Qo'llanilgan usullar: qiyosiy tahlil, statistik guruhlash, induksiya va deduksiya, SWOT tahlili",
              "Axborot bazasi: rasmiy davlat statistikasi va normativ-huquqiy hujjatlar",
            ],
      speakerNotes: isRu
        ? `Методологическая база работы сформирована на принципах комплексности, объективности и научного реализма.`
        : isEn
          ? `Our methodology strictly conforms to rigorous academic standards, guaranteeing high analytical objectivity.`
          : `Metodologiya ishonchliligi kompleks yondashuv va qiyosiy tahlil usullarining to'g'ri tanlanganligi bilan ta'minlangan.`,
      highlightMetric: "100% ob'yektiv",
    },
    {
      slideNumber: 5,
      type: "content",
      title: isRu
        ? "Теоретические концепции и мировой опыт"
        : isEn
          ? "Theoretical Foundations & Global Benchmarks"
          : "Nazariy konsepsiyalar va xorij tajribasi",
      subtitle: isRu
        ? "Сравнительный международный обзор"
        : isEn
          ? "International Synthesis"
          : "Xalqaro qiyosiy tahlil",
      badge: "04 / Nazariya",
      bulletPoints: isRu
        ? [
            "Ведущие научные школы подчеркивают необходимость интеграции цифровых инструментов",
            "Практика передовых государств подтверждает рост производительности на 20-35%",
            "Адаптация зарубежных практик требует учета национальной специфики",
          ]
        : isEn
          ? [
              "Academic literature highlights the necessity of structured digitization and agile governance",
              "Advanced economies show sustainable productivity improvements (+20-35%)",
              "Direct transplantation requires careful localization and compliance adjustments",
            ]
          : [
              "Yetakchi ilmiy maktablar jarayonlarni raqamlashtirish va optimallashtirish zarurligini uqtiradi",
              "Rivojlangan davlatlar tajribasi unumdorlikning 20-35 foizga oshishini isbotlagan",
              "Xorijiy modellarni to'g'ridan-to'g'ri emas, milliy iqtisodiyot xususiyatlarini inobatga olgan holda qo'llash zarur",
            ],
      speakerNotes: isRu
        ? `Анализ мирового опыта показывает, что наиболее успешными являются гибридные модели, адаптированные под локальный рынок.`
        : isEn
          ? `Global benchmarking underscores that hybrid, localized adoption strategies achieve superior long-term outcomes.`
          : `Xorijiy ilg'or tajribani o'rganish shuni ko'rsatdiki, mahalliy bozorga moslashtirilgan gibrid modellar eng yuqori samaradorlikni beradi.`,
      highlightMetric: "+25% o'sish",
    },
    {
      slideNumber: 6,
      type: "comparison",
      title: isRu
        ? "Анализ текущего состояния и ключевые показатели"
        : isEn
          ? "State of the Art & Empirical Analytics"
          : "Joriy holat tahlili va asosiy ko'rsatkichlar",
      subtitle: isRu
        ? "Эмпирические данные за последние 3 года"
        : isEn
          ? "3-Year Empirical Overview"
          : "So'nggi yillardagi tahlil",
      badge: "05 / Amaliy tahlil",
      bulletPoints: isRu
        ? [
            "Динамика основных индикаторов демонстрирует устойчивый положительный тренд",
            "Выявлена неравномерность распределения нагрузки по отдельным сегментам",
            "Потенциал роста за счет оптимизации внутренних процессов оценивается в 40%",
          ]
        : isEn
          ? [
              "Longitudinal trends demonstrate steady year-over-year operational expansion",
              "Disproportionate workload distributions identified across subsidiary units",
              "Optimization potential via workflow automation is empirically estimated at 40%",
            ]
          : [
              "Asosiy ko'rsatkichlar dinamikasida barqaror ijobiy o'sish tendensiyasi kuzatilmoqda",
              "Hududlar va bo'g'inlar kesimida yuklamaning notekis taqsimlanganligi aniqlandi",
              "Ichki jarayonlarni qayta ko'rib chiqish orqali qo'shimcha 40 foizlik o'sish salohiyati mavjud",
            ],
      speakerNotes: isRu
        ? `Эмпирические расчеты подтверждают наличие значительного неиспользованного потенциала роста.`
        : isEn
          ? `Empirical calculations reveal substantial latent potential, which can be unlocked via streamlined procedures.`
          : `O'tkazilgan tahliliy hisob-kitoblarimiz tizimda foydalanilmagan ulkan ichki imkoniyatlar mavjudligini ko'rsatdi.`,
      highlightMetric: "40% salohiyat",
    },
    {
      slideNumber: 7,
      type: "content",
      title: isRu
        ? "Выявленные проблемы и барьеры развития"
        : isEn
          ? "Identified Deficiencies & Bottlenecks"
          : "Aniqlangan tizimli muammolar va to'siqlar",
      subtitle: isRu
        ? "Критический аудит факторов"
        : isEn
          ? "Critical Factor Diagnosis"
          : "Faktorlar diagnostikasi",
      badge: "06 / Muammolar",
      bulletPoints: isRu
        ? [
            "1. Недостаточный уровень цифровой интеграции между ключевыми звеньями",
            "2. Дефицит узкопрофильных специалистов с современными навыками",
            "3. Инерционность традиционных управленческих процедур",
          ]
        : isEn
          ? [
              "1. Insufficient interoperability across heterogeneous digital tools",
              "2. Shortage of highly skilled specialists capable of strategic maintenance",
              "3. Regulatory and organizational friction in legacy workflows",
            ]
          : [
              "1. Bo'g'inlar o'rtasida zamonaviy axborot almashinuvi to'liq integratsiya qilinmagan",
              "2. Yuqori malakali, soha bo'yicha zamonaviy ko'nikmalarga ega kadrlarning yetishmasligi",
              "3. An'anaviy byurokratik jarayonlar tufayli vaqt va moddiy resurslar sarfining yuqoriligi",
            ],
      speakerNotes: isRu
        ? `Именно эти три барьера на сегодняшний день сдерживают качественный прорыв системы.`
        : isEn
          ? `These diagnosed bottlenecks represent the primary obstacles hindering exponential performance leap.`
          : `Aynan ushbu uchta tizimli to'siq sohaning yangi bosqichga ko'tarilishiga asosiy monelik qilmoqda.`,
      highlightMetric: "3 ta to'siq",
    },
    {
      slideNumber: 8,
      type: "roadmap",
      title: isRu
        ? "Комплекс научно обоснованных предложений"
        : isEn
          ? "Proposed Strategic Solutions & Roadmap"
          : "Ilmiy asoslangan takliflar va yechimlar majmui",
      subtitle: isRu
        ? "Пошаговая дорожная карта"
        : isEn
          ? "Step-by-Step Strategic Roadmap"
          : "Bosqichma-bosqich yo'l xaritasi",
      badge: "07 / Takliflar",
      bulletPoints: isRu
        ? [
            "Внедрение единой автоматизированной платформы сквозного мониторинга",
            "Оптимизация регламентов и сокращение дублирующих звеньев",
            "Запуск программ непрерывного повышения квалификации персонала",
          ]
        : isEn
          ? [
              "Deploy a unified real-time telemetry and management architecture",
              "Restructure procedural protocols to eliminate bureaucratic overhead",
              "Establish targeted competency elevation initiatives for core personnel",
            ]
          : [
              "Yagona avtomatlashtirilgan monitoring va boshqaruv platformasini joriy etish",
              "Hujjat aylanishi reglamentlarini soddalashtirish va ortiqcha bosqichlarni qisqartirish",
              "Xodimlar malakasini tizimli va doimiy oshirib borish dasturini yo'lga qo'yish",
            ],
      speakerNotes: isRu
        ? `Наши предложения носят прикладной характер и базируются на четких финансово-экономических расчетах.`
        : isEn
          ? `Our proposed interventions are pragmatic, empirically grounded, and mathematically optimized.`
          : `Biz tavsiya etayotgan yechimlar qog'ozda emas, balki amaliyotda to'g'ridan-to'g'ri joriy etishga tayyor holatda ishlab chiqildi.`,
      highlightMetric: "3 bosqich",
    },
    {
      slideNumber: 9,
      type: "conclusion",
      title: isRu
        ? "Заключение и ожидаемый социально-экономический эффект"
        : isEn
          ? "Conclusions & Projected Impact"
          : "Xulosa va kutilayotgan ijtimoiy-iqtisodiy samara",
      subtitle: isRu ? "Итоги работы" : isEn ? "Key Takeaways" : "Ish natijasi",
      badge: "08 / Xulosa",
      bulletPoints: isRu
        ? [
            "Поставленные в исследовании цель и задачи полностью достигнуты",
            "Ожидается рост эффективности процессов на 25-30% в течение первого года",
            "Разработанные материалы могут служить методической базой для дальнейших изысканий",
          ]
        : isEn
          ? [
              "All predefined empirical and strategic milestones have been fully attained",
              "Projected operational gains range from 25% to 30% within the maiden fiscal year",
              "Analytical models provide a robust foundation for subsequent institutional research",
            ]
          : [
              "Tadqiqot oldiga qo'yilgan barcha maqsad va vazifalar to'liq bajarildi",
              "Taklif etilgan chora-tadbirlar 1-yilning o'zidayoq samaradorlikni 25-30 foizga oshiradi",
              "Ish natijalari OTMlarda va amaliyotchi tashkilotlarda to'g'ridan-to'g'ri qo'llanilishi mumkin",
            ],
      speakerNotes: isRu
        ? `Подводя итог, можно с уверенностью утверждать, что внедрение предложенных решений окажет существенный положительный эффект.`
        : isEn
          ? `In conclusion, our research successfully proves that structured implementation delivers measurable socio-economic benefits.`
          : `Xulosa qilib aytganda, ishlab chiqilgan takliflarning hayotga tatbiq etilishi sezilarli iqtisodiy va ijtimoiy samara beradi.`,
      highlightMetric: "+30% natija",
    },
    {
      slideNumber: 10,
      type: "qa",
      title: isRu
        ? "Спасибо за внимание!"
        : isEn
          ? "Thank You for Your Attention!"
          : "E'tiboringiz uchun rahmat!",
      subtitle: isRu
        ? "Готов ответить на ваши вопросы"
        : isEn
          ? "Questions and Discussion"
          : "Savol va javoblar uchun ochiqman",
      badge: isRu ? "Финал" : isEn ? "Closing" : "Yakuniy",
      bulletPoints: isRu
        ? [
            "Докладчик: Соискатель / Студент",
            "Научный руководитель: Доктор / Кандидат наук",
            "Университет и кафедра: 2026 год",
          ]
        : isEn
          ? [
              "Presenter: Degree Candidate",
              "Academic Advisor: Professor / Senior Lecturer",
              "Institution & Department: Academic Year 2026",
            ]
          : [
              "Ma'ruzachi: Talaba / Izlanuvchi",
              "Ilmiy rahbar: Dotsent / Professor",
              "OTM va kafedra: 2026-o'quv yili",
            ],
      speakerNotes: isRu
        ? `Доклад окончен. Благодарю за внимание и готов ответить на все интересующие вас вопросы.`
        : isEn
          ? `This concludes our formal presentation. Thank you for your time, and I welcome any questions or discussion.`
          : `Ma'ruzam yakuniga yetdi. Komissiya a'zolarining mavzu yuzasidan barcha savollariga javob berishga tayyorman.`,
      highlightMetric: "Q&A",
    },
  ];

  // Adjust to requested count
  if (count <= templateSlides.length) {
    const sliced = templateSlides.slice(0, count);
    // Ensure the last slide is Q&A
    sliced[sliced.length - 1] = {
      ...templateSlides[templateSlides.length - 1],
      slideNumber: count,
    };
    return sliced;
  }

  // If count > 10, duplicate and expand intermediate content slides
  const expanded: SlideItem[] = [...templateSlides.slice(0, templateSlides.length - 1)];
  while (expanded.length < count - 1) {
    const num = expanded.length + 1;
    expanded.push({
      slideNumber: num,
      type: "content",
      title: `${topic} - ${isRu ? "Углубленный анализ" : isEn ? "Deep-Dive Evaluation" : "Chuqurlashtirilgan tahlil"} #${num}`,
      subtitle: isRu
        ? "Дополнительный научный блок"
        : isEn
          ? "Supplementary Research Module"
          : "Qo'shimcha ilmiy modul",
      badge: `0${num} / Tahlil`,
      bulletPoints: isRu
        ? [
            "Детализация количественных факторов исследуемого объекта",
            "Оценка рисков и стресс-тестирование предлагаемых механизмов",
            "Обеспечение устойчивости в долгосрочной перспективе",
          ]
        : isEn
          ? [
              "Granular factor attribution and quantitative modeling",
              "Risk assessment and system resilience under stress conditions",
              "Long-range sustainability and structural scalability",
            ]
          : [
              "O'rganilayotgan obyektning miqdoriy va sifat ko'rsatkichlari batafsil tahlili",
              "Tavsiya etilayotgan mexanizmlarning risklarini baholash va sinovdan o'tkazish",
              "Uzoq muddatli istiqbolda barqarorlik va kengayuvchanlikni ta'minlash",
            ],
      speakerNotes: isRu
        ? `На данном слайде представлены расширенные аналитические расчеты.`
        : isEn
          ? `This slide further substantiates our core empirical hypotheses.`
          : `Mazkur slaydda chuqurlashtirilgan tahliliy va statistik hisob-kitoblar o'z aksini topgan.`,
      highlightMetric: `#${num}`,
    });
  }

  // Add final QA slide
  expanded.push({
    ...templateSlides[templateSlides.length - 1],
    slideNumber: count,
  });

  return expanded;
}
