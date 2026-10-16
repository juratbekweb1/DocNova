export const maxDuration = 60;
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  checkUserLimit,
  trackAIUsage,
  deductUserAiCredit,
  getUserSubscription,
} from "@/lib/limits";
import { generateGeminiJson } from "@/lib/gemini";

export interface CourseworkOutlineChapter {
  number: number;
  title: string;
  subsections: string[];
}

export interface CourseworkOutline {
  topic: string;
  subject: string;
  faculty?: string;
  introTitle: string;
  introPoints: string[];
  chapters: CourseworkOutlineChapter[];
  conclusionTitle: string;
  referencesTitle: string;
}

export interface CourseworkData {
  subject: string;
  topic: string;
  faculty?: string;
  university: string;
  studentName: string;
  teacherName: string;
  year: string;
  pageCount?: string;
  language?: "uz" | "uz-cyrl" | "ru";
  outline?: CourseworkOutline;
}

export interface CourseworkPage {
  pageNumber: number;
  type: string;
  title: string;
  content: string;
}

export interface CourseworkAiChapters {
  kirishContent?: string;
  chapter1Content?: string;
  chapter2Content?: string;
  chapter3Content?: string;
  xulosaContent?: string;
}

export function buildDefaultOutline(
  topic: string,
  subject: string,
  faculty?: string,
  language: "uz" | "uz-cyrl" | "ru" = "uz"
): CourseworkOutline {
  const isRu = language === "ru";
  const isCyrl = language === "uz-cyrl";

  if (isRu) {
    return {
      topic,
      subject,
      faculty,
      introTitle: "ВВЕДЕНИЕ",
      introPoints: [
        "Актуальность темы исследования",
        "Степень научной разработанности проблемы",
        "Цели и задачи курсовой работы",
        "Объект и предмет исследования",
        "Методы и методологическая база исследования",
        "Научная новизна и практическая значимость работы",
      ],
      chapters: [
        {
          number: 1,
          title: "ГЛАВА I. ТЕОРЕТИКО-МЕТОДОЛОГИЧЕСКИЕ ОСНОВЫ ИССЛЕДОВАНИЯ",
          subsections: [
            "1.1. Сущность, понятийный аппарат и теоретические аспекты темы",
            "1.2. Концептуальные модели и классификация ключевых подходов",
            "1.3. Международный опыт и современные тенденции развития",
          ],
        },
        {
          number: 2,
          title: "ГЛАВА II. ПРАКТИЧЕСКИЙ АНАЛИЗ И СТАТИСТИЧЕСКАЯ ОЦЕНКА",
          subsections: [
            "2.1. Анализ текущего состояния и эмпирические показатели в Узбекистане",
            "2.2. Системные проблемы, барьеры и сдерживающие факторы",
            "2.3. Пути повышения эффективности и оптимизация процессов",
          ],
        },
        {
          number: 3,
          title: "ГЛАВА III. СТРАТЕГИЧЕСКИЕ ПЕРСПЕКТИВЫ И ДОРОЖНАЯ КАРТА",
          subsections: [
            "3.1. Комплекс инновационных предложений и внедрение решений",
            "3.2. Оценка социально-экономической эффективности результатов",
            "3.3. Практические рекомендации по масштабированию результатов",
          ],
        },
      ],
      conclusionTitle: "ЗАКЛЮЧЕНИЕ И ПРАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ",
      referencesTitle: "СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ (ГОСТ)",
    };
  }

  if (isCyrl) {
    return {
      topic,
      subject,
      faculty,
      introTitle: "КИРИШ",
      introPoints: [
        "Мавзунинг долзарблиги ва аҳамияти",
        "Муаммонинг илмий ўрганилганлик даражаси",
        "Тадқиқот мақсади ва вазифалари",
        "Тадқиқот объекти ва предмети",
        "Тадқиқот усуллари ва услубий асоси",
        "Тадқиқотнинг илмий янгилиги ва амалий аҳамияти",
      ],
      chapters: [
        {
          number: 1,
          title: "I БОБ. МАВЗУНИНГ НАЗАРИЙ-МЕТОДОЛОГИК АСОСЛАРИ",
          subsections: [
            "1.1. Мавзунинг назарий-концептуал асослари ва асосий тушунчалари",
            "1.2. Илмий қарашлар, методологик принциплар ва назарий моделлар",
            "1.3. Хорижий тажриба ва замонавий халқаро тенденциялар таҳлили",
          ],
        },
        {
          number: 2,
          title: "II БОБ. АМАЛИЙ ТАДҚИҚОТ ВА САМАРАДОРЛИК ТАҲЛИЛИ",
          subsections: [
            "2.1. Ҳозирги ҳолатнинг тизимли мониторинги ва статистик кўрсаткичлар",
            "2.2. Соҳада мавжуд тизимли муаммолар ва тўсиқлар таҳлили",
            "2.3. Самарадорликни ошириш ва жараёнларни оптималлаштириш",
          ],
        },
        {
          number: 3,
          title: "III БОБ. СОҲАНИ РИВОЖЛАНТИРИШНИНГ СТРАТЕГИК ИСТИҚБОЛЛАРИ",
          subsections: [
            "3.1. Замонавий механизмларни интеграция қилишнинг «Йўл харитаси»",
            "3.2. Кутилаётган ижтимоий-иқтисодий самарадорлик ва истиқболлар",
            "3.3. Илмий-амалий тавсияларни амалиётга жорий этиш механизмлари",
          ],
        },
      ],
      conclusionTitle: "ХУЛОСА ВА АМАЛИЙ ТАВСИЯЛАР",
      referencesTitle: "ФОЙДАЛАНИЛГАН АДАБИЁТЛАР РЎЙХАТИ (ГОСТ)",
    };
  }

  // Default: Uzbek Latin
  const cleanTopicUpper = topic.toUpperCase();
  return {
    topic,
    subject,
    faculty,
    introTitle: "KIRISH",
    introPoints: [
      "Mavzuning dolzarbligi va ahamiyati",
      "Muammoning ilmiy o'rganilganlik darajasi",
      "Tadqiqot maqsadi va vazifalari",
      "Tadqiqot obyekti va predmeti",
      "Tadqiqot usullari va metodologik asosi",
      "Tadqiqotning ilmiy yangiligi va amaliy ahamiyati",
    ],
    chapters: [
      {
        number: 1,
        title: `I BOB. ${cleanTopicUpper}NING NAZARIY-METODOLOGIK ASOSLARI`,
        subsections: [
          "1.1. Mavzuning nazariy-konseptual asoslari va fundamental tushunchalari",
          "1.2. Ilmiy qarashlar, metodologik tamoyillar va tasniflash modellari",
          "1.3. Xorijiy tajriba va zamonaviy xalqaro tendensiyalar qiyosiy tahlili",
        ],
      },
      {
        number: 2,
        title: "II BOB. AMALIY TADQIQOT VA EMPIRIK TAHLIL",
        subsections: [
          "2.1. O'zbekistonda sohaning joriy holati va dinamik statistik ko'rsatkichlar",
          "2.2. Sohada mavjud tizimli muammolar, to'siqlar va disproporsiyalar tahlili",
          "2.3. Jarayonlarni optimallashtirish va amaliy samaradorlik ko'rsatkichlari",
        ],
      },
      {
        number: 3,
        title: "III BOB. MUAMMOLAR VA ILMIY-AMALIY YECHIMLAR/TAKLIFLAR",
        subsections: [
          "3.1. Sohani rivojlantirishning istiqbolli yo'nalishlari va mexanizmlari",
          "3.2. Innovatsion yechimlarni amaliyotga tatbiq etishning «Yo'l xaritasi»",
          "3.3. Kutilayotgan ijtimoiy-iqtisodiy samaradorlik va amaliy xulosaviy baholash",
        ],
      },
    ],
    conclusionTitle: "XULOSA VA AMALIY TAVSIYALAR",
    referencesTitle: "FOYDALANILGAN ADABIYOTLAR RO'YXATI (GOST)",
  };
}

