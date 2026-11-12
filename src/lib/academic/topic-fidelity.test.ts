import { describe, expect, it } from "vitest";
import {
  IMAGE_TOPICS_CONTEXT_MARKER,
  countAcademicWords,
  detectAcademicLanguage,
  evaluateGeneratedWorkFidelity,
  extractTopicKeywords,
  formatImageTopicsTemplateContext,
  isLikelyFallbackOrStub,
  normalizeAcademicLanguageValue,
  stemAcademicToken,
} from "./topic-fidelity";

describe("topic-fidelity", () => {
  describe("detectAcademicLanguage & normalizeAcademicLanguageValue", () => {
    it("detects Uzbek Latin, Uzbek Cyrillic, Russian, and English accurately", () => {
      expect(
        detectAcademicLanguage(
          "Kvant mexanikasi va Shredinger tenglamasining fizik ma'nosi hamda o'lchash nazariyasi"
        )
      ).toBe("uz");
      expect(
        detectAcademicLanguage(
          "Ўзбекистонда қайта тикланувчи энергия манбалари ва экологик хавфсизлик"
        )
      ).toBe("uz-cyrl");
      expect(
        detectAcademicLanguage("Теория игр и равновесие Нэша в современной микроэкономике")
      ).toBe("ru");
      expect(
        detectAcademicLanguage(
          "Microservices architecture, API gateway routing, and distributed consistency"
        )
      ).toBe("en");
    });

    it("ignores trailing foreign-language bibliography when detecting prose language", () => {
      const uzbekEssayWithForeignRefs = `### Kirish
Ushbu ishda sun'iy intellekt tizimlarida neyron tarmoqlarni o'qitish usullari, gradient tushish algoritmlari hamda o'zbek tilidagi matnlarni qayta ishlash samaradorligi batafsil yoritiladi.

### Xulosa
Taklif etilgan model natijalari yuqori aniqlikni ko'rsatdi.

### Foydalanilgan adabiyotlar
1. Goodfellow I., Bengio Y., Courville A. Deep Learning. MIT Press, 2016.
2. Vaswani A. Attention Is All You Need. Advances in Neural Information Processing Systems, 2017.
3. Russell S., Norvig P. Artificial Intelligence: A Modern Approach. Pearson, 2021.`;

      expect(detectAcademicLanguage(uzbekEssayWithForeignRefs)).toBe("uz");
    });

    it("normalizes language aliases safely", () => {
      expect(normalizeAcademicLanguageValue("O'zbek (lotin)")).toBe("uz");
      expect(normalizeAcademicLanguageValue("Kirill yozuvi")).toBe("uz-cyrl");
      expect(normalizeAcademicLanguageValue("Русский")).toBe("ru");
      expect(normalizeAcademicLanguageValue("English")).toBe("en");
      expect(normalizeAcademicLanguageValue("   ")).toBeUndefined();
      expect(normalizeAcademicLanguageValue(123)).toBeUndefined();
    });
  });

  describe("stemAcademicToken & extractTopicKeywords", () => {
    it("stems inflected Uzbek, Russian, and English tokens cleanly", () => {
      expect(stemAcademicToken("korxonalarning")).toBe("korxona");
      expect(stemAcademicToken("algoritmlashtirish")).toBe("algoritm");
      expect(stemAcademicToken("экономический")).not.toBe("экономический");
      expect(stemAcademicToken("optimization")).not.toBe("optimization");
      expect(stemAcademicToken("SQL")).toBe("sql");
    });

    it("preserves short technical terms and numeric/decree codes while stripping numbering prefixes", () => {
      const profile = extractTopicKeywords(
        "Mavzu №3: SQL va REST API xavfsizligi hamda C++ dasturlash asoslari",
        "Axborot xavfsizligi",
        "PF-60 farmon ijrosi, JWT autentifikatsiya va 2025-yil standartlari"
      );

      const lowerTitle = profile.titleKeywords.map((k) => k.toLowerCase());
      expect(lowerTitle).toContain("sql");
      expect(lowerTitle).toContain("api");
      expect(lowerTitle).toContain("c++");
      expect(lowerTitle).not.toContain("mavzu");

      const lowerNotes = profile.noteKeywords.map((k) => k.toLowerCase());
      expect(lowerNotes).toContain("jwt");
      expect(profile.numericOrFormulaTokens).toEqual(expect.arrayContaining(["PF-60", "2025"]));
    });
  });

  describe("isLikelyFallbackOrStub & evaluateGeneratedWorkFidelity", () => {
    it("flags boilerplate templates and AI refusal patterns", () => {
      expect(isLikelyFallbackOrStub("")).toBe(true);
      expect(
        isLikelyFallbackOrStub(
          "Mavzu tushunchasi va nazariy asoslari bo'yicha ma'lumot. doirasida mavzuning amaliy tahlili keltirilgan."
        )
      ).toBe(true);
      expect(
        isLikelyFallbackOrStub("As an AI language model, I cannot complete this document.")
      ).toBe(true);
      expect(isLikelyFallbackOrStub("Kechirasiz, men bu mavzuni yozib bera olmayman.")).toBe(true);
    });

    it("passes faithful high-relevance Uzbek, Russian, and technical works", () => {
      const uzWork = `## Reja
1. Kvant mexanikasi postulatlari va to'lqin funksiyasi
2. Shredinger tenglamasi hamda potensial chuqurlik masalasi

### Kirish
Kvant mexanikasi mikrodunyo zarralarining harakat qonuniyatlarini va to'lqin-zarra dualizmini o'rganadigan fundamental fizika bo'limidir. Shredinger tenglamasi kvant tizimlarining holat evolyutsiyasini to'lqin funksiyasi orqali matematik tavsiflaydi hamda energetik spektrni hisoblash imkonini beradi. Zamonaviy yarimo'tkazgichlar va lazer texnologiyalari bevosita kvant mexanikasi tamoyillariga tayanadi.

### Asosiy qism
Statsionar Shredinger tenglamasi Gamilton operatorining xos qiymatlari va xos funksiyalarini topishga olib keladi. To'lqin funksiyasi modulining kvadrati zarrani fazoning ma'lum bir nuqtasida topish ehtimollik zichligini ifodalaydi va Born talqiniga ko'ra normallash shartini qanoatlantirishi shart. Tunnel effekti, garmonik ostsillyator va vodorod atomi modellari kvant mexanikasi amaliy tatbiqlarining eng muhim namunalaridir.

### Xulosa
Xulosa qilib aytganda, Shredinger tenglamasi va to'lqin funksiyasi apparati kvant mexanikasi asosida atom, molekula hamda qattiq jism xossalarini aniq bashorat qilishga xizmat qiladi.`;

      const result = evaluateGeneratedWorkFidelity({
        topicTitle: "1. Kvant mexanikasi va Shredinger tenglamasi",
        subject: "Nazariy fizika",
        notes: "To'lqin funksiyasi va Born talqini yoritilsin",
        generatedText: uzWork,
        expectedLanguage: "uz",
        expectedMinWords: 90,
      });

      expect(result.isOnTopic).toBe(true);
      expect(result.languageMatches).toBe(true);
      expect(result.isTooShortOrStub).toBe(false);
      expect(result.relevanceScore).toBeGreaterThanOrEqual(80);
      expect(result.missingTitleKeywords).toHaveLength(0);
    });

    it("rejects off-topic content where title/note domain does not match generated essay", () => {
      const wrongDomainEssay = `## Reja
1. Qishloq xo'jaligida tomchilatib sug'orish tizimlari
2. Tuproq unumdorligi va mineral o'g'itlar

### Kirish
Qishloq xo'jaligida suv resurslaridan tejamkor foydalanish va paxtachilik hosildorligini oshirish uchun zamonaviy tomchilatib sug'orish texnologiyalari joriy etilmoqda. Agronomik tadqiqotlar tuproq namligini saqlash va organik o'g'itlash samaradorligini oshirishga qaratilgan.

### Asosiy qism
Meliorativ tadbirlar hamda drenaj tarmoqlarini modernizatsiya qilish ekin maydonlarining sho'rlanish darajasini pasaytiradi. Fermer xo'jaliklarida agrotexnik xizmatlarni raqamlashtirish natijasida g'alla va sabzavot yetishtirish hajmi sezilarli darajada ortib bormoqda.

### Xulosa
Barqaror agrar siyosat oziq-ovqat xavfsizligini mustahkamlaydi.`;

      const result = evaluateGeneratedWorkFidelity({
        topicTitle: "2. Kvant mexanikasi va Shredinger tenglamasi",
        subject: "Fizika",
        notes: "To'lqin funksiyasi va tunnel effekti",
        generatedText: wrongDomainEssay,
        expectedLanguage: "uz",
        expectedMinWords: 60,
      });

      expect(result.isOnTopic).toBe(false);
      expect(result.relevanceScore).toBeLessThan(40);
      expect(result.missingTitleKeywords.length).toBeGreaterThan(0);
      expect(
        result.issues.some((msg) => msg.includes("Mavzu asosiy atamalari yetishmayapti"))
      ).toBe(true);
    });

    it("rejects language mismatch even when keywords overlap phonetically", () => {
      const englishEssayForRussianTopic = `### Introduction
This coursework analyzes macroeconomics inflation dynamics, monetary policy instruments, and central bank interest rate transmission mechanisms in emerging market economies. Understanding inflation targeting helps stabilize financial markets and price expectations across sectors.

### Conclusion
Effective monetary policy anchors long-term macroeconomic stability and sustainable output growth.`;

      const result = evaluateGeneratedWorkFidelity({
        topicTitle: "Инфляция и денежно-кредитная политика",
        generatedText: englishEssayForRussianTopic,
        expectedLanguage: "ru",
        expectedMinWords: 40,
      });

      expect(result.languageMatches).toBe(false);
      expect(result.isOnTopic).toBe(false);
      expect(result.detectedLanguage).toBe("en");
      expect(result.issues.some((msg) => msg.includes("Til mos kelmadi"))).toBe(true);
    });

    it("rejects severe stubs below expectedMinWords even when title words appear", () => {
      const stub = "Kvant mexanikasi va Shredinger tenglamasi juda muhim mavzu.";
      expect(countAcademicWords(stub)).toBe(8);

      const result = evaluateGeneratedWorkFidelity({
        topicTitle: "Kvant mexanikasi va Shredinger tenglamasi",
        generatedText: stub,
        expectedLanguage: "uz",
        expectedMinWords: 80,
      });

      expect(result.isTooShortOrStub).toBe(true);
      expect(result.isOnTopic).toBe(false);
    });
  });

  describe("formatImageTopicsTemplateContext", () => {
    it("formats topic titles, per-topic page counts, metadata, and subpoints cleanly", () => {
      const context = formatImageTopicsTemplateContext(
        [
          {
            title: "1-mavzu: Algoritmlar murakkabligi",
            content: "Big-O va rekursiya",
            pageCount: "5",
          },
          { title: "2-mavzu: Binar daraxtlar", content: "2-mavzu: Binar daraxtlar" },
        ],
        { subject: "Algoritmlar va ma'lumotlar tuzilmasi", language: "uz" }
      );

      expect(context).toContain(IMAGE_TOPICS_CONTEXT_MARKER);
      expect(context).toContain("Fan: Algoritmlar va ma'lumotlar tuzilmasi");
      expect(context).toContain("Asl til: uz");
      expect(context).toContain(
        "1. 1-mavzu: Algoritmlar murakkabligi [5 bet]\nTalab/izoh: Big-O va rekursiya"
      );
      expect(context).toContain("2. 2-mavzu: Binar daraxtlar");
      expect(context).not.toContain("Talab/izoh: 2-mavzu: Binar daraxtlar");
    });
  });
});
