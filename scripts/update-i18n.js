const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'providers', 'language-provider.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const newKeys = {
  uz: `    // Admin Panel & Nav
    adminTitle: "Admin Boshqaruv Paneli",
    adminSubtitle: "Saytning to'liq statistikasi, kirish-chiqishlar va moliyaviy holati.",
    adminOnline: "Tizim faol (Online)",
    adminTotalUsers: "Jami Foydalanuvchilar",
    adminMrr: "Oylik Tushum (MRR)",
    adminAiTokens: "Jami AI Tokenlar",
    adminActiveSubs: "Faol Obunalar",
    adminRecentUsers: "So'nggi Ro'yxatdan O'tganlar",
    adminSecurityLogs: "Xavfsizlik Jurnali",
    adminColUser: "Foydalanuvchi",
    adminColRole: "Rol",
    adminColDate: "Sana",
    adminColEvent: "Hodisa",
    adminColIp: "IP Manzil",
    adminNavTelemetry: "Statistika",
    adminNavPricing: "Tariflar",
    adminNavPromo: "Promokodlar",
    adminNavUsers: "Foydalanuvchilar",
    adminExitDashboard: "Boshqaruv paneliga qaytish",
    superAdminTitle: "Bosh Admin",
    adminPanelTitle: "Admin Panel",

    // Dashboard Recent Documents & Statuses
    recentDocsTitle: "So'nggi hujjatlar",
    viewAll: "Barchasini ko'rish",
    noDocsTitle: "Hali hujjatlaringiz yo'q",
    noDocsDesc: "AI yordamida birinchi professional hujjatingizni bir necha daqiqada yarating.",
    createNewDoc: "Yangi hujjat yaratish",
    statusCompleted: "Tayyor",
    statusInProgress: "Jarayonda",
    statusDraft: "Qoralama",

    // Documents Page
    documentsTitle: "Hujjatlar",
    documentsDesc: "Rezyumelar, arizalar va barcha hujjatlaringizni boshqaring.",

    // Plans
    planFree: "Tekin (Free)",
    planPro: "Pro",
    planPremium: "Premium",

    // AI Tools
    aiToolsTitle: "AI Asboblar Markazi",
    aiToolsDesc: "Kuchli AI yordamchilari bilan karyera hujjatlaringizni mukammallashtiring.",
    toolImproveWriting: "Yozuvni yaxshilash",
    toolImproveWritingDesc: "Matnni joylashtiring va AI uni professional ohangga keltiradi.",
    toolGenSummary: "Rezyume xulosasi yaratish",
    toolGenSummaryDesc: "Kuchli va ta'sirchan professional xulosa yarating.",
    toolGenExp: "Tajriba bandlarini tuzish",
    toolGenExpDesc: "Oddiy qoralamalarni kuchli rezyume bandlariga aylantiring.",
    toolGenCover: "Muqova xati yaratish",
    toolGenCoverDesc: "Vakansiyaga moslashtirilgan shaxsiy muqova xati tuzing.",
    toolAtsAnalyzer: "ATS Tahlilchi",
    toolAtsAnalyzerDesc: "Rezyumeyingizni zamonaviy ATS talablariga mosligini tekshiring.",
    toolTranslate: "Professional Tarjima",
    toolTranslateDesc: "Hujjatlarni professional uslubni saqlagan holda tarjima qiling.",

    // Main Hubs (Landing Page)
    hubCvBuilderTitle: "AI CV Builder Hub",
    hubCvBuilderDesc: "Live preview, ATS formatlash, 20+ shablonlar va bir bosishda eksport funksiyalarini o'zida jamlagan professional rezyume yaratuvchi.",
    hubCopilotTitle: "Nova AI Career Copilot",
    hubCopilotDesc: "Karyera va rezyume bo'yicha aqlli yordamchi. Real vaqt rejimida suhbat quring, qimmatli maslahatlar va yo'nalishlar oling.",
    hubMockTestTitle: "AI Mock Test & Til Hubi",
    hubMockTestDesc: "Ingliz va Rus tillaridagi sohaviy intervyu testlari. Grammatik hamda mantiqiy tahlil orqali zaif tomonlaringizni kuchaytiring.",`,

  ru: `    // Admin Panel & Nav
    adminTitle: "Панель администратора",
    adminSubtitle: "Полная статистика сайта, логи и финансы.",
    adminOnline: "Система онлайн",
    adminTotalUsers: "Всего пользователей",
    adminMrr: "Ежемесячный доход (MRR)",
    adminAiTokens: "Всего токенов ИИ",
    adminActiveSubs: "Активные подписки",
    adminRecentUsers: "Недавние пользователи",
    adminSecurityLogs: "Журнал безопасности",
    adminColUser: "Пользователь",
    adminColRole: "Роль",
    adminColDate: "Дата",
    adminColEvent: "Событие",
    adminColIp: "IP адрес",
    adminNavTelemetry: "Телеметрия",
    adminNavPricing: "Тарифные планы",
    adminNavPromo: "Промокоды",
    adminNavUsers: "Пользователи (CRM)",
    adminExitDashboard: "Вернуться в панель",
    superAdminTitle: "Главный Администратор",
    adminPanelTitle: "Панель Администратора",

    // Dashboard Recent Documents & Statuses
    recentDocsTitle: "Последние документы",
    viewAll: "Смотреть все",
    noDocsTitle: "У вас пока нет документов",
    noDocsDesc: "Создайте свой первый профессиональный документ с помощью ИИ за несколько минут.",
    createNewDoc: "Создать новый документ",
    statusCompleted: "Готово",
    statusInProgress: "В процессе",
    statusDraft: "Черновик",

    // Documents Page
    documentsTitle: "Документы",
    documentsDesc: "Управляйте вашими резюме, заявлениями и документами.",

    // Plans
    planFree: "Бесплатный",
    planPro: "Про (Pro)",
    planPremium: "Премиум (Premium)",

    // AI Tools
    aiToolsTitle: "Центр ИИ-инструментов",
    aiToolsDesc: "Улучшайте документы для карьеры с мощными ИИ-помощниками.",
    toolImproveWriting: "Улучшить текст",
    toolImproveWritingDesc: "Вставьте текст, и ИИ придаст ему профессиональный тон.",
    toolGenSummary: "Создать саммари",
    toolGenSummaryDesc: "Создайте сильное профессиональное резюме о себе.",
    toolGenExp: "Опыт работы",
    toolGenExpDesc: "Превратите простые заметки в сильные пункты резюме.",
    toolGenCover: "Сопроводительное письмо",
    toolGenCoverDesc: "Создайте персонализированное сопроводительное письмо.",
    toolAtsAnalyzer: "ATS Анализатор",
    toolAtsAnalyzerDesc: "Проверьте резюме на соответствие требованиям ATS.",
    toolTranslate: "Профессиональный перевод",
    toolTranslateDesc: "Переводите документы с сохранением делового стиля.",

    // Main Hubs (Landing Page)
    hubCvBuilderTitle: "AI Конструктор резюме",
    hubCvBuilderDesc: "Профессиональный конструктор резюме с предпросмотром в реальном времени, форматированием ATS, 20+ шаблонами и экспортом в 1 клик.",
    hubCopilotTitle: "Nova AI Карьерный Копилот",
    hubCopilotDesc: "Умный помощник по карьере и резюме. Общайтесь в реальном времени, получайте ценные советы и рекомендации.",
    hubMockTestTitle: "AI Пробный тест и Языковой хаб",
    hubMockTestDesc: "Отраслевые тесты на собеседованиях на английском и русском языках. Усиливайте слабые стороны с помощью анализа грамматики и логики.",`,

  en: `    // Admin Panel & Nav
    adminTitle: "Admin Dashboard",
    adminSubtitle: "Full site telemetry, logs, and financials.",
    adminOnline: "System Online",
    adminTotalUsers: "Total Users",
    adminMrr: "Monthly Revenue (MRR)",
    adminAiTokens: "Total AI Tokens",
    adminActiveSubs: "Active Subscriptions",
    adminRecentUsers: "Recent Users",
    adminSecurityLogs: "Security Logs",
    adminColUser: "User",
    adminColRole: "Role",
    adminColDate: "Date",
    adminColEvent: "Event",
    adminColIp: "IP Address",
    adminNavTelemetry: "Telemetry",
    adminNavPricing: "Pricing Engine",
    adminNavPromo: "Promo Codes",
    adminNavUsers: "Users (CRM)",
    adminExitDashboard: "Exit to Dashboard",
    superAdminTitle: "Super Admin",
    adminPanelTitle: "Admin Panel",

    // Dashboard Recent Documents & Statuses
    recentDocsTitle: "Recent Documents",
    viewAll: "View All",
    noDocsTitle: "No documents yet",
    noDocsDesc: "Create your first professional document with AI in minutes.",
    createNewDoc: "Create New Document",
    statusCompleted: "Completed",
    statusInProgress: "In Progress",
    statusDraft: "Draft",

    // Documents Page
    documentsTitle: "Documents",
    documentsDesc: "Manage your resumes, applications, and documents.",

    // Plans
    planFree: "Free",
    planPro: "Pro",
    planPremium: "Premium",

    // AI Tools
    aiToolsTitle: "AI Tools Center",
    aiToolsDesc: "Supercharge your career documents with powerful AI assistants.",
    toolImproveWriting: "Improve Writing",
    toolImproveWritingDesc: "Paste text and AI improves its professional tone.",
    toolGenSummary: "Generate Summary",
    toolGenSummaryDesc: "Generate a strong professional summary.",
    toolGenExp: "Generate Experience",
    toolGenExpDesc: "Turn simple notes into strong resume bullets.",
    toolGenCover: "Generate Cover Letter",
    toolGenCoverDesc: "Generate a personalized cover letter.",
    toolAtsAnalyzer: "ATS Analyzer",
    toolAtsAnalyzerDesc: "Analyze your resume against ATS requirements.",
    toolTranslate: "Translate",
    toolTranslateDesc: "Translate documents preserving professional tone.",

    // Main Hubs (Landing Page)
    hubCvBuilderTitle: "AI CV Builder Hub",
    hubCvBuilderDesc: "Professional resume builder with live preview, ATS formatting, 20+ templates, and one-click export.",
    hubCopilotTitle: "Nova AI Career Copilot",
    hubCopilotDesc: "Smart assistant for career and resume. Chat in real-time, get valuable tips and guidance.",
    hubMockTestTitle: "AI Mock Test & Language Hub",
    hubMockTestDesc: "Industry-specific interview tests in EN/RU. Strengthen your weaknesses through grammar and logic analysis.",`,

  tr: `    // Admin Panel & Nav
    adminTitle: "Yönetici Paneli",
    adminSubtitle: "Tam site istatistikleri, günlükler ve finansal durum.",
    adminOnline: "Sistem Çevrimiçi",
    adminTotalUsers: "Toplam Kullanıcı",
    adminMrr: "Aylık Gelir (MRR)",
    adminAiTokens: "Toplam Yapay Zeka Jetonları",
    adminActiveSubs: "Aktif Abonelikler",
    adminRecentUsers: "Son Kullanıcılar",
    adminSecurityLogs: "Güvenlik Günlüğü",
    adminColUser: "Kullanıcı",
    adminColRole: "Rol",
    adminColDate: "Tarih",
    adminColEvent: "Olay",
    adminColIp: "IP Adresi",
    adminNavTelemetry: "Telemetri",
    adminNavPricing: "Fiyatlandırma Motoru",
    adminNavPromo: "Promosyon Kodları",
    adminNavUsers: "Kullanıcılar",
    adminExitDashboard: "Panele Dön",
    superAdminTitle: "Süper Yönetici",
    adminPanelTitle: "Yönetici Paneli",

    // Dashboard Recent Documents & Statuses
    recentDocsTitle: "Son Belgeler",
    viewAll: "Tümünü Gör",
    noDocsTitle: "Henüz belgeniz yok",
    noDocsDesc: "Yapay zeka ile dakikalar içinde ilk profesyonel belgenizi oluşturun.",
    createNewDoc: "Yeni Belge Oluştur",
    statusCompleted: "Tamamlandı",
    statusInProgress: "Devam Ediyor",
    statusDraft: "Taslak",

    // Documents Page
    documentsTitle: "Belgeler",
    documentsDesc: "Özgeçmişlerinizi, başvurularınızı ve belgelerinizi yönetin.",

    // Plans
    planFree: "Ücretsiz",
    planPro: "Pro",
    planPremium: "Premium",

    // AI Tools
    aiToolsTitle: "Yapay Zeka Araçları Merkezi",
    aiToolsDesc: "Kariyer belgelerinizi güçlü yapay zeka yardımcılarıyla geliştirin.",
    toolImproveWriting: "Yazımı İyileştir",
    toolImproveWritingDesc: "Metni yapıştırın ve yapay zeka profesyonel bir tona getirsin.",
    toolGenSummary: "Özet Oluştur",
    toolGenSummaryDesc: "Güçlü bir profesyonel özet oluşturun.",
    toolGenExp: "Deneyim Maddeleri",
    toolGenExpDesc: "Basit notları güçlü özgeçmiş maddelerine dönüştürün.",
    toolGenCover: "Kapak Mektubu Oluştur",
    toolGenCoverDesc: "Kişiselleştirilmiş bir kapak mektubu oluşturun.",
    toolAtsAnalyzer: "ATS Analizörü",
    toolAtsAnalyzerDesc: "Özgeçmişinizi ATS gereksinimlerine göre analiz edin.",
    toolTranslate: "Çeviri",
    toolTranslateDesc: "Belgeleri profesyonel tonu koruyarak çevirin.",

    // Main Hubs (Landing Page)
    hubCvBuilderTitle: "AI Özgeçmiş Merkezi",
    hubCvBuilderDesc: "Canlı önizleme, ATS biçimlendirmesi, 20+ şablon ve tek tıkla dışa aktarma içeren profesyonel özgeçmiş oluşturucu.",
    hubCopilotTitle: "Nova AI Kariyer Asistanı",
    hubCopilotDesc: "Kariyer ve özgeçmiş için akıllı asistan. Gerçek zamanlı sohbet edin, değerli ipuçları ve rehberlik alın.",
    hubMockTestTitle: "AI Deneme Sınavı ve Dil Merkezi",
    hubMockTestDesc: "İngilizce ve Rusça sektörel mülakat testleri. Dilbilgisi ve mantık analiziyle zayıf yönlerinizi güçlendirin.",`
};