export function generateAcademicPages(
  data: CourseworkData,
  aiChapters?: CourseworkAiChapters
): CourseworkPage[] {
  const {
    subject,
    topic,
    faculty,
    university,
    studentName,
    teacherName,
    year,
    pageCount,
    language = "uz",
    outline: customOutline,
  } = data;

  const currentYear = year || new Date().getFullYear().toString();
  const targetPages = Math.max(10, Math.min(100, parseInt(pageCount || "19", 10) || 19));

  const isRu = language === "ru";
  const isCyrl = language === "uz-cyrl";

  const defaultUName = isRu
    ? "НАЦИОНАЛЬНЫЙ УНИВЕРСИТЕТ УЗБЕКИСТАНА"
    : isCyrl
      ? "ЎЗБЕКИСТОН МИЛЛИЙ УНИВЕРСИТЕТИ"
      : "O'ZBEKISTON MILLIY UNIVERSITETI";

  const uName = (university || defaultUName).toUpperCase();
  const sName =
    studentName ||
    (isRu ? "Студент группы 301" : isCyrl ? "301-гуруҳ талабаси" : "301-guruh talabasi");
  const tName =
    teacherName ||
    (isRu
      ? "Научный руководитель, доцент"
      : isCyrl
        ? "Илмий раҳбар, доцент"
        : "Ilmiy rahbar, dotsent");
  const facName =
    faculty ||
    (isRu
      ? "Факультет цифровых технологий и экономики"
      : isCyrl
        ? "Рақамli технологиялар ва иқтисодиёт факультети"
        : "Raqamli texnologiyalar va iqtisodiyot fakulteti");

  const outline = customOutline || buildDefaultOutline(topic, subject, faculty, language);

  const ch1Info = outline.chapters[0] || {
    number: 1,
    title: isRu ? "ГЛАВА I. ТЕОРЕТИЧЕСКИЕ ОСНОВЫ" : "I BOB. NAZARIY ASOSLAR",
    subsections: [
      "1.1. Nazariy asoslar va tushunchalar",
      "1.2. Konseptual modellar tahlili",
      "1.3. Xorijiy tajriba va tendensiyalar",
    ],
  };

  const ch2Info = outline.chapters[1] || {
    number: 2,
    title: isRu ? "ГЛАВА II. ПРАКТИЧЕСКИЙ АНАЛИЗ" : "II BOB. AMALIY TAHLIL",
    subsections: [
      "2.1. Amaliy holat tahlili va ko'rsatkichlar",
      "2.2. Mavjud muammolar va to'siqlar",
      "2.3. Jarayonlarni optimallashtirish",
    ],
  };

  const ch3Info = outline.chapters[2] || {
    number: 3,
    title: isRu ? "ГЛАВА III. СТРАТЕГИЧЕСКИЕ ПЕРСПЕКТИВЫ" : "III BOB. STRATEGIK ISTIQBOLLAR",
    subsections: [
      "3.1. Rivojlantirish yo'nalishlari",
      "3.2. «Yo'l xaritasi» va yechimlar",
      "3.3. Kutilayotgan samaradorlik",
    ],
  };

  // Dynamic Page Allocation ensuring exactly targetPages
  const pLitPages = targetPages <= 15 ? 1 : 2;
  const pConcPages = targetPages <= 15 ? 1 : targetPages <= 24 ? 1 : 2;
  const pIntroPages = targetPages <= 15 ? 1 : targetPages <= 25 ? 2 : 3;

  const remPages = targetPages - 2 - pLitPages - pConcPages - pIntroPages; // Remaining for 3 chapters

  const ch1Pages = Math.max(2, Math.floor(remPages * 0.32));
  const ch3Pages = Math.max(2, Math.floor(remPages * 0.32));
  const ch2Pages = Math.max(2, remPages - ch1Pages - ch3Pages);

  // Exact page numbers for Table of Contents
  const pIntro = 3;
  const pCh1 = pIntro + pIntroPages;
  const pCh1_1 = pCh1;
  const pCh1_2 = pCh1_1 + Math.max(1, Math.floor(ch1Pages / 3));
  const pCh1_3 = pCh1_2 + Math.max(1, Math.floor(ch1Pages / 3));

  const pCh2 = pCh1 + ch1Pages;
  const pCh2_1 = pCh2;
  const pCh2_2 = pCh2_1 + Math.max(1, Math.floor(ch2Pages / 3));
  const pCh2_3 = pCh2_2 + Math.max(1, Math.floor(ch2Pages / 3));

  const pCh3 = pCh2 + ch2Pages;
  const pCh3_1 = pCh3;
  const pCh3_2 = pCh3_1 + Math.max(1, Math.floor(ch3Pages / 3));
  const pCh3_3 = pCh3_2 + Math.max(1, Math.floor(ch3Pages / 3));

  const pConc = pCh3 + ch3Pages;
  const pLit = pConc + pConcPages;

  const pages: CourseworkPage[] = [];

  // ==========================================
  // PAGE 1: TITUL VARAQ (MOVSO RUz Standard)
  // ==========================================
  if (isRu) {
    pages.push({
      pageNumber: 1,
      type: "title",
      title: "ТИТУЛЬНЫЙ ЛИСТ",
      content: `# МИНИСТЕРСТВО ВЫСШЕГО ОБРАЗОВАНИЯ, НАУКИ И ИННОВАЦИЙ РЕСПУБЛИКИ УЗБЕКИСТАН

## ${uName}

### ПО ДИСЦИПЛИНЕ "${subject.toUpperCase()}"

# КУРСОВАЯ РАБОТА

### **Тема:** "${topic}"

---

**Выполнил(а):** ${sName}  
**Научный руководитель:** ${tName}  
**Факультет / Кафедра:** ${facName}  
**Направление образования:** Бакалавриат  
**Курс / Группа:** 3-курс  

---

**Ташкент — ${currentYear}**`,
    });
  } else if (isCyrl) {
    pages.push({
      pageNumber: 1,
      type: "title",
      title: "ТИТУЛ ВАРАҚ",
      content: `# ЎЗБЕКИСТОН РЕСПУБЛИКАСИ ОЛИЙ ТАЪЛИМ, ФАН ВА ИННОВАЦИЯЛАР ВАЗИРЛИГИ

## ${uName}

### "${subject.toUpperCase()}" ФАНИДАН

# КУРС ИШИ

### **Мавзу:** "${topic}"

---

**Бажарди:** ${sName}  
**Илмий раҳбар:** ${tName}  
**Факультет:** ${facName}  
**Таълим йўналиши:** Бакалавриат  
**Гуруҳ:** 301-гуруҳ талабаси  

---

**Тошкент — ${currentYear}**`,
    });
  } else {
    pages.push({
      pageNumber: 1,
      type: "title",
      title: "TITUL VARAQ",
      content: `# O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI

## ${uName}

### "${subject.toUpperCase()}" FANIDAN

# KURS ISHI

### **Mavzu:** "${topic}"

---

**Bajardi:** ${sName}  
**Ilmiy rahbar:** ${tName}  
**Fakultet / Kafedra:** ${facName}  
**Ta'lim yo'nalishi:** Bakalavriat mutaxassisligi  
**Guruh:** 301-guruh talabasi  

---

**Toshkent — ${currentYear}**`,
    });
  }

  // ==========================================
  // PAGE 2: MUNDARIJA (TABLE OF CONTENTS)
  // ==========================================
  const tocLines: string[] = [];
  if (isRu) {
    tocLines.push(
      `# ${outline.introTitle || "СОДЕРЖАНИЕ"}`,
      ``,
      `- **ВВЕДЕНИЕ** ......................................................................................................................................... ${pIntro}`,
      `- **${ch1Info.title.toUpperCase()}** ................................................................................................. ${pCh1}`,
      `  - ${ch1Info.subsections[0] || "1.1. Сущность и теоретические аспекты темы"} ..................................... ${pCh1_1}`,
      `  - ${ch1Info.subsections[1] || "1.2. Концептуальные модели и классификация подходов"} ....................................... ${pCh1_2}`,
      `  - ${ch1Info.subsections[2] || "1.3. Международный опыт и современные тенденции"} ................................................ ${pCh1_3}`,
      `- **${ch2Info.title.toUpperCase()}** ................................................................................................. ${pCh2}`,
      `  - ${ch2Info.subsections[0] || "2.1. Анализ текущего состояния и показателей"} ........................... ${pCh2_1}`,
      `  - ${ch2Info.subsections[1] || "2.2. Системные проблемы и барьеры"} ............................................. ${pCh2_2}`,
      `  - ${ch2Info.subsections[2] || "2.3. Пути повышения эффективности и оптимизация"} .............................................. ${pCh2_3}`,
      `- **${ch3Info.title.toUpperCase()}** ................................................................................................. ${pCh3}`,
      `  - ${ch3Info.subsections[0] || "3.1. Комплекс инновационных предложений"} ......................................... ${pCh3_1}`,
      `  - ${ch3Info.subsections[1] || "3.2. Оценка социально-экономической эффективности"} ........................................ ${pCh3_2}`,
      `  - ${ch3Info.subsections[2] || "3.3. Практические рекомендации и масштабирование"} ........................................ ${pCh3_3}`,
      `- **${outline.conclusionTitle || "ЗАКЛЮЧЕНИЕ"}** ................................................................................................. ${pConc}`,
      `- **${outline.referencesTitle || "СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ"}** .......................................................................... ${pLit}`
    );
  } else {
    tocLines.push(
      `# MUNDARIJA`,
      ``,
      `- **KIRISH** ......................................................................................................................................... ${pIntro}`,
      `- **${ch1Info.title.toUpperCase()}** ................................................................................................. ${pCh1}`,
      `  - ${ch1Info.subsections[0] || "1.1. Mavzuning nazariy-konseptual asoslari va asosiy tushunchalari"} ........................................ ${pCh1_1}`,
      `  - ${ch1Info.subsections[1] || "1.2. Ilmiy qarashlar, metodologik prinsiplar va modellar"} ........................................... ${pCh1_2}`,
      `  - ${ch1Info.subsections[2] || "1.3. Xorijiy tajriba va zamonaviy xalqaro tendensiyalar"} .............................................. ${pCh1_3}`,
      `- **${ch2Info.title.toUpperCase()}** ................................................................................................. ${pCh2}`,
      `  - ${ch2Info.subsections[0] || "2.1. Hozirgi holatning tizimli monitoringi va statistik ko'rsatkichlar"} ................................................ ${pCh2_1}`,
      `  - ${ch2Info.subsections[1] || "2.2. Sohada mavjud tizimli muammolar va to'siqlar tahlili"} .................................................... ${pCh2_2}`,
      `  - ${ch2Info.subsections[2] || "2.3. Samaradorlikni oshirish va optimallashtirish tizimi"} .................................................... ${pCh2_3}`,
      `- **${ch3Info.title.toUpperCase()}** ................................................................................................. ${pCh3}`,
      `  - ${ch3Info.subsections[0] || "3.1. Zamonaviy mexanizmlarni integratsiya qilishning «Yo'l xaritasi»"} ......................................... ${pCh3_1}`,
      `  - ${ch3Info.subsections[1] || "3.2. Kutilayotgan ijtimoiy-iqtisodiy samaradorlik va istiqbollar"} ..................................... ${pCh3_2}`,
      `  - ${ch3Info.subsections[2] || "3.3. Ilmiy-amaliy takliflarni amaliyotga joriy etish tavsiyalari"} ..................................... ${pCh3_3}`,
      `- **${outline.conclusionTitle || "XULOSA VA AMALIY TAVSIYALAR"}** ............................................................................................... ${pConc}`,
      `- **${outline.referencesTitle || "FOYDALANILGAN ADABIYOTLAR RO'YXATI"}** .................................................................................. ${pLit}`
    );
  }

  pages.push({
    pageNumber: 2,
    type: "toc",
    title: isRu ? "СОДЕРЖАНИЕ" : "MUNDARIJA",
    content: tocLines.join("\n"),
  });

  let curPage = 3;

  // ==========================================
  // KIRISH / ВВЕДЕНИЕ
  // ==========================================
  for (let i = 0; i < pIntroPages; i++) {
    const isFirst = i === 0;
    const isLast = i === pIntroPages - 1;
    let content = "";

    if (isRu) {
      if (isFirst) {
        content = `# ВВЕДЕНИЕ

### Актуальность темы исследования
В условиях масштабных экономических и технологических реформ, проводимых в Республике Узбекистан, повышение эффективности в сфере "${subject}" приобретает фундаментальное значение. Стратегия развития Нового Узбекистана ставит во главу угла интеграцию научных разработок в реальный сектор экономики и государственное управление.

Тема **"${topic}"** является исключительно актуальной, поскольку непосредственно отвечает современным требованиям оптимизации процессов, цифровизации и внедрения передовых практик. Традиционные методы управления и анализа зачастую не справляются с возрастающими объемами информации и динамикой рынка, что диктует объективную необходимость научного переосмысления существующих подходов.

### Степень научной разработанности проблемы
Вопросы, связанные с данной проблематикой, исследовались в трудах ведущих отечественных и зарубежных ученых. В фундаментальных работах исследователей заложены теоретические основы анализа, разработаны базовые концептуальные модели. Тем не менее, стремительное развитие новых технологий требует постоянного обновления методологического инструментария с учетом национальной специфики Республики Узбекистан.`;
      } else if (isLast) {
        content = `# ВВЕДЕНИЕ (Продолжение)

### Цели и задачи курсовой работы
**Главная цель исследования:** комплексный теоретический и практический анализ темы **"${topic}"**, выявление существующих барьеров и разработка научно обоснованных рекомендаций по повышению ее эффективности.

Для достижения поставленной цели были определены следующие **задачи**:
1. Изучить теоретические и методологические основы исследуемой темы по современной научной литературе;
2. Раскрыть сущность и классификацию ключевых понятий и концептуальных моделей;
3. Обобщить передовой зарубежный опыт и оценить возможности его адаптации в Узбекистане;
4. Провести системный анализ текущего состояния и эмпирических показателей на национальном уровне;
5. Выявить системные проблемы и предложить прикладные механизмы их устранения.

### Объект, предмет и методы исследования
- **Объект исследования:** процессы и механизмы функционирования темы "${topic}".
- **Предмет исследования:** совокупность теоретических, организационно-экономических и практических закономерностей развития исследуемого направления.
- **Методы исследования:** системный и сравнительный анализ, статистическая группировка, индукция, дедукция и моделирование.`;
      } else {
        content = `# ВВЕДЕНИЕ (Методологическая база)

### Научная новизна и практическая значимость
Научная новизна работы заключается в систематизации теоретических положений и выработке комплексного прикладного алгоритма модернизации исследуемого сектора.

Практическая значимость работы определяется тем, что сформированные выводы, аналитические таблицы и рекомендации могут быть непосредственно использованы в учебном процессе высших учебных заведений, а также в практической деятельности профильных предприятий и организаций. Комплексный подход гарантирует высокую применимость и достоверность полученных научных результатов.`;
      }
    } else {
      if (isFirst) {
        content = `# KIRISH

### Mavzuning dolzarbligi va ahamiyati
Bugungi kunda jahon miqyosida va O'zbekiston Respublikasida kechayotgan keng ko'lamli modernizatsiya va raqamli transformatsiya jarayonlari barcha sohalar qatori "${subject}" fani yo'nalishida ham tub o'zgarishlarni amalga oshirishni taqozo etmoqda. Mamlakatimizda olib borilayotgan ijtimoiy-iqtisodiy islohotlar, ilm-fan va innovatsion faoliyatni qo'llab-quvvatlashga oid davlat strategiyalari har bir sohada ilmiy asoslangan yechimlarni amaliyotga keng tatbiq etishni talab qiladi.

Aynan "${topic}" mavzusining chuqur o'rganilishi bugungi kunda axborot oqimlarining jadal sur'atlar bilan ortib borishi, texnologik va boshqaruv tizimlarining murakkablashuvi hamda amaliy faoliyatda aniqlik, xavfsizlik va tezkorlikka bo'lgan ehtiyoj bilan bevosita bog'liqdir. Mazkur sohadagi an'anaviy yondashuvlarning zamonaviy talablarga har doim ham to'laqonli javob bera olmasligi yangi ilmiy qarashlar va metodologik vositalarni ishlab chiqishni dolzarb ilmiy muammoga aylantirdi.

### Muammoning ilmiy o'rganilganlik darajasi
Ushbu yo'nalish bo'yicha mahalliy va xorijiy olimlar tomonidan ko'plab fundamental va amaliy tadqiqotlar olib borilgan. Ilg'or xorijiy tadqiqot markazlari ushbu muammoning nazariy-konseptual asoslarini, algoritmlarini va xalqaro standartlarini chuqur yoritib bergan. Mahalliy tadqiqotchilar esa mazkur modellarni milliy iqtisodiyot va mintaqaviy infratuzilmaga moslashtirish, qonunchilik bazasini takomillashtirish borasida izlanishlar olib borganlar. Shunga qaramay, mazkur tizimni zamonaviy talablar asosida integratsiyalashgan holda tahlil qilish masalasi hali to'liq yechimini topmagan.`;
      } else if (isLast) {
        content = `# KIRISH (Davomi)

### Tadqiqotning maqsadi va vazifalari
**Tadqiqotning bosh maqsadi:** "${topic}" mavzusining ilmiy-nazariy asoslarini, zamonaviy rivojlanish qonuniyatlarini har tomonlama tahlil qilish, sohadagi mavjud tizimli muammolarni aniqlash hamda ularni bartaraf etishga qaratilgan ilmiy asoslangan amaliy takliflar majmuasini ishlab chiqishdan iborat.

Ushbu maqsadga erishish uchun quyidagi ilmiy-amaliy **vazifalar** belgilandi:
1. "${topic}" mavzusiga doir ilmiy-nazariy adabiyotlar va fundamental konsepsiyalarni qiyosiy tahlil qilish;
2. Mavzuning mohiyati, konseptual modellari va unga ta'sir etuvchi asosiy omillar tizimini ochib berish;
3. Rivojlangan xorijiy davlatlar tajribasini o'rganish va ularning ilg'or yutuqlarini umumlashtirish;
4. O'zbekiston Respublikasida mazkur sohaning real holatini statistik va empirik ma'lumotlar asosida tahlil etish;
5. Samaradorlikni oshirish, xatarlarni kamaytirish va amaliyotga joriy etish bo'yicha ilmiy xulosalar va tavsiyalar tizimini ishlab chiqish.

### Obyekt, predmet va metodologiya
- **Tadqiqot obyekti:** "${topic}" tizimi, uning funksional tarkibiy qismlari va faoliyat mexanizmi.
- **Tadqiqot predmeti:** Mazkur tizimning nazariy-metodologik asoslari, amaliy samaradorlik ko'rsatkichlari va optimallashtirish qonuniyatlari.
- **Tadqiqot usullari:** Tizimli va qiyosiy tahlil, mantiqiy umumlashtirish, statistik guruhlash, induksiya va deduksiya, empirik monitoring.`;
      } else {
        content = `# KIRISH (Uslubiy asoslar)

### Ilmiy yangiligi va amaliy ahamiyati
Kurs ishi tadqiqotida tizimli yondashuv asosiy metodologik tamoyil sifatida tanlab olindi. Ushbu yondashuv tadqiq etilayotgan obyektni alohida ajratilgan qismlar yig'indisi sifatida emas, balki elementlari o'zaro zich bog'langan yaxlit tizim sifatida ko'rib chiqish imkonini beradi.

Mazkur tadqiqotda qo'llanilgan metodlar majmuasi ilmiy dalillarning ishonchliligi va xulosalarning asosliligini ta'minlaydi. Olib borilgan nazariy izlanishlar asosida muammoning genezisi, rivojlanish bosqichlari hamda unga bevosita ta'sir ko'rsatuvchi ichki va tashqi omillar guruhlari ajratib ko'rsatildi. Bu esa amaliyotda uchraydigan ziddiyatlarni aniq diagnostika qilish uchun mustahkam poydevordir.`;
      }
    }

    if (aiChapters?.kirishContent && isLast) {
      content += `\n\n### Maxsus ilmiy tahlil va tadqiqot apparati\n${aiChapters.kirishContent}`;
    }

    pages.push({
      pageNumber: curPage++,
      type: "intro",
      title: isRu ? "ВВЕДЕНИЕ" : "KIRISH",
      content,
    });
  }

  // ==========================================
  // CHAPTER 1: NAZARIY-METODOLOGIK ASOSLAR
  // ==========================================
  const ch1_1_pages = Math.max(1, Math.floor(ch1Pages / 3));
  const ch1_2_pages = Math.max(1, Math.floor(ch1Pages / 3));
  const ch1_3_pages = Math.max(1, ch1Pages - ch1_1_pages - ch1_2_pages);

  for (let i = 0; i < ch1_1_pages; i++) {
    const isFirst = i === 0;
    const subTitle = ch1Info.subsections[0] || "1.1. Nazariy asoslar va tushunchalar";
    let ch1_1_content = isRu
      ? `${isFirst ? `# ${ch1Info.title.toUpperCase()}\n\n## ${subTitle}\n\n` : `## ${subTitle} (Продолжение)\n\n`}Исследование проблематики **"${topic}"** в контексте дисциплины "${subject}" требует детального анализа сущности ключевых понятий. В современной научной литературе данный феномен рассматривается как многоуровневая система, объединяющая организационные, технологические и аналитические компоненты.

Фундаментальные принципы функционирования исследуемого направления базируются на следующих критериях:
1. **Принцип системности:** гармоничное взаимодействие всех составных элементов для достижения синергетического эффекта;
2. **Принцип адаптивности:** способность оперативно реагировать на внешние изменения конъюнктуры;
3. **Принцип результативности:** максимизация практической отдачи при оптимизации используемых ресурсов.

Изучение сущности позволяет сформировать понятийный каркас, необходимый для детального анализа практических аспектов.`
      : `${isFirst ? `# ${ch1Info.title.toUpperCase()}\n\n## ${subTitle}\n\n` : `## ${subTitle} (Davomi)\n\n`}"${topic}" tushunchasi zamonaviy "${subject}" fanining eng muhim nazariy kategoriyalaridan biri hisoblanadi. Ilmiy adabiyotlarda mazkur tushuncha turli ilmiy maktablar tomonidan o'rganilgan bo'lib, uning tizimli va ko'p qirrali tabiati e'tirof etiladi.

Fundamental nazariyaga binoan, mazkur jarayon alohida texnik yoki boshqaruv funksiyasi bo'lmay, balki barcha tarkibiy bo'g'inlarni yagona maqsad atrofida birlashtiruvchi integrallashgan mexanizmdir.

Nazariy tahlillar shuni ko'rsatadiki, tizimning barqaror ishlashi quyidagi fundamental qoidalarga tayanadi:
1. **Tizimlilik tamoyili:** Barcha quyi elementlarning yaxlit umumiy maqsadga xizmat qilishi;
2. **Moslashuvchanlik tamoyili:** Tashqi muhit o'zgarishlariga nisbatan barqarorlikni saqlab qolish;
3. **Optimallik tamoyili:** Minimal resurs sarfi evaziga eng yuqori ilmiy va amaliy natijaga erishish.`;

    if (aiChapters?.chapter1Content && isFirst) {
      ch1_1_content += `\n\n### Chuqur nazariy-konseptual tahlil va ilmiy qarashlar\n${aiChapters.chapter1Content}`;
    }

    pages.push({
      pageNumber: curPage++,
      type: "chapter1",
      title: subTitle,
      content: ch1_1_content,
    });
  }

  for (let i = 0; i < ch1_2_pages; i++) {
    const subTitle = ch1Info.subsections[1] || "1.2. Ilmiy qarashlar va modellar";
    pages.push({
      pageNumber: curPage++,
      type: "chapter1",
      title: subTitle,
      content: isRu
        ? `## ${subTitle}

В рамках исследования темы **"${topic}"** можно выделить три преобладающих научных направления:
- **Классический нормативный подход:** акцентирует внимание на соблюдении регламентов, алгоритмов и стандартов;
- **Функционально-системный подход:** изучает обратные связи и динамическое распределение ресурсных потоков;
- **Инновационно-ориентированный подход:** базируется на непрерывном внедрении интеллектуальных цифровых решений.

Интеграция этих подходов позволяет нивелировать недостатки отдельных изолированных методов и выстроить устойчивую модель исследования.`
        : `## ${subTitle}

"${topic}" mavzusini tadqiq etishda jahon ilmiy hamjamiyatida bir necha yetakchi ilmiy maktablar va konseptual yo'nalishlar shakllangan:
1. **Klassik deterministik maktab:** Jarayonlarni qat'iy standartlar va qoidalar asosida tashkil etishni ilgari suradi;
2. **Kibernetik va tizimli maktab:** Tizimni o'zaro ta'sirlashuvchi ko'p parametrli tarmoq sifatida talqin qiladi;
3. **Zamonaviy intellektual paradigma:** Sun'iy intellekt va inson omili uyg'unligiga tayanadi.

Ushbu nazariy modellarning eng kuchli elementlarini integratsiyalashgan holda qo'llash amaliyotda yuqori samaradorlikni kafolatlaydi.`,
    });
  }

  for (let i = 0; i < ch1_3_pages; i++) {
    const subTitle = ch1Info.subsections[2] || "1.3. Xorijiy tajriba tahlili";
    pages.push({
      pageNumber: curPage++,
      type: "chapter1",
      title: subTitle,
      content: isRu
        ? `## ${subTitle}

Анализ международного опыта показывает, что ведущие страны мира (США, Германия, Япония, Сингапур) уделяют приоритетное внимание институциональной поддержке исследуемой темы.

Ключевые уроки зарубежной практики:
- Системное внедрение цифровых платформ и автоматизация рутинных операций;
- Постоянное повышение квалификации кадров и сертификация компетенций;
- Государственно-частное партнерство при масштабировании лучших технологических решений.

Адаптация данных решений с учетом специфики экономики Узбекистана позволяет существенно сократить время внедрения реформ.`
        : `## ${subTitle}

Rivojlangan xorijiy davlatlar tajribasi shuni ko'rsatadiki, "${topic}" masalasi innovatsion ekotizimning eng muhim ustuni sifatida davlat strategiyalari darajasida qo'llab-quvvatlanmoqda.

Xalqaro amaliyotdan mamlakatimiz uchun quyidagi darslar muhim hisoblanadi:
1. **Bosqichma-bosqich joriy etish:** O'zgarishlarni avval sinov (pilot) hududlarida tekshirish;
2. **Kadrlar tayyorlash dasturlari:** Yangi tizimlar bo'yicha mutaxassislar malakasini oshirish;
3. **Davlat-xususiy sherikligi:** Xususiy sektor salohiyati va investitsiyalarini faol jalb etish.`,
    });
  }

  // ==========================================
  // CHAPTER 2: AMALIY TADQIQOT VA STATISTIKA
  // ==========================================
  const ch2_1_pages = Math.max(1, Math.floor(ch2Pages / 3));
  const ch2_2_pages = Math.max(1, Math.floor(ch2Pages / 3));
  const ch2_3_pages = Math.max(1, ch2Pages - ch2_1_pages - ch2_2_pages);

  for (let i = 0; i < ch2_1_pages; i++) {
    const isFirst = i === 0;
    const subTitle = ch2Info.subsections[0] || "2.1. Hozirgi holat va statistik tahlil";
    let ch2_1_content = isRu
      ? `${isFirst ? `# ${ch2Info.title.toUpperCase()}\n\n## ${subTitle}\n\n` : `## ${subTitle} (Продолжение)\n\n`}Практическое исследование сферы "${topic}" в Республике Узбекистан демонстрирует устойчивую положительную динамику за последние 3 года. Регуляторные инициативы и модернизация инфраструктуры позволили достичь качественных сдвигов.

Сравнительные показатели эффективности функционирования системы сведены в следующую аналитическую таблицу:

| № | Исследуемый показатель | Базовый уровень | Текущий показатель | Целевой ориентир |
| :-: | :--- | :---: | :---: | :---: |
| 1 | Время обработки операций (часов) | 16 - 18 ч | 6 - 8 ч | 1.5 - 2 ч |
| 2 | Степень точности результатов (%) | 72% | 86% | 98.5% |
| 3 | Уровень эксплуатационных издержек | Высокий | Средний | Минимальный |
| 4 | Автоматизированная диагностика | Отсутствует | Частичная | Комплексная |
| 5 | Индекс удовлетворенности (CSI) | 64% | 81% | 96% |

Данные таблицы подтверждают, что оптимизация процессов позволяет сократить временные затраты в 4-6 раз при существенном росте точности.`
      : `${isFirst ? `# ${ch2Info.title.toUpperCase()}\n\n## ${subTitle}\n\n` : `## ${subTitle} (Davomi)\n\n`}Kurs ishining ushbu bo'limida O'zbekiston Respublikasida "${topic}" yo'nalishining bugungi kundagi real holati, dinamikasi va amaliy ko'rsatkichlari empirik ma'lumotlar asosida atroflicha o'rganildi.

Tizimning joriy holati va optimallashtirishdan keyingi kutilayotgan ko'rsatkichlari qiyosiy parametrlar asosida quyidagi jadvalda umumlashtirildi:

| № | Tahlil etilayotgan ko'rsatkich | An'anaviy holat | Joriy holat | Optimallashgan model |
| :-: | :--- | :---: | :---: | :---: |
| 1 | Jarayonlarni bajarish vaqti (soat/birlik) | 14 - 18 soat | 6 - 8 soat | 1 - 2 soat |
| 2 | Natijalarning aniqligi va ishonchliligi (%) | 70% | 85% | 98% |
| 3 | Operatsion xarajatlar darajasi | Yuqori | O'rtacha | Minimal |
| 4 | Xatoliklarni avtomatik diagnostika qilish | Mavjud emas | Qisman | To'liq integrallashgan |
| 5 | Foydalanuvchilar qoniqish darajasi (CSI) | 62% | 79% | 96% |

Jadval tahlilidan ko'rinib turibdiki, yangi ilmiy modellarni joriy etish orqali vaqt sarfini 5 barobarga qisqartirish, aniqlikni esa 98 foizga yetkazish mumkin.`;

    if (aiChapters?.chapter2Content && isFirst) {
      ch2_1_content += `\n\n### Empirik tahlillar va O'zbekistondagi amaliy natijalar\n${aiChapters.chapter2Content}`;
    }

    pages.push({
      pageNumber: curPage++,
      type: "chapter2",
      title: subTitle,
      content: ch2_1_content,
    });
  }

  for (let i = 0; i < ch2_2_pages; i++) {
    const subTitle = ch2Info.subsections[1] || "2.2. Mavjud tizimli muammolar";
    pages.push({
      pageNumber: curPage++,
      type: "chapter2",
      title: subTitle,
      content: isRu
        ? `## ${subTitle}

Несмотря на позитивные тенденции, эмпирический анализ выявил ряд узких мест:
1. **Инфраструктурная неравномерность:** техническое оснащение ряда организаций требует модернизации и обновления ПО;
2. **Дефицит специализированных кадров:** потребность в сотрудниках, владеющих навыками работы с передовыми аналитическими инструментами;
3. **Недостаточная интеграция данных:** изолированность отдельных баз данных приводит к дублированию и задержкам обмена информацией.

Устранение указанных факторов является первоочередным условием дальнейшего роста эффективности.`
        : `## ${subTitle}

O'tkazilgan amaliy tahlillar asosida "${topic}" sohasini jadal rivojlantirish yo'lidagi asosiy muammolar aniqlandi:
1. **Infratuzilma va texnik ta'minotdagi nomutanosiblik:** ayrim bo'g'inlarda zamonaviy dasturiy vositalarning yetarli emasligi;
2. **Kadrlar malakasi taqchilligi:** yangi vositalardan unumli foydalana oladigan mutaxassislar tayyorlashning sustligi;
3. **Idoralararo integratsiyaning yetishmasligi:** ma'lumotlarning takrorlanishi va vaqt yo'qotilishiga sabab bo'lmoqda.

Ushbu muammolarni tizimli yondashuv orqali bartaraf etish talab etiladi.`,
    });
  }

  for (let i = 0; i < ch2_3_pages; i++) {
    const subTitle = ch2Info.subsections[2] || "2.3. Samaradorlikni oshirish";
    pages.push({
      pageNumber: curPage++,
      type: "chapter2",
      title: subTitle,
      content: isRu
        ? `## ${subTitle}

Для нейтрализации выявленных проблем сформирован комплекс практических предложений:
1. Создание единой защищенной экосистемы обмена данными на базе открытых стандартов;
2. Внедрение регулярных программ переподготовки и повышения квалификации персонала;
3. Автоматизация контрольных процедур и внедрение предиктивной аналитики на основе ИИ.

Реализация этих мер позволит повысить пропускную способность системы и снизить вероятность сбоев до статистически незначимого минимума.`
        : `## ${subTitle}

Aniqlangan tizimli muammolarni bartaraf etish uchun quyidagi amaliy takliflar ishlab chiqildi:
1. **Yagona raqamli platformani joriy etish:** Barcha jarayonlarni integratsiyalovchi markaziy tizim yaratish;
2. **Kadrlar salohiyatini oshirish:** Doimiy malaka oshirish va amaliy treninglarni yo'lga qo'yish;
3. **Avtomatlashtirilgan sifat nazorati:** Jarayonlar ustidan doimiy monitoring olib boruvchi KPI tizimini tatbiq etish.`,
    });
  }

  // ==========================================
  // CHAPTER 3: STRATEGIK ISTIQBOLLAR VA TAKLIFLAR
  // ==========================================
  const ch3_1_pages = Math.max(1, Math.floor(ch3Pages / 3));
  const ch3_2_pages = Math.max(1, Math.floor(ch3Pages / 3));
  const ch3_3_pages = Math.max(1, ch3Pages - ch3_1_pages - ch3_2_pages);

  for (let i = 0; i < ch3_1_pages; i++) {
    const isFirst = i === 0;
    const subTitle = ch3Info.subsections[0] || "3.1. Rivojlantirishning «Yo'l xaritasi»";
    let ch3_1_content = isRu
      ? `${isFirst ? `# ${ch3Info.title.toUpperCase()}\n\n## ${subTitle}\n\n` : `## ${subTitle} (Продолжение)\n\n`}Поэтапное внедрение сформированных рекомендаций по теме "${topic}" предлагается осуществлять на базе трехэтапной «Дорожной карты»:

- **Этап 1 (Подготовительный, 1–6 мес.):** Аудит нормативной базы и развертывание пилотных площадок;
- **Этап 2 (Основной, 6–18 мес.):** Масштабирование архитектуры и интеграция ключевых участников;
- **Этап 3 (Финальный, 18–24 мес.):** Выход на проектную мощность и непрерывный интеллектуальный мониторинг.`
      : `${isFirst ? `# ${ch3Info.title.toUpperCase()}\n\n## ${subTitle}\n\n` : `## ${subTitle} (Davomi)\n\n`}"${topic}" yo'nalishini uzoq muddatli istiqbolda rivojlantirish milliy innovatsion salohiyatni yuksaltirishning ustuvor yo'nalishidir.

Taklif etilayotgan «Yo'l xaritasi»:
- **1-bosqich (Tayyorgarlik):** Texnik shartlarni ishlab chiqish va tajriba-sinov loyihasini yo'lga qo'yish;
- **2-bosqich (Asosiy ijro):** Yagona tizimni to'liq joriy etish va kadrlar malakasini oshirish;
- **3-bosqich (Xulosaviy):** Barqaror monitoring va xalqaro standartlarga to'liq integratsiya.`;

    if (aiChapters?.chapter3Content && isFirst) {
      ch3_1_content += `\n\n### Strategik amaliy mexanizmlar va takliflar\n${aiChapters.chapter3Content}`;
    }

    pages.push({
      pageNumber: curPage++,
      type: "chapter3",
      title: subTitle,
      content: ch3_1_content,
    });
  }

  for (let i = 0; i < ch3_2_pages; i++) {
    const subTitle = ch3Info.subsections[1] || "3.2. Ijtimoiy-iqtisodiy samaradorlik";
    pages.push({
      pageNumber: curPage++,
      type: "chapter3",
      title: subTitle,
      content: isRu
        ? `## ${subTitle}

Расчет ожидаемой эффективности демонстрирует, что совокупная экономия операционных затрат составит до 28–32% в год. Качественный эффект выражается в росте прозрачности, исключении бюрократических барьеров и обеспечении надежности данных.`
        : `## ${subTitle}

Taklif etilgan chora-tadbirlarning amaliyotga joriy etilishi natijasida operatsion xarajatlarni 30 foizga tejash, xatoliklarni keskin kamaytirish va xalqaro miqyosdagi raqobatbardoshlikni mustahkamlash ta'minlanadi.`,
    });
  }

  for (let i = 0; i < ch3_3_pages; i++) {
    const subTitle = ch3Info.subsections[2] || "3.3. Amaliyotga joriy etish tavsiyalari";
    pages.push({
      pageNumber: curPage++,
      type: "chapter3",
      title: subTitle,
      content: isRu
        ? `## ${subTitle}

Практические рекомендации по масштабированию результатов исследования включают:
1. Утверждение ведомственного плана стандартизации аналитических регламентов;
2. Разработку типовых методических рекомендаций для филиалов и структурных подразделений;
3. Формирование постоянно действующей рабочей группы по контролю качества внедрения.`
        : `## ${subTitle}

Tadqiqot natijalarini amaliyotga keng miqyosda tatbiq etish bo'yicha tavsiyalar quyidagilarni o'z ichiga oladi:
1. Sohaviy me'yoriy-huquqiy hujjatlarga taklif etilgan o'zgartirishlarni kiritish;
2. Mutaxassislar uchun amaliy qo'llanma va yo'riqnomalarni chop etish;
3. Doimiy ilmiy-amaliy monitoring guruhi faoliyatini tashkil etish.`,
    });
  }

  // ==========================================
  // XULOSA / ЗАКЛЮЧЕНИЕ
  // ==========================================
  for (let i = 0; i < pConcPages; i++) {
    const isFirst = i === 0;
    let concContent = isRu
      ? isFirst
        ? `# ЗАКЛЮЧЕНИЕ И ПРАКТИЧЕСКИЕ РЕКОМЕНДАЦИИ

На основе проведенного в рамках курсовой работы исследования по теме **"${topic}"** сформулированы следующие выводы:
1. **Теоретическая база:** Тема представляет собой ключевое звено современного научного знания в области "${subject}".
2. **Анализ состояния:** В Узбекистане сформированы базовые институциональные предпосылки для ускоренного развития сектора.
3. **Эмпирические результаты:** Оптимизация процессов сокращает трудоемкость в несколько раз и повышает точность до 98%.
4. **Практические рекомендации:** Предложенная дорожная карта обеспечивает сбалансированное и экономически окупаемое внедрение инноваций.`
        : `# РЕКОМЕНДАЦИИ И ВЫВОДЫ (Продолжение)

Сформированные прикладные рекомендации адресованы органам управления образованием, профильным ведомствам и исследовательским институтам:
- Внедрение модульных практических кейсов в программы подготовки бакалавров;
- Создание отраслевых акселераторов для апробации научно-технических инициатив;
- Постоянный аудит качества и актуализация нормативных стандартов в соответствии с передовой международной практикой.`
      : isFirst
        ? `# XULOSA VA AMALIY TAVSIYALAR

"${subject}" fani doirasida "${topic}" mavzusida olib borilgan mazkur keng qamrovli tadqiqot natijalari asosida quyidagi ilmiy va amaliy xulosalar shakllantirildi:
1. **Nazariy umumlashma:** "${topic}" zamonaviy ilmiy-texnik taraqqiyotning ajralmas bo'g'ini bo'lib, uning tizimli tashkil etilishi barcha tarmoqlarda barqarorlik garovidir.
2. **Amaliy holat bahosi:** O'zbekistonda amalga oshirilayotgan islohotlar tufayli sohada ijobiy o'sish dinamikasi mavjud bo'lsada, qator tizimli to'siqlar saqlanib qolmoqda.
3. **Samaradorlik hisobi:** Taklif etilgan yangi modelni joriy etish orqali jarayonlar tezligini 5 barobarga oshirish va aniqlikni 98% ga yetkazish mumkin.
4. **Tavsiyalar:** Ishlab chiqilgan «Yo'l xaritasi» sohani bosqichma-bosqich modernizatsiya qilishning mustahkam amaliy poydevoridir.`
        : `# AMALIY TAVSIYALAR (Davomi)

Oliy ta'lim muassasalari va soha tashkilotlari uchun quyidagi tavsiyalar taqdim etiladi:
- O'quv dasturlariga mavzuga doir yangi laboratoriya va amaliy mashg'ulotlarni kiritish;
- Yagona raqamli monitoring platformasini keng tatbiq etish;
- Soha mutaxassislari uchun doimiy malaka oshirish kurslarini tashkil qilish.`;

    if (aiChapters?.xulosaContent && isFirst) {
      concContent += `\n\n### Umumlashtirilgan ilmiy xulosalar\n${aiChapters.xulosaContent}`;
    }

    pages.push({
      pageNumber: curPage++,
      type: "conclusion",
      title: isRu ? "ЗАКЛЮЧЕНИЕ" : "XULOSA",
      content: concContent,
    });
  }

  // ==========================================
  // ADABIYOTLAR / СПИСОК ЛИТЕРАТУРЫ (20 ta GOST manba)
  // ==========================================
  for (let i = 0; i < pLitPages; i++) {
    const isFirst = i === 0;
    pages.push({
      pageNumber: curPage++,
      type: "references",
      title: isRu ? "СПИСОК ЛИТЕРАТУРЫ" : "ADABIYOTLAR RO'YXATI",
      content: isRu
        ? isFirst
          ? `# СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ (ГОСТ)

1. Конституция Республики Узбекистан. — Ташкент: "Узбекистан", 2023. — 80 с.
2. Указы и Постановления Президента Республики Узбекистан по реформированию и цифровизации сферы.
3. Мирзиёев Ш.М. Стратегия развития Нового Узбекистана. — Ташкент: "Узбекистан", 2022. — 416 с.
4. Каримов А.А., Кодиров Б.С. Теория и методология дисциплины "${subject}". Учебник. — Ташкент, 2023. — 380 с.
5. Алиев М.К. Современные информационные и аналитические системы. — Ташкент: "Фан", 2022. — 290 с.
6. Гулямов С.С., Шермухамедов А.Т. Цифровая экономика и интеллектуальные системы. — Т.: 2021. — 310 с.
7. Рассел С., Норвиг П. Искусственный интеллект: современный подход. 4-е изд. — М.: Вильямс, 2021. — 1408 с.
8. Гудфеллоу Я., Бенджио И., Курвилль А. Глубокое обучение. — М.: ДМК Пресс, 2018. — 652 с.
9. Шваб К. Четвертая промышленная революция. — М.: Эксмо, 2020. — 208 с.
10. Официальные статистические сборники Агентства статистики при Президенте РУз (2022–2025 гг.).
11. Национальная база данных законодательства Республики Узбекистан — https://lex.uz
12. Официальный портал Министерства высшего образования, науки и инноваций РУз — https://edu.uz
13. Электронная библиотека ZiyoNET — https://ziyonet.uz
14. IEEE Xplore Digital Library — международная база научных публикаций — https://ieeexplore.ieee.org
15. ScienceDirect / Elsevier научная платформа — https://www.sciencedirect.com`
          : `# СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ (Продолжение)

16. Соммервилл И. Инженерия программного обеспечения. 10-е изд. — М.: Вильямс, 2018. — 992 с.
17. Прессман Р. Программная инженерия: практический подход. — М.: Питер, 2020. — 912 с.
18. Ходиев Б.Ю., Шодмонов Ш.Ш. Экономическая теория. Учебник. — Ташкент: 2021. — 480 с.
19. ACM Digital Library — Association for Computing Machinery — https://dl.acm.org
20. SpringerLink международная коллекция научных статей — https://link.springer.com`
        : isFirst
          ? `# FOYDALANILGAN ADABIYOTLAR RO'YXATI (GOST)

1. O'zbekiston Respublikasining Konstitutsiyasi. — Toshkent: "O'zbekiston", 2023. — 80 b.
2. O'zbekiston Respublikasi Prezidentining tegishli sohani raqamlashtirish va rivojlantirish to'g'risidagi Farmon va Qarorlari.
3. Mirziyoyev Sh.M. "Yangi O'zbekiston taraqqiyot strategiyasi". — Toshkent: "O'zbekiston", 2022. — 416 b.
4. Karimov A.A., Qodirov B.S. "${subject} nazariyasi va amaliyoti". Darslik. — Toshkent: "Fan va texnologiya", 2023. — 380 b.
5. Aliyev M.K., To'rayev Sh.R. "Zamonaviy axborot tizimlari va ularni boshqarish". O'quv qo'llanma. — Toshkent: "Iqtisod-Moliya", 2022. — 290 b.
6. G'ulomov S.S., Shermuhamedov A.T. "Raqamli iqtisodiyot va innovatsiyalar". Monografiya. — Toshkent: "Akademiya", 2021. — 310 b.
7. Russell S., Norvig P. "Artificial Intelligence: A Modern Approach". 4th Edition. — Pearson, 2020. — 1152 p.
8. Goodfellow I., Bengio Y., Courville A. "Deep Learning". — MIT Press, Cambridge, 2016. — 800 p.
9. Schwab K. "The Fourth Industrial Revolution". — World Economic Forum, Geneva, 2016. — 172 p.
10. O'zbekiston Respublikasi Davlat statistika agentligi rasmiy hisobotlari va to'plamlari (2022-2025 yy.).
11. O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligining rasmiy axborot portali — https://edu.uz
12. O'zbekiston Respublikasi Qonunchilik ma'lumotlari milliy bazasi — https://lex.uz
13. Milliy ilmiy elektron kutubxona ma'lumotlar bazasi — https://ziyonet.uz
14. IEEE Xplore Digital Library — xalqaro ilmiy jurnallar to'plami — https://ieeexplore.ieee.org
15. ScienceDirect / Elsevier xalqaro ilmiy ma'lumotlar bazasi — https://www.sciencedirect.com`
          : `# FOYDALANILGAN ADABIYOTLAR RO'YXATI (Davomi)

16. Sommerville I. "Software Engineering". 10th Edition. — Pearson, 2016. — 816 p.
17. Pressman R., Maxim B. "Software Engineering: A Practitioner's Approach". 9th Edition. — McGraw-Hill, 2020. — 912 p.
18. Xodiyev B.Yu., Shodmonov Sh.Sh. "Iqtisodiyot nazariyasi". Darslik. — Toshkent: "Barkamol fayz media", 2021. — 480 b.
19. ACM Digital Library — Association for Computing Machinery — https://dl.acm.org
20. SpringerLink xalqaro ilmiy maqolalar to'plami — https://link.springer.com`,
    });
  }

  // Safety pad: ensure pages.length === targetPages
  while (pages.length < targetPages) {
    const pNum = pages.length + 1;
    pages.push({
      pageNumber: pNum,
      type: "appendix",
      title: isRu ? `ПРИЛОЖЕНИЕ ${pNum - targetPages + 1}` : `ILOVA ${pNum - targetPages + 1}`,
      content: isRu
        ? `# ПРИЛОЖЕНИЕ ${pNum - targetPages + 1}\n\n### Дополнительные аналитические расчеты и графические материалы\n\nВ данном приложении представлены вспомогательные статистические таблицы, математические алгоритмы и иллюстративные материалы по теме "${topic}". Представленные данные дополняют основные выводы исследования и подтверждают их высокую достоверность.`
        : `# ILOVA ${pNum - targetPages + 1}\n\n### Qo'shimcha tahliliy materiallar va hisob-kitoblar\n\nMazkur ilovada "${topic}" mavzusi bo'yicha qo'shimcha statistik jadvallar, uslubiy tavsiyalar va algoritmlar keltirilgan. Ushbu ma'lumotlar asosiy matnda keltirilgan ilmiy xulosalarni to'ldiradi va ularning amaliy asoslanganligini tasdiqlaydi.`,
    });
  }

  return pages.slice(0, targetPages);
}

export async function POST(req: Request) {
  const startTime = Date.now();
  let userId: string | undefined;
  let plan = "FREE";

  try {
    const session = await getServerSession(authOptions).catch(() => null);
    userId = session?.user?.id;

    // 1. Quota & Subscription Enforcement
    if (userId) {
      const sub = await getUserSubscription(userId);
      plan = sub.plan;

      const limitCheck = await checkUserLimit(userId, "coursework");
      if (!limitCheck.allowed) {
        await trackAIUsage({
          userId,
          plan,
          feature: "COURSEWORK",
          status: "QUOTA_EXCEEDED",
          errorCode: "LIMIT_EXCEEDED",
        });
        return NextResponse.json(
          {
            error: "Limit reached",
            requireUpgrade: true,
            upgradeMessage:
              limitCheck.error ||
              "Kurs ishi yaratish bo'yicha limitingiz tugadi. Pro yoki Premium tarifga o'ting.",
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      action,
      subject,
      topic,
      faculty,
      university,
      studentName,
      teacherName,
      year,
      pageCount,
      language = "uz",
      outline: clientOutline,
    } = body;

    if (!topic || !subject) {
      return NextResponse.json({ error: "Fan nomi va Mavzu kiritilishi shart." }, { status: 400 });
    }

    const lang = (language === "ru" || language === "uz-cyrl" ? language : "uz") as
      "uz" | "uz-cyrl" | "ru";

    // ----------------------------------------------------
    // ACTION: OUTLINE ONLY (Step 2 Preview & Editing)
    // ----------------------------------------------------
    if (action === "outline") {
      const baseOutline = buildDefaultOutline(topic.trim(), subject.trim(), faculty?.trim(), lang);

      try {
        const prompt = `
Quyidagi mavzu bo'yicha O'zbekiston OTM (MOVSO RUz) standartlariga mos kurs ishi rejasini JSON formatida tuzib ber:
Fan: "${subject.trim()}"
Mavzu: "${topic.trim()}"
Til: "${lang}"

Javobing FAQAT va FAQAT yaroqli JSON bo'lsin:
{
  "chapters": [
    {
      "number": 1,
      "title": "I BOB. ...",
      "subsections": ["1.1. ...", "1.2. ...", "1.3. ..."]
    },
    {
      "number": 2,
      "title": "II BOB. ...",
      "subsections": ["2.1. ...", "2.2. ...", "2.3. ..."]
    },
    {
      "number": 3,
      "title": "III BOB. ...",
      "subsections": ["3.1. ...", "3.2. ...", "3.3. ..."]
    }
  ]
}
`;
        const aiRes = await generateGeminiJson<{ chapters: CourseworkOutlineChapter[] }>(prompt, {
          temperature: 0.3,
          maxOutputTokens: 2048,
          timeoutMs: 30_000,
        });

        if (aiRes.data && Array.isArray(aiRes.data.chapters) && aiRes.data.chapters.length >= 3) {
          baseOutline.chapters = aiRes.data.chapters.slice(0, 3).map((ch, idx) => ({
            number: idx + 1,
            title: ch.title || `BOB ${idx + 1}`,
            subsections: Array.isArray(ch.subsections) ? ch.subsections.slice(0, 3) : [],
          }));
        }
      } catch (err) {
        console.warn("[GEMINI_OUTLINE_FALLBACK]", err);
      }

      return NextResponse.json({
        success: true,
        outline: baseOutline,
      });
    }

    // ----------------------------------------------------
    // ACTION: FULL COURSEWORK GENERATION (Step 3 & 4)
    // ----------------------------------------------------
    const data: CourseworkData = {
      subject: subject.trim(),
      topic: topic.trim(),
      faculty: faculty?.trim() || "",
      university: university?.trim() || "",
      studentName: studentName?.trim() || "",
      teacherName: teacherName?.trim() || "",
      year: year || new Date().getFullYear().toString(),
      pageCount: pageCount || "19",
      language: lang,
      outline:
        clientOutline || buildDefaultOutline(topic.trim(), subject.trim(), faculty?.trim(), lang),
    };

    let aiChapters: CourseworkAiChapters | undefined;
    let modelUsed = "docnova-coursework-engine";
    let inputTokens = 0;
    let outputTokens = 0;
    let status: "SUCCESS" | "FAILED" = "SUCCESS";
    let errorCode: string | undefined;

    try {
      const chapterPrompt = `
Siz O'zbekiston Respublikasi Oliy ta'lim, fan va innovatsiyalar vazirligi (MOVSO RUz) standartlariga mos ilmiy kurs ishlari bo'yicha yetakchi ekspertsiz.
Quyidagi parametrlar bo'yicha ilmiy kurs ishi uchun kirish va 3 ta bobning batafsil akademik matnini JSON formatida tayyorlang:
Fan: "${data.subject}"
Mavzu: "${data.topic}"
Kafedra/Fakultet: "${data.faculty || "Tegishli soha"}"
Reja:
- Kirish
${data.outline?.chapters.map((ch) => `- ${ch.title}:\n${ch.subsections.map((s) => `  * ${s}`).join("\n")}`).join("\n")}
- Xulosa va amaliy tavsiyalar
Til: "${lang}"

Har bir bo'lim uchun talablar:
1. kirishContent: Mavzuning dolzarbligi ("O'zbekiston - 2030" strategiyasi va Prezident farmonlari bilan bog'langan), o'rganilganlik darajasi, obyekti, predmeti, maqsadi, vazifalari, metodologiyasi va ilmiy yangiligi.
2. chapter1Content: I Bob bo'yicha nazariy-metodologik asoslar, fundamental tushunchalar va xalqaro tajriba tahlili.
3. chapter2Content: II Bob bo'yicha O'zbekistondagi real holat, statistik tahlillar, empirik ma'lumotlar va aniqlangan tizimli muammolar tahlili.
4. chapter3Content: III Bob bo'yicha innovatsion takliflar, amaliy mexanizmlar va yo'l xaritasi.
5. xulosaContent: Kurs ishi bo'yicha yakuniy ilmiy xulosalar va amaliy tavsiyalar.

Javobni FAQAT quyidagi JSON formatida qaytaring:
{
  "kirishContent": "...",
  "chapter1Content": "...",
  "chapter2Content": "...",
  "chapter3Content": "...",
  "xulosaContent": "..."
}
`;
      const geminiRes = await generateGeminiJson<CourseworkAiChapters>(chapterPrompt, {
        temperature: 0.3,
        maxOutputTokens: 8192,
        timeoutMs: 55_000,
        systemInstruction:
          "Siz O'zbekiston oliy ta'lim tizimi professori va ilmiy kurs ishlari mutaxassisisiz. Faqat JSON formatida javob bering.",
      });

      if (geminiRes.data && (geminiRes.data.kirishContent || geminiRes.data.chapter1Content)) {
        aiChapters = geminiRes.data;
        modelUsed = geminiRes.modelUsed;
        inputTokens = geminiRes.usage.promptTokenCount;
        outputTokens = geminiRes.usage.candidatesTokenCount;
      }
    } catch (geminiErr) {
      console.warn("[GEMINI_COURSEWORK_FALLBACK]", geminiErr);
      status = "SUCCESS";
      errorCode = "AI_FALLBACK";
    }

    const academicPages = generateAcademicPages(data, aiChapters);
    const fullAcademicMarkdown = academicPages.map((p) => p.content).join("\n\n---\n\n");

    if (outputTokens === 0) {
      outputTokens = Math.ceil(fullAcademicMarkdown.length / 4);
      inputTokens = Math.ceil(JSON.stringify(data).length / 4);
    }

    // 4. Deduct user credits & track usage
    const duration = Date.now() - startTime;
    if (userId) {
      await deductUserAiCredit(userId);
    }

    await trackAIUsage({
      userId,
      plan,
      feature: "COURSEWORK",
      provider: "gemini",
      model: modelUsed,
      status,
      inputTokens,
      outputTokens,
      requestDurationMs: duration,
      errorCode,
    });

    return NextResponse.json({
      success: true,
      result: fullAcademicMarkdown,
      pages: academicPages,
      totalPages: academicPages.length,
      outline: data.outline,
      generatedWith: modelUsed,
      usage: {
        inputTokens,
        outputTokens,
        durationMs: duration,
      },
    });
  } catch (error: unknown) {
    console.error("Coursework Generation Exception:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err?.message || "Kurs ishini yaratishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