// Insert new keys after "filterGrammar: ...," in each section
for (const [lang, block] of Object.entries(newKeys)) {
  const markerRegex = new RegExp(`(${lang}:\\s*\\{[\\s\\S]*?filterGrammar:[^,]+,)(\\s*)`, 'm');
  if (markerRegex.test(content)) {
    content = content.replace(markerRegex, `$1\n${block}\n$2`);
    console.log(`Successfully inserted keys for ${lang}`);
  } else {
    console.error(`Could not find marker for ${lang}`);
  }
}

// Also update LanguageProvider to read localStorage on client mount AND reload on setLang
const oldProviderRegex = /export function LanguageProvider\(\{[\s\S]*?\}\)/;
const newProvider = `export function LanguageProvider({
  children,
  initialLang = "uz",
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Sync state with localStorage on client mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("DocNova-lang") as Lang;
      if (saved && (saved === "uz" || saved === "ru" || saved === "en" || saved === "tr")) {
        if (saved !== lang) {
          setLangState(saved);
        }
        document.cookie = \`NEXT_LOCALE=\${saved}; path=/; max-age=31536000; SameSite=Lax\`;
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("DocNova-lang", l);
      document.cookie = \`NEXT_LOCALE=\${l}; path=/; max-age=31536000; SameSite=Lax\`;
    } catch (e) {
      console.error(e);
    }
    // Instant reload so all server and client components immediately switch language!
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: (translations[lang] || translations.uz) as Translations }}>
      {children}
    </LanguageContext.Provider>
  );
}`;

content = content.replace(oldProviderRegex, newProvider);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('language-provider.tsx updated successfully!');
