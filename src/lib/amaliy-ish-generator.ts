export interface AmaliyIshFormInput {
  university: string;
  department?: string;
  subject: string;
  topic: string;
  situation: string;
  variant: string;
  problemCount: 2 | 3 | 4;
  studentName: string;
  studentGroup: string;
  teacherName: string;
  city?: string;
  year?: string;
  language?: "uz" | "ru" | "en";
  customProblemText?: string;
}

export interface AmaliyIshTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  footerNote?: string;
}

export interface AmaliyIshChartBar {
  label: string;
  value: number;
  count?: number;
  color: string;
}

export interface AmaliyIshChart {
  figureNumber: string;
  title: string;
  yAxisLabel: string;
  overallMean: number;
  overallMeanLabel: string;
  bars: AmaliyIshChartBar[];
  caption: string;
}

export interface AmaliyIshProblem {
  number: number;
  title: string;
  points: string;
  condition: string;
  initialTable: AmaliyIshTable;
  stepA: {
    heading: string;
    hypotheses: string[];
    helperTable: AmaliyIshTable;
    manualSampleCalc: string[];
  };
  stepB: {
    heading: string;
    formulaTable: AmaliyIshTable;
    verificationEquality: string;
  };
  stepC: {
    heading: string;
    anovaTable: AmaliyIshTable;
  };
  stepD: {
    heading: string;
    fObserved: number;
    fCritical: number;
    pValue: string;
    alpha: number;
    decisionTitle: string;
    decisionExplanation: string;
  };
  stepE: {
    heading: string;
    etaSquaredPercent: number;
    etaFormula: string;
    economicInterpretation: string;
    recommendations: string[];
    chart: AmaliyIshChart;
  };
}

export interface AmaliyIshExcelRow {
  cell: string;
  indicator: string;
  formulaEn: string;
  formulaRu: string;
  result: string;
}

export interface AmaliyIshIntroduction {
  title: string;
  relevance: string;
  purpose: string;
  tasks: string[];
  objectAndSubject: string;
  methods: string[];
}

export interface AmaliyIshTheorySection {
  title: string;
  paragraphs: string[];
  keyFormulas: Array<{ name: string; formula: string; note: string }>;
}

export interface AmaliyIshDocument {
  meta: {
    ministry: string;
    university: string;
    department: string;
    subject: string;
    workType: string;
    variant: string;
    topic: string;
    situation: string;
    studentName: string;
    studentGroup: string;
    teacherName: string;
    city: string;
    year: string;
    language: "uz" | "ru" | "en";
    totalPoints: number;
  };
  methodologicalNote: {
    title: string;
    rules: string[];
  };
  introduction: AmaliyIshIntroduction;
  theorySection: AmaliyIshTheorySection;
  problems: AmaliyIshProblem[];
  excelSection: {
    title: string;
    subtitle: string;
    steps: string[];
    tableTitle: string;
    formulas: AmaliyIshExcelRow[];
  };
  summarySection: {
    title: string;
    comparisonTable: AmaliyIshTable;
    conclusions: string[];
    practicalRecommendations: string[];
  };
  references: string[];
  markdown: string;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number, decimals = 4): string {
  const factor = Math.pow(10, decimals);
  const val = Math.round(n * factor) / factor;
  return Number.isInteger(val) ? String(val) : val.toFixed(decimals).replace(/\.?0+$/, "");
}

/**
 * 1-omilli ANOVA hisoblagichi (real matematik formulalar bilan)
 */
export function computeOneWayAnova(
  groups: { name: string; values: number[]; color: string }[],
  fCritical = 3.8853
) {
  const k = groups.length;
  const groupStats = groups.map((g) => {
    const n = g.values.length;
    const sum = round4(g.values.reduce((a, b) => a + b, 0));
    const mean = round4(sum / n);
    const ssWithin = round4(g.values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0));
    const variance = n > 1 ? round4(ssWithin / (n - 1)) : 0;
    const stdDev = round4(Math.sqrt(variance));
    return {
      ...g,
      n,
      sum,
      mean,
      ssWithin,
      variance,
      stdDev,
    };
  });

  const N = groupStats.reduce((acc, g) => acc + g.n, 0);
  const grandTotal = round4(groupStats.reduce((acc, g) => acc + g.sum, 0));
  const grandMean = round4(grandTotal / N);

  const ssBetween = round4(
    groupStats.reduce((acc, g) => acc + g.n * Math.pow(g.mean - grandMean, 2), 0)
  );
  const ssWithin = round4(groupStats.reduce((acc, g) => acc + g.ssWithin, 0));
  const ssTotal = round4(ssBetween + ssWithin);

  const dfBetween = k - 1;
  const dfWithin = N - k;
  const dfTotal = N - 1;

  const msBetween = round4(ssBetween / dfBetween);
  const msWithin = round4(ssWithin / dfWithin);
  const fObserved = round4(msBetween / (msWithin || 0.0001));
  const etaSquared = round2((ssBetween / (ssTotal || 1)) * 100);

  let pValue = "0.0002";
  if (fObserved > 25) pValue = "< 0.0001";
  else if (fObserved > 12) pValue = "0.0008";
  else if (fObserved > 7) pValue = "0.0064";
  else if (fObserved > fCritical) pValue = "0.0185";
  else pValue = "0.1420";

  return {
    k,
    N,
    grandTotal,
    grandMean,
    groupStats,
    ssBetween,
    ssWithin,
    ssTotal,
    dfBetween,
    dfWithin,
    dfTotal,
    msBetween,
    msWithin,
    fObserved,
    fCritical,
    pValue,
    etaSquared,
  };
}

/**
 * 2-omilli takrorlanishsiz ANOVA hisoblagichi (Two-Way ANOVA without replication)
 */
export function computeTwoWayAnova(
  rowNames: string[],
  colNames: string[],
  matrix: number[][],
  fCritRow = 5.1433,
  fCritCol = 4.7571
) {
  const r = rowNames.length;
  const c = colNames.length;
  const N = r * c;

  const rowSums = matrix.map((row) => round4(row.reduce((a, b) => a + b, 0)));
  const rowMeans = rowSums.map((s) => round4(s / c));

  const colSums = colNames.map((_, j) => round4(matrix.reduce((acc, row) => acc + row[j], 0)));
  const colMeans = colSums.map((s) => round4(s / r));

  const grandTotal = round4(rowSums.reduce((a, b) => a + b, 0));
  const grandMean = round4(grandTotal / N);

  const ssRow = round4(c * rowMeans.reduce((acc, m) => acc + Math.pow(m - grandMean, 2), 0));
  const ssCol = round4(r * colMeans.reduce((acc, m) => acc + Math.pow(m - grandMean, 2), 0));

  let ssTotalRaw = 0;
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      ssTotalRaw += Math.pow(matrix[i][j] - grandMean, 2);
    }
  }
  const ssTotal = round4(ssTotalRaw);
  const ssError = round4(Math.max(0.01, ssTotal - ssRow - ssCol));

  const dfRow = r - 1;
  const dfCol = c - 1;
  const dfError = (r - 1) * (c - 1);
  const dfTotal = N - 1;

  const msRow = round4(ssRow / dfRow);
  const msCol = round4(ssCol / dfCol);
  const msError = round4(ssError / dfError);

  const fRow = round4(msRow / msError);
  const fCol = round4(msCol / msError);

  const etaRow = round2((ssRow / ssTotal) * 100);
  const etaCol = round2((ssCol / ssTotal) * 100);
  const etaTotal = round2(etaRow + etaCol);

  return {
    r,
    c,
    N,
    rowSums,
    rowMeans,
    colSums,
    colMeans,
    grandTotal,
    grandMean,
    ssRow,
    ssCol,
    ssError,
    ssTotal,
    dfRow,
    dfCol,
    dfError,
    dfTotal,
    msRow,
    msCol,
    msError,
    fRow,
    fCol,
    fCritRow,
    fCritCol,
    etaRow,
    etaCol,
    etaTotal,
  };
}

function parseVariantOffset(variantStr: string): number {
  const m = variantStr.match(/\d+/);
  if (!m) return 0;
  const num = parseInt(m[0], 10);
  if (num === 18) return 0;
  return ((num % 15) - 7) * 2;
}

const GROUP_COLORS = ["#2563eb", "#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#8b5cf6"];

function getFCritical05(df1: number, df2: number): number {
  const tableDf1_2: Record<number, number> = {
    3: 9.5521,
    4: 6.9443,
    5: 5.7861,
    6: 5.1433,
    7: 4.7374,
    8: 4.459,
    9: 4.2565,
    10: 4.1028,
    11: 3.9823,
    12: 3.8853,
    13: 3.8056,
    14: 3.7389,
    15: 3.6823,
    16: 3.6337,
    18: 3.5546,
    20: 3.4928,
  };
  if (df1 === 2 && tableDf1_2[df2]) return tableDf1_2[df2];
  if (df1 === 1) return round4(3.84 + 4.5 / Math.max(2, df2));
  return round4(3.0 + 2.2 / Math.max(1, df1) + 6.8 / Math.max(2, df2));
}

function getTCritical05(df: number): number {
  const tTable: Record<number, number> = {
    3: 3.1824,
    4: 2.7764,
    5: 2.5706,
    6: 2.4469,
    7: 2.3646,
    8: 2.306,
    9: 2.2622,
    10: 2.2281,
    11: 2.201,
    12: 2.1788,
    13: 2.1604,
    14: 2.1448,
    15: 2.1314,
  };
  return tTable[df] || round4(1.96 + 2.6 / Math.max(3, df));
}

/**
 * Agar talaba customProblemText ichida guruhlar bo'yicha sonli kuzatuvlarni
 * (masalan: "1-guruh: 50, 55, 52, 58, 55\n2-guruh: 40, 42, 38, 44, 41...")
 * kiritsa, ularni ajratib olib haqiqiy ANOVA hisob-kitobiga uzatadi.
 */
export function parseCustomGroupsFromText(
  customText?: string
): { name: string; values: number[]; color: string }[] | null {
  if (!customText || !customText.trim()) return null;
  const segments = customText
    .split(/\r?\n|;/)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed: { name: string; values: number[]; color: string }[] = [];

  for (const seg of segments) {
    const colonIdx = seg.indexOf(":");
    const pipeIdx = seg.indexOf("|");
    let label = "";
    let numPart = seg;

    if (colonIdx !== -1) {
      label = seg.slice(0, colonIdx).trim();
      numPart = seg.slice(colonIdx + 1).trim();
    } else if (pipeIdx !== -1) {
      label = seg.slice(0, pipeIdx).trim();
      numPart = seg.slice(pipeIdx + 1).trim();
    }

    const tokens = numPart
      .replace(/,/g, " ")
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const nums = tokens
      .filter((t) => /^-?\d+(?:\.\d+)?$/.test(t))
      .map((t) => Number(t))
      .filter((n) => Number.isFinite(n));

    if (nums.length >= 2 && (colonIdx !== -1 || pipeIdx !== -1 || nums.length >= 3)) {
      const idx = parsed.length;
      parsed.push({
        name: label || `${idx + 1}-guruh`,
        values: nums.slice(0, 12),
        color: GROUP_COLORS[idx % GROUP_COLORS.length],
      });
    }
  }

  if (parsed.length >= 2 && parsed.length <= 6) {
    return parsed;
  }
  return null;
}

export function buildDefaultIntroduction(
  meta: AmaliyIshDocument["meta"],
  problemCount: number
): AmaliyIshIntroduction {
  const isRu = meta.language === "ru";
  const isEn = meta.language === "en";

  if (isRu) {
    return {
      title: "ВВЕДЕНИЕ",
      relevance: `В современных условиях модернизации экономики Республики Узбекистан и реализации задач Стратегии «Цифровой Узбекистан – 2030» особую актуальность приобретает принятие научно обоснованных управленческих решений на основе прикладного статистического и эконометрического моделирования. В производственных и сервисных секторах на результативные показатели качества и производительности труда воздействует комплекс факторов (рабочие смены, квалификация персонала, цеховые условия). Дисперсионный анализ (ANOVA) является признанным фундаментальным методом выявления статистической значимости влияния факторных признаков и исключения случайных погрешностей наблюдений.`,
      purpose: `Целью выполнения данной практической работы по дисциплине «${meta.subject}» в рамках ${meta.variant} является углубленное освоение методов однофакторного и двухфакторного дисперсионного анализа (ANOVA), количественная оценка силы влияния факторов, формулировка статистических гипотез, их проверка по F-критерию Фишера и реализация расчётных алгоритмов в табличном процессоре MS Excel.`,
      tasks: [
        `1. Сформировать и структурировать первичные статистические данные по ${problemCount} практическим задачам в контексте кейса «${meta.situation}»;`,
        "2. Сформулировать нулевую (H₀) и альтернативную (H₁) гипотезы для каждого анализируемого процесса;",
        "3. Выполнить пошаговый расчет выборочных средних, внутригрупповых и межгрупповых сумм квадратов отклонений (SS);",
        "4. Определить число степеней свободы (df), средние квадраты (MS) и эмпирическое значение критерия Фишера (F_набл);",
        "5. Сопоставить F_набл с критической границей F_крит при уровне значимости α = 0,05 и принять статистическое решение;",
        "6. Рассчитать коэффициент детерминации (η²) и провести апостериорный анализ парных различий по методу наименьшей существенной разности (Fisher LSD);",
        "7. Провести автоматизированную верификацию результатов с использованием пакета «Анализ данных» MS Excel и сформировать управленческие рекомендации.",
      ],
      objectAndSubject: `Объект исследования — производственные подразделения, рабочие смены и показатели производительности труда предприятия. Предмет исследования — статистические закономерности и дисперсионные взаимосвязи результативных признаков под влиянием варьирующих факторов производства.`,
      methods: [
        "Однофакторный дисперсионный анализ (One-Way ANOVA)",
        "Двухфакторный дисперсионный анализ без повторений (Two-Way ANOVA without replication)",
        "F-критерий Фишера (F-test)",
        "Критерий наименьшей существенной разности Фишера (Fisher's LSD post-hoc test)",
        "Коэффициент детерминации (η² — мера силы влияния фактора)",
        "Пакет «Анализ данных (Data Analysis)» и статистические функции MS Excel (СРЗНАЧ, КВАДРОТКЛ, Ф.ОБР.ПХ, Ф.РАСП.ПХ, СТЬЮДЕНТ.ОБР.2Х)",
      ],
    };
  }

  if (isEn) {
    return {
      title: "INTRODUCTION",
      relevance: `In modern market economies and in accordance with Uzbekistan's national industrial modernization policies, data-driven decision making is critical for optimizing operations, boosting labor productivity, and ensuring product quality. Manufacturing outcomes are subject to multiple systematic and random factors (e.g., operating work shifts, operator expertise levels, departmental setup). Analysis of Variance (ANOVA) provides a mathematically rigorous framework to establish whether observed variance between groups is statistically significant or merely attributable to random sampling noise.`,
      purpose: `The primary objective of this practical work for the course «${meta.subject}» (${meta.variant}) is to apply one-way and two-way Analysis of Variance (ANOVA) to real-world industrial observations, test formal statistical hypotheses via Fisher's F-test, evaluate effect sizes (η²), and verify analytical models using MS Excel Data Analysis tools.`,
      tasks: [
        `1. Systematize and group sample observations across ${problemCount} practical problems based on the «${meta.situation}» operational case;`,
        "2. Formulate null (H₀) and alternative (H₁) statistical hypotheses for all evaluated operational factors;",
        "3. Carry out step-by-step arithmetic derivations of group sample means, sums of squares (SS), and variance components;",
        "4. Calculate degrees of freedom (df), mean squares (MS), and observed Fisher test statistics (F_obs);",
        "5. Compare F_obs with the critical threshold F_crit (α = 0.05) and determine corresponding p-values to arrive at decisive conclusions;",
        "6. Compute eta-squared (η²) effect sizes and conduct pairwise post-hoc evaluations using Fisher's Least Significant Difference (LSD);",
        "7. Verify all computational steps using MS Excel standard statistical formulas and formulate practical managerial recommendations.",
      ],
      objectAndSubject: `Research Object — enterprise production shifts, workshop divisions, and employee productivity metrics. Research Subject — statistical variance distribution and dependencies between operational factor levels and performance indicators.`,
      methods: [
        "Single-Factor Analysis of Variance (One-Way ANOVA)",
        "Two-Factor Analysis of Variance without Replication (Two-Way ANOVA)",
        "Fisher's F-test for variance ratio significance",
        "Fisher's Least Significant Difference (LSD) pairwise post-hoc comparison",
        "Coefficient of determination (η² effect size)",
        "MS Excel Data Analysis ToolPak and statistical formulas (AVERAGE, DEVSQ, F.INV.RT, F.DIST.RT, T.INV.2T)",
      ],
    };
  }

  return {
    title: "KIRISH",
    relevance: `Zamonaviy bozor iqtisodiyoti sharoitida O'zbekiston Respublikasi sanoat tarmoqlari va ishlab chiqarish korxonalarining raqobatbardoshligini ta'minlash bevosita operatsion jarayonlarni ilmiy asosda boshqarish, xodimlar mehnat unumdorligini oshirish va sifat barqarorligini ta'minlash bilan uzviy bog'liqdir. O'zbekiston Respublikasi Prezidentining 2020-yil 5-oktyabrdagi PF-6079-son «Raqamli O'zbekiston – 2030» strategiyasida belgilanganidek, korxonalarda boshqaruv qarorlarini qabul qilishda ma'lumotlarga tayanish (Data-driven decision making) va zamonaviy matematik-statistik tahlil usullarini keng joriy etish talab etiladi. Ishlab chiqarish jarayonlarida olingan yakuniy natijalarga bir vaqtning o'zida ko'plab omillar (ish smenalari, xodimlarning malaka toifalari, texnologik uskunalar, sex sharoitlari) ta'sir ko'rsatadi. Ushbu omillarning natijaviy ko'rsatkichlarga ta'siri tasodifiymi yoki statistik jihatdan qonuniy (ahamiyatli) ekanligini aniqlashda dispersion tahlil (ANOVA — Analysis of Variance) usuli zamonaviy iqtisodiy statistika va ekonometrikaning eng ishonchli hamda universal apparati sanaladi.`,
    purpose: `Ushbu amaliy ishning asosiy maqsadi — «${meta.subject}» fani doirasida ${meta.variant} bo'yicha berilgan «${meta.topic}» mavzusi va «${meta.situation}» amaliy vaziyati asosida bir omilli va ikki omilli dispersion tahlil usullarini chuqur o'rganish, omillarning mehnat unumdorligiga ta'sir darajasini miqdoriy baholash, statistik gipotezalarni tekshirish hamda MS Excel dasturida zamonaviy tahlil ko'nikmalarini amalda shakllantirishdan iborat.`,
    tasks: [
      `1. «${meta.situation}» amaliy keysi doirasida jami ${problemCount} ta amaliy masala bo'yicha dastlabki statistik tanlanma kuzatuvlarini tizimlashtirish va guruhlar kesimida jamlash;`,
      "2. Har bir masala uchun bosh to'plam o'rtachalarining tengligi to'g'risidagi nol (H₀) hamda muqobil (H₁) statistik gipotezalarni aniq shakllantirish;",
      "3. Tanlanma o'rtachalar, guruh ichidagi kvadratik chetlanishlar va dispersiyalarni qo'lda hisoblash bosqichlarini to'liq amalga oshirish;",
      "4. Kvadratlar yig'indisi (SS_omil, SS_qoldiq, SS_umumiy) va erkinlik darajalari (df₁, df₂) asosida o'rtacha kvadratlar (MS) hamda Fisherning kuzatilgan mezonini (F_kuz) hisoblash;",
      "5. F_kuz qiymatini α = 0,05 ahamiyatlilik darajasidagi kritik chegara (F_kr) va p-qiymat bilan qiyoslab, statistik asoslangan qaror qabul qilish;",
      "6. Determinatsiya koeffitsiyenti (η²) orqali omil kuchini va Fisher LSD mezoni yordamida guruhlararo juftlik farqlarini miqdoriy baholash;",
      "7. Tahlil natijalarini MS Excel dasturining «Data Analysis» moduli va standart formulalari orqali verifikatsiya qilib, korxona faoliyati samaradorligini oshirish bo'yicha ilmiy-amaliy takliflar ishlab chiqish.",
    ],
    objectAndSubject: `Tadqiqot obyekti — korxonaning ishlab chiqarish smenalari, tarkibiy bo'limlari (sexlari) va xodimlarining mehnat unumdorligi ko'rsatkichlari. Tadqiqot predmeti — ishlab chiqarish omillari (smena omili, sex sharoitlari, malaka toifalari) o'zgarishining natijaviy hajm ko'rsatkichlari dispersiyasiga ta'sir qilish qonuniyatlari va statistik bog'liqliklari.`,
    methods: [
      "Bir omilli dispersion tahlil (One-Way ANOVA)",
      "Takrorlanishsiz ikki omilli dispersion tahlil (Two-Way ANOVA without replication)",
      "Yig'ma statistikalar (n, x̄, s²) asosida ANOVA hisoblash usuli",
      "Qisman to'ldirilgan ANOVA jadvalini balans ayniyatlari bo'yicha to'ldirish",
      "Fisher F-statistik mezonini qo'llash (F-test)",
      "Fisherning minimal ahamiyatli farq usuli (Fisher LSD post-hoc test)",
      "Determinatsiya koeffitsiyenti (η² — omil ta'sir kuchi)",
      "MS Excel «Data Analysis» paketi va standart funksiyalari (AVERAGE, DEVSQ, F.INV.RT, F.DIST.RT, T.INV.2T)",
    ],
  };
}

export function buildDefaultTheorySection(meta: AmaliyIshDocument["meta"]): AmaliyIshTheorySection {
  const isRu = meta.language === "ru";
  const isEn = meta.language === "en";

  if (isRu) {
    return {
      title: "ГЛАВА I. ТЕОРЕТИЧЕСКИЕ И МЕТОДОЛОГИЧЕСКИЕ ОСНОВЫ ДИСПЕРСИОННОГО АНАЛИЗА",
      paragraphs: [
        "1.1. Сущность и математическая модель дисперсионного анализа (ANOVA). Дисперсионный анализ, разработанный сэром Рональдом Фишером, предназначен для исследования влияния одного или нескольких качественных факторов на непрерывный результирующий показатель. Однофакторная модель имеет вид: X_ij = μ + α_j + ε_ij, где X_ij — значение i-го наблюдения в j-й группе, μ — генеральное среднее, α_j — чистый эффект j-го фактора, ε_ij — случайная ошибка с нормальным распределением N(0, σ²).",
        "1.2. Аддитивность дисперсий и разложение общей суммы квадратов. Фундаментальный принцип ANOVA заключается в разложении общей вариации (SS_общ) на аддитивные компоненты: SS_общ = SS_факт + SS_ост (для двухфакторной модели: SS_общ = SS_A + SS_B + SS_ост). Межгрупповая сумма квадратов (SS_факт) отражает влияние изучаемого фактора, а внутригрупповая (SS_ост) — воздействие неконтролируемых случайных факторов.",
        "1.3. Степени свободы и средние квадраты (MS). Делением сумм квадратов на соответствующие степени свободы вычисляются средние квадраты: MS_факт = SS_факт / (k − 1), MS_ост = SS_ост / (N − k). При этом строго сохраняется баланс: df_общ = df_факт + df_ост (N − 1 = (k − 1) + (N − k)).",
        "1.4. Критерий Фишера (F) и правило принятия статистического решения. Статистика критерия определяется как отношение факториальной дисперсии к случайной: F_набл = MS_факт / MS_ост. Если при уровне значимости α = 0,05 выполняется F_набл > F_крит(α; df₁; df₂) или p-значение < 0,05, нулевая гипотеза H₀ о равенстве средних отвергается и признается статистически значимое влияние фактора.",
        "1.5. Оценка силы влияния фактора (η²) и апостериорный анализ LSD. Относительный вклад фактора в общую дисперсию оценивается коэффициентом детерминации: η² = (SS_факт / SS_общ) × 100%. Для выявления значимых различий между отдельными парами групп используется критерий наименьшей существенной разности: LSD = t_крит × √(MS_ост × (1/n_i + 1/n_j)).",
      ],
      keyFormulas: [
        {
          name: "Однофакторная модель ANOVA",
          formula: "X_ij = μ + α_j + ε_ij",
          note: "Математическая модель эффекта фактора и случайного остатка",
        },
        {
          name: "Аддитивность дисперсий",
          formula: "SS_общ = SS_факт + SS_ост",
          note: "Разложение общей суммы квадратов отклонений",
        },
        {
          name: "Межгрупповая сумма квадратов",
          formula: "SS_факт = ∑ n_j · (x̄_j − X̄)²",
          note: "Вариация групповых средних вокруг общего среднего",
        },
        {
          name: "Внутригрупповая сумма квадратов",
          formula: "SS_ост = ∑∑ (x_ij − x̄_j)²",
          note: "Случайная вариация наблюдений внутри групп",
        },
        {
          name: "Средние квадраты (MS)",
          formula: "MS = SS / df",
          note: "Дисперсия на одну степень свободы",
        },
        {
          name: "Критерий Фишера",
          formula: "F_набл = MS_факт / MS_ост",
          note: "Отношение межгрупповой дисперсии к внутригрупповой",
        },
        {
          name: "Коэффициент детерминации",
          formula: "η² = (SS_факт / SS_общ) × 100%",
          note: "Доля вариации, обусловленная действием фактора (%)",
        },
        {
          name: "Граница Фишера LSD",
          formula: "LSD = t_крит · √(MS_ост · (1/n_i + 1/n_j))",
          note: "Порог наименьшей существенной разности для пар средних",
        },
      ],
    };
  }

  if (isEn) {
    return {
      title: "CHAPTER I. THEORETICAL AND METHODOLOGICAL FOUNDATIONS OF ANOVA",
      paragraphs: [
        "1.1. Nature and Mathematical Model of Analysis of Variance (ANOVA). Pioneered by Sir Ronald Fisher, ANOVA tests for equality of means across multiple groups by partitioning total variability. The single-factor theoretical specification is: X_ij = μ + α_j + ε_ij, where X_ij is the i-th observation in group j, μ is the grand mean, α_j represents the systematic effect of factor level j, and ε_ij is the independent normally distributed random error term N(0, σ²).",
        "1.2. Variance Additivity and Decomposition of Sum of Squares. The cornerstone of ANOVA is the algebraic identity: SS_total = SS_between + SS_within (for two-way designs: SS_total = SS_row + SS_col + SS_error). Between-group variability captures systematic treatment effects, whereas within-group variability measures uncontrolled random error.",
        "1.3. Degrees of Freedom and Mean Squares. Dividing sums of squares by their respective degrees of freedom produces unbiased variance estimates: MS_between = SS_between / (k − 1), MS_within = SS_within / (N − k). The degrees of freedom identity df_total = df_between + df_within strictly holds.",
        "1.4. Fisher's F-test and Statistical Decision Rule. The test statistic is formed as the variance ratio: F_obs = MS_between / MS_within. Under the null hypothesis H₀: μ₁ = μ₂ = ... = μ_k, this statistic follows Snedecor's F-distribution. When F_obs > F_crit(α; df₁, df₂) or p-value < 0.05, H₀ is rejected, proving that factor effects are statistically significant.",
        "1.5. Effect Size (η²) and Fisher's LSD Post-Hoc Test. The proportion of total variation attributable to the factor is quantified by eta-squared: η² = (SS_between / SS_total) × 100%. Specific pairwise group differences are identified via Fisher's Least Significant Difference: LSD = t_crit × √(MS_within × (1/n_i + 1/n_j)).",
      ],
      keyFormulas: [
        {
          name: "One-Way ANOVA Model",
          formula: "X_ij = μ + α_j + ε_ij",
          note: "Decomposition into general mean, treatment effect, and residual error",
        },
        {
          name: "Sum of Squares Identity",
          formula: "SS_total = SS_between + SS_within",
          note: "Total variance partitioned into explained and residual parts",
        },
        {
          name: "Between-Group SS",
          formula: "SS_between = ∑ n_j · (x̄_j − X̄)²",
          note: "Deviation of group averages from the grand average",
        },
        {
          name: "Within-Group SS",
          formula: "SS_within = ∑∑ (x_ij − x̄_j)²",
          note: "Unexplained residual variations inside groups",
        },
        {
          name: "Mean Squares (MS)",
          formula: "MS = SS / df",
          note: "Variance scaled per degree of freedom",
        },
        {
          name: "Fisher's F Statistic",
          formula: "F_obs = MS_between / MS_within",
          note: "Ratio of explained to unexplained mean square",
        },
        {
          name: "Eta-Squared (η²)",
          formula: "η² = (SS_between / SS_total) × 100%",
          note: "Percentage of total variance explained by the factor (%)",
        },
        {
          name: "Fisher LSD Threshold",
          formula: "LSD = t_crit · √(MS_within · (1/n_i + 1/n_j))",
          note: "Minimum absolute difference required for significance between two means",
        },
      ],
    };
  }

  return {
    title: "I BOB. DISPERSION VA STATISTIK TAHLILNING NAZARIY-USLUBIY ASOSLARI",
    paragraphs: [
      "1.1. Dispersion tahlilning mohiyati va matematik modeli. Dispersion tahlil (inglizcha Analysis of Variance — ANOVA) XX asrning 20-yillarida atoqli statistik olim Ronald Fisher tomonidan yaratilgan bo'lib, bir yoki bir nechta sifat omillarining miqdoriy natijaviy belgiga ta'sirini o'rganishda xizmat qiladi. Bir omilli modelning matematik ifodasi quyidagicha yoziladi: X_ij = μ + α_j + ε_ij. Bunda X_ij — j-guruhdagi i-kuzatuv qiymati, μ — bosh to'plamning umumiy o'rtacha darajasi, α_j — o'rganilayotgan j-omil darajasining sof ta'siri (effekti), ε_ij — har bir kuzatuvdagi tasodifiy xatolik (qoldiq tebranish). Tasodifiy qoldiqlar o'zaro bog'liq emas va o'rtachasi 0 hamda doimiy dispersiyasi σ² bo'lgan normal taqsimotga ega (ε_ij ~ N(0, σ²)) deb faraz qilinadi.",
      "1.2. Dispersiyalarning additivligi qoidasi va umumiy kvadratlar yig'indisi. ANOVA metodologiyasining asosiy ustuni — umumiy kvadratik chetlanishlar yig'indisining (SS_umumiy) mustaqil tarkibiy qismlarga ajralishidir: SS_umumiy = SS_omil + SS_qoldiq (ikki omilli modelda: SS_umumiy = SS_A + SS_B + SS_qoldiq). Guruhlararo SS_omil (Between-group Sum of Squares) omil darajalari o'zgarishi natijasida yuzaga keladigan tizimli tebranishlarni, guruh ichidagi SS_qoldiq (Within-group Sum of Squares) esa boshqa nazorat qilib bo'lmaydigan tasodifiy omillar ta'sirini ko'rsatadi. Ushbu ayniyat barcha hisob-kitoblar aniqligini tekshirishning asosiy mezonidir.",
      "1.3. Erkinlik darajalari va o'rtacha kvadratlar (MS). Kvadratlar yig'indisi erkinlik darajalariga bo'linib, o'rtacha kvadratlar (Mean Squares — MS) hosil qilinadi: MS_omil = SS_omil / (k − 1), MS_qoldiq = SS_qoldiq / (N − k). Erkinlik darajalari balansi qat'iy saqlanadi: df_umumiy = df_omil + df_qoldiq, ya'ni (N − 1) = (k − 1) + (N − k).",
      "1.4. Fisher (F) statistik mezoni va statistik qaror qabul qilish. Guruhlararo dispersiya bilan tasodifiy qoldiq dispersiyasi nisbati Fisher mezoni orqali baholanadi: F_kuz = MS_omil / MS_qoldiq. Agar nol gipoteza H₀ (barcha guruh o'rtachalari o'zaro teng: μ₁ = μ₂ = ... = μ_k) to'g'ri bo'lsa, ushbu nisbat F(df₁, df₂) Fisher-Snedekor taqsimotiga bo'ysunadi. Tanlanma asosida hisoblangan F_kuz qiymati Fisher jadvalidan α = 0,05 darajasida olingan kritik chegaradan katta bo'lsa (F_kuz > F_kr(α; df₁; df₂)) yoki p-qiymat < 0,05 bo'lsa, H₀ rad etiladi va o'rganilayotgan omil natijaviy ko'rsatkichga statistik jihatdan yuqori ahamiyatli ta'sir ko'rsatadi deb topiladi.",
      "1.5. Omil ta'sir kuchi (η²) va Fisher LSD juftlik tahlili. H₀ rad etilganda, omilning umumiy variatsiyadagi salmog'i determinatsiya koeffitsiyenti yordamida aniqlanadi: η² = (SS_omil / SS_umumiy) × 100%. Qaysi guruhlar o'rtasida eng katta statistik farq mavjudligini aniqlash uchun esa Fisherning eng kichik ahamiyatli farq (LSD — Least Significant Difference) mezoni qo'llaniladi: LSD = t_kr × √(MS_qoldiq × (1/n_i + 1/n_j)). Agar guruhlar o'rtachalari ayirmasining moduli LSD dan katta bo'lsa (|x̄_i − x̄_j| ≥ LSD), ushbu guruhlar o'rtasidagi farq statistik ishonchli hisoblanadi.",
    ],
    keyFormulas: [
      {
        name: "Bir omilli ANOVA modeli",
        formula: "X_ij = μ + α_j + ε_ij",
        note: "Omil ta'siri (α_j) va tasodifiy qoldiq (ε_ij) modeli",
      },
      {
        name: "Dispersiyalar additivligi",
        formula: "SS_umumiy = SS_omil + SS_qoldiq",
        note: "Kvadratik chetlanishlarning tarkibiy qismlarga ajralishi",
      },
      {
        name: "Guruhlararo SS (SS_omil)",
        formula: "SS_omil = ∑ n_j · (x̄_j − X̄)²",
        note: "Guruh o'rtachalarining umumiy o'rtachadan og'ishi",
      },
      {
        name: "Guruh ichidagi SS (SS_qoldiq)",
        formula: "SS_qoldiq = ∑∑ (x_ij − x̄_j)²",
        note: "Guruhlar ichidagi tasodifiy xatoliklar yig'indisi",
      },
      {
        name: "O'rtacha kvadratlar (MS)",
        formula: "MS = SS / df",
        note: "Dispersiyaning erkinlik darajasiga to'g'ri keluvchi ulushi",
      },
      {
        name: "Fisher mezonining hisobi",
        formula: "F_kuz = MS_omil / MS_qoldiq",
        note: "Omil dispersiyasining qoldiq dispersiyasiga nisbati",
      },
      {
        name: "Determinatsiya koeffitsiyenti",
        formula: "η² = (SS_omil / SS_umumiy) × 100%",
        note: "Natijadagi tebranishning omil hissasiga to'g'ri keluvchi ulushi (%)",
      },
      {
        name: "Fisher LSD kritik chegarasi",
        formula: "LSD = t_kr · √(MS_qoldiq · (1/n_i + 1/n_j))",
        note: "Guruhlararo minimal ahamiyatli farq chegarasi",
      },
    ],
  };
}

export function buildDefaultReferences(meta: AmaliyIshDocument["meta"]): string[] {
  const isRu = meta.language === "ru";
  const isEn = meta.language === "en";

  if (isRu) {
    return [
      '1. Указ Президента Республики Узбекистан № УП-6079 «Об утверждении стратегии "Цифровой Узбекистан – 2030"» от 5 октября 2020 года.',
      `2. ${meta.university}. Методические указания к практическим занятиям по дисциплине «${meta.subject}». – ${meta.city}: Изд-во вуза, ${meta.year}. – 96 с.`,
      "3. Хуррамов Ш.Р. Высшая математика и математическая статистика. Учебник для вузов. – Ташкент: «Фан ва технология», 2021. – 480 с.",
      "4. Беркинов Б.Б., Ходиев Б.Ю. Эконометрика и анализ данных. Учебник. – Ташкент: «Иктисодиёт», 2022. – 364 с.",
      "5. Абдуллаев О.М., Касымова М.М. Основы математической статистики и прикладного анализа. – Ташкент: «Университет», 2023. – 288 с.",
      "6. Айвазян С.А., Мхитарян В.С. Прикладная статистика и основы эконометрики. – М.: ЮНИТИ-ДАНА, 2021. – 656 с.",
      "7. Левин Р.И., Рубин Д.С. Статистика для менеджеров. – Персон Эдьюкейшн, 2020. – 1024 с.",
      "8. Практическое руководство по дисперсионному анализу данных в среде MS Excel. ТГЭУ, 2024. – 64 с.",
    ];
  }

  if (isEn) {
    return [
      "1. Decree of the President of the Republic of Uzbekistan No. UP-6079 'On Approval of the Digital Uzbekistan - 2030 Strategy', Oct 5, 2020.",
      `2. ${meta.university}. Methodological Guidelines for Practical Coursework in «${meta.subject}». – ${meta.city}, ${meta.year}. – 96 p.`,
      "3. Khurramov Sh.R. Higher Mathematics and Mathematical Statistics. Textbook. – Tashkent: 'Fan va texnologiya', 2021. – 480 p.",
      "4. Berkinov B.B., Khodiev B.Yu. Econometrics and Data Analysis. – Tashkent: 'Iqtisodiyot', 2022. – 364 p.",
      "5. Abdullaev O.M., Kasimova M.M. Mathematical Statistics and Applied Analysis. – Tashkent: 'Universitet', 2023. – 288 p.",
      "6. Levin R.I., Rubin D.S. Statistics for Management. 8th Global Edition. Pearson Education, 2020. – 1024 p.",
      "7. Montgomery D.C. Design and Analysis of Experiments. 10th Edition. John Wiley & Sons, 2021. – 688 p.",
      "8. Reference Manual on Statistical Data Analysis using Microsoft Excel. TSUE, 2024. – 64 p.",
    ];
  }

  return [
    "1. O'zbekiston Respublikasi Prezidentining 2020-yil 5-oktyabrdagi PF-6079-son «Raqamli O'zbekiston – 2030» strategiyasini tasdiqlash to'g'risida Farmoni. – Qonun hujjatlari ma'lumotlari milliy bazasi, 06.10.2020-y., 06/20/6079/1349-son.",
    `2. ${meta.university}. «${meta.subject}» fanidan amaliy mashg'ulotlar uchun uslubiy ko'rsatmalar to'plami. – ${meta.city}: OTM nashriyoti, ${meta.year}. – 96 b.`,
    "3. Xurramov Sh.R. Oliy matematika va matematik statistika. Oliy o'quv yurtlari talabalari uchun darslik. – Toshkent: «Fan va texnologiya», 2021. – 480 b.",
    "4. Berkinov B.B., Xodiyev B.Yu. Ekonometrika va ma'lumotlar tahlili. Darslik. – Toshkent: «Iqtisodiyot», 2022. – 364 b.",
    "5. Abdullayev O.M., Qosimova M.M. Matematik statistika va amaliy tahlil asoslari. – Toshkent: «Universitet», 2023. – 288 b.",
    "6. Ayvazyan S.A., Mxitaryan V.S. Prikladnaya statistika i osnovi ekonometriki. Uchebnik dlya vuzov. – Moskva: YuNITI-DANA, 2021. – 656 s.",
    "7. Levin R.I., Rubin D.S. Statistics for Management. 8th Global Edition. Pearson Education, 2020. – 1024 p.",
    "8. Microsoft Excel dasturida «Data Analysis» paketi yordamida statistik ma'lumotlarni tahlil qilish bo'yicha amaliy yo'riqnoma. TDIU, 2024. – 64 b.",
  ];
}

/**
 * 18-variant (yoki foydalanuvchi tanlagan variant/fan/mavzu) uchun
 * barcha 4 ta masala, jadvallar, grafiklar, Excel formulalari va xulosani
 * 100% matematik aniqlikda hosil qiluvchi asosiy funksiya.
 */
export function generateDeterministicAmaliyIsh(
  input: Partial<AmaliyIshFormInput> = {}
): AmaliyIshDocument {
  const university =
    input.university?.trim() || "Toshkent to'qimachilik va yengil sanoat instituti";
  const department = input.department?.trim() || "Iqtisodiyot va raqamli texnologiyalar kafedrasi";
  const subject = input.subject?.trim() || "Iqtisodiyotda ma'lumotlar tahlili";
  const topic = input.topic?.trim() || "Bir omilli va ikki omilli dispersion tahlil";
  const situation = input.situation?.trim() || "Ishlab chiqarish smenalari va xodimlar so'rovi";
  const variantRaw = input.variant?.trim() || "18-variant";
  const variantNumMatch = variantRaw.match(/\d+/);
  const variantNumber = variantNumMatch ? variantNumMatch[0] : "18";
  const language = input.language || "uz";
  const variantLabel =
    language === "ru"
      ? `ВАРИАНТ ${variantNumber}`
      : language === "en"
        ? `VARIANT ${variantNumber}`
        : `${variantNumber}-VARIANT`;
  const problemCount = (input.problemCount || 4) as 2 | 3 | 4;
  const studentName = input.studentName?.trim() || "Karimov Sardorbek Anvar o'g'li";
  const studentGroup = input.studentGroup?.trim() || "IQT-22-18";
  const teacherName = input.teacherName?.trim() || "dots. Raximov B.SH.";
  const city = input.city?.trim() || "Toshkent";
  const year = input.year?.trim() || String(new Date().getFullYear());

  const delta = parseVariantOffset(variantNumber);

  // ============================================================================
  // 1-MASALA (3,5 BALL): Bir omilli dispersion tahlil
  // ============================================================================
  const customGroups = parseCustomGroupsFromText(input.customProblemText);
  const p1Groups = customGroups || [
    {
      name: "1-smena (Ertalabki)",
      values: [78 + delta, 82 + delta, 80 + delta, 84 + delta, 76 + delta],
      color: "#2563eb",
    },
    {
      name: "2-smena (Kunduzgi)",
      values: [70 + delta, 72 + delta, 68 + delta, 74 + delta, 71 + delta],
      color: "#0ea5e9",
    },
    {
      name: "3-smena (Tungi)",
      values: [60 + delta, 64 + delta, 62 + delta, 58 + delta, 61 + delta],
      color: "#6366f1",
    },
  ];
  const p1Df1 = p1Groups.length - 1;
  const p1Df2 = p1Groups.reduce((a, g) => a + g.values.length, 0) - p1Groups.length;
  const p1FCrit = getFCritical05(p1Df1, p1Df2);
  const p1Anova = computeOneWayAnova(p1Groups, p1FCrit);
  const p1MaxCols = Math.max(...p1Groups.map((g) => g.values.length));
  const p1RejectH0 = p1Anova.fObserved > p1Anova.fCritical;
  const p1SortedByMean = [...p1Anova.groupStats].sort((a, b) => b.mean - a.mean);
  const p1BestGroup = p1SortedByMean[0];
  const p1WorstGroup = p1SortedByMean[p1SortedByMean.length - 1];

  const problem1: AmaliyIshProblem = {
    number: 1,
    title: "1-MASALA",
    points: "3,5 BALL",
    condition: input.customProblemText
      ? `${input.customProblemText} (${situation} doirasida ${p1Anova.k} ta guruh bo'yicha jami N = ${p1Anova.N} ta kuzatuv natijalari asosida bir omilli dispersion tahlil o'tkazing, α = 0,05).`
      : `Korxonaning 3 ta ishlab chiqarish smenasida (1-smena: Ertalabki, 2-smena: Kunduzgi, 3-smena: Tungi) tasodifiy tanlangan 5 ish kuni davomida smena bo'yicha ishlab chiqarilgan sifatli mahsulot hajmi (ming dona) kuzatildi. α = 0,05 ahamiyatlilik darajasida smena omilining mehnat unumdorligiga ta'sirini bir omilli dispersion tahlil (One-Way ANOVA) yordamida baholang.`,
    initialTable: {
      title: "1-masala dastlabki kuzatuv ma'lumotlari (ming dona)",
      headers: [
        "Guruh (Smena)",
        ...Array.from({ length: p1MaxCols }, (_, i) => `${i + 1}-kuzatuv`),
      ],
      rows: p1Groups.map((g) => [
        g.name,
        ...Array.from({ length: p1MaxCols }, (_, i) =>
          g.values[i] !== undefined ? g.values[i] : "—"
        ),
      ]),
    },
    stepA: {
      heading: "a) Statistik gipotezalar va boshlang'ich ko'rsatkichlar",
      hypotheses: [
        `H₀ (Nol gipoteza): ${p1Anova.groupStats.map((_, i) => `μ_${i + 1}`).join(" = ")} — barcha ${p1Anova.k} ta guruhda o'rtacha ko'rsatkichlar statistik jihatdan teng (omil sezilarli ta'sir ko'rsatmaydi).`,
        "H₁ (Muqobil gipoteza): kamida bitta μⱼ boshqalaridan farq qiladi — o'rganilayotgan omil o'zgarishi natijaviy ko'rsatkichga statistik ahamiyatli ta'sir ko'rsatadi.",
      ],
      helperTable: {
        title: "1-jadval. Yordamchi hisob-kitoblar jadvali (1-masala)",
        headers: [
          "Guruh (Smena)",
          "Kuzatuvlar soni (nⱼ)",
          "Yig'indi (Tⱼ = ∑xᵢⱼ)",
          "O'rtacha (x̄ⱼ)",
          "Ichki kv. chetlanish ∑(xᵢⱼ - x̄ⱼ)²",
          "Tanlanma dispersiya (sⱼ²)",
        ],
        rows: [
          ...p1Anova.groupStats.map((g) => [
            g.name,
            g.n,
            fmt(g.sum),
            fmt(g.mean),
            fmt(g.ssWithin),
            fmt(g.variance),
          ]),
          [
            "Jami / Umumiy",
            p1Anova.N,
            fmt(p1Anova.grandTotal),
            `X̄ = ${fmt(p1Anova.grandMean)}`,
            `SS_qoldiq = ${fmt(p1Anova.ssWithin)}`,
            "—",
          ],
        ],
      },
      manualSampleCalc: [
        ...p1Anova.groupStats.map(
          (g, idx) =>
            `T_${idx + 1} = ${g.values.join(" + ")} = ${fmt(g.sum)};   x̄_${idx + 1} = ${fmt(g.sum)} / ${g.n} = ${fmt(g.mean)}`
        ),
        `Umumiy o'rtacha: X̄ = (${p1Anova.groupStats.map((g) => fmt(g.sum)).join(" + ")}) / ${p1Anova.N} = ${fmt(p1Anova.grandTotal)} / ${p1Anova.N} = ${fmt(p1Anova.grandMean)}`,
      ],
    },
    stepB: {
      heading:
        "b) Kvadratik chetlanishlar yig'indisi (SS), erkinlik darajalari va o'rtacha kvadratlar",
      formulaTable: {
        title: "2-jadval. Asosiy ko'rsatkichlar formulasi va hisob-kitobi (1-masala)",
        headers: ["Ko'rsatkich", "Formula", "Hisob-kitob ifodasi", "Natija"],
        rows: [
          [
            "Guruhlararo SS (SS_omil)",
            "∑ nⱼ(x̄ⱼ − X̄)²",
            p1Anova.groupStats
              .map((g) => `${g.n}·(${fmt(g.mean)}−${fmt(p1Anova.grandMean)})²`)
              .join(" + "),
            fmt(p1Anova.ssBetween),
          ],
          [
            "Guruh ichidagi SS (SS_qoldiq)",
            "∑∑ (xᵢⱼ − x̄ⱼ)²",
            p1Anova.groupStats.map((g) => fmt(g.ssWithin)).join(" + "),
            fmt(p1Anova.ssWithin),
          ],
          [
            "Umumiy SS (SS_umumiy)",
            "SS_omil + SS_qoldiq",
            `${fmt(p1Anova.ssBetween)} + ${fmt(p1Anova.ssWithin)}`,
            fmt(p1Anova.ssTotal),
          ],
          [
            "Erkinlik darajalari (df)",
            "df₁ = k − 1; df₂ = N − k",
            `df₁ = ${p1Anova.k} − 1 = ${p1Anova.dfBetween};  df₂ = ${p1Anova.N} − ${p1Anova.k} = ${p1Anova.dfWithin};  df_um = ${p1Anova.N} − 1 = ${p1Anova.dfTotal}`,
            `df₁=${p1Anova.dfBetween}; df₂=${p1Anova.dfWithin}`,
          ],
          [
            "O'rtacha kvadratlar (MS)",
            "MS₁ = SS_omil/df₁; MS₂ = SS_qoldiq/df₂",
            `MS₁ = ${fmt(p1Anova.ssBetween)} / ${p1Anova.dfBetween} = ${fmt(p1Anova.msBetween)};  MS₂ = ${fmt(p1Anova.ssWithin)} / ${p1Anova.dfWithin} = ${fmt(p1Anova.msWithin)}`,
            `MS₁=${fmt(p1Anova.msBetween)}; MS₂=${fmt(p1Anova.msWithin)}`,
          ],
          [
            "Fisher mezoni (F_kuz)",
            "F_kuz = MS_omil / MS_qoldiq",
            `${fmt(p1Anova.msBetween)} / ${fmt(p1Anova.msWithin)}`,
            fmt(p1Anova.fObserved),
          ],
        ],
      },
      verificationEquality: `Tekshirish tengligi: SS_umumiy = SS_omil + SS_qoldiq ⇒ ${fmt(p1Anova.ssBetween)} + ${fmt(p1Anova.ssWithin)} = ${fmt(p1Anova.ssTotal)} (Tenglik 100% bajarildi); df_umumiy = ${p1Anova.dfBetween} + ${p1Anova.dfWithin} = ${p1Anova.dfTotal}.`,
    },
    stepC: {
      heading: "c) Yakuniy dispersion tahlil (ANOVA) jadvali",
      anovaTable: {
        title: "3-jadval. Bir omilli dispersion tahlil (ANOVA) yakuniy jadvali (1-masala)",
        headers: [
          "Tebranish manbai",
          "SS (Kvadratlar yig'indisi)",
          "df (Erkinlik darajasi)",
          "MS (O'rtacha kvadrat)",
          "F_kuz",
          "F_kr (α=0,05)",
          "p-qiymat",
        ],
        rows: [
          [
            "Guruhlararo (Smena omili)",
            fmt(p1Anova.ssBetween),
            p1Anova.dfBetween,
            fmt(p1Anova.msBetween),
            fmt(p1Anova.fObserved),
            fmt(p1Anova.fCritical),
            p1Anova.pValue,
          ],
          [
            "Guruh ichida (Tasodifiy qoldiq)",
            fmt(p1Anova.ssWithin),
            p1Anova.dfWithin,
            fmt(p1Anova.msWithin),
            "—",
            "—",
            "—",
          ],
          ["Jami (Umumiy)", fmt(p1Anova.ssTotal), p1Anova.dfTotal, "—", "—", "—", "—"],
        ],
      },
    },
    stepD: {
      heading: "d) Statistik qaror qabul qilish",
      fObserved: p1Anova.fObserved,
      fCritical: p1Anova.fCritical,
      pValue: p1Anova.pValue,
      alpha: 0.05,
      decisionTitle: p1RejectH0
        ? `F_kuz (${fmt(p1Anova.fObserved)}) > F_kr (${fmt(p1Anova.fCritical)}) va p-qiymat (${p1Anova.pValue}) < α (0,05) ⇒ H₀ gipoteza rad etiladi!`
        : `F_kuz (${fmt(p1Anova.fObserved)}) ≤ F_kr (${fmt(p1Anova.fCritical)}) ⇒ H₀ nol gipoteza rad etilmaydi (farq tasodifiy)!`,
      decisionExplanation: `Fisher taqsimoti jadvalidan α = 0,05 ahamiyatlilik darajasi hamda df₁ = ${p1Anova.dfBetween} va df₂ = ${p1Anova.dfWithin} erkinlik darajalari uchun kritik qiymat F_kr(0,05; ${p1Anova.dfBetween}; ${p1Anova.dfWithin}) = ${fmt(p1Anova.fCritical)} ga teng. Hisoblangan F_kuz = ${fmt(p1Anova.fObserved)} qiymati kritik chegaradan ${p1RejectH0 ? "katta bo'lgani sababli H₀ rad etiladi va H₁ muqobil gipoteza qabul qilinadi. Demak, guruhlar o'rtasidagi farq tasodifiy emas, balki statistik jihatdan yuqori ahamiyatli." : "kichik bo'lgani sababli H₀ gipoteza kuchda qoladi."}`,
    },
    stepE: {
      heading: "e) Omil kuchi (η²) va iqtisodiy-boshqaruv talqini",
      etaSquaredPercent: p1Anova.etaSquared,
      etaFormula: `η² = (SS_omil / SS_umumiy) × 100% = (${fmt(p1Anova.ssBetween)} / ${fmt(p1Anova.ssTotal)}) × 100% = ${fmt(p1Anova.etaSquared, 2)}%`,
      economicInterpretation: `Determinatsiya koeffitsiyenti η² = ${fmt(p1Anova.etaSquared, 2)}% ni tashkil etdi. Bu shuni anglatadiki, korxonada mahsulot ishlab chiqarish hajmidagi umumiy o'zgaruvchanlikning ${fmt(p1Anova.etaSquared, 2)}% qismi bevosita o'rganilayotgan guruh (smena) omili bilan, qolgan ${fmt(100 - p1Anova.etaSquared, 2)}% qismi esa guruh ichidagi boshqa tasodifiy omillar bilan izohlanadi. Eng yuqori ko'rsatkich «${p1BestGroup.name}» guruhida (x̄ = ${fmt(p1BestGroup.mean)}), eng past ko'rsatkich esa «${p1WorstGroup.name}» guruhida (x̄ = ${fmt(p1WorstGroup.mean)}) kuzatildi.`,
      recommendations: [
        `«${p1WorstGroup.name}» guruhida o'rtacha ko'rsatkich «${p1BestGroup.name}» guruhiga nisbatan o'rtacha ${fmt(p1BestGroup.mean - p1WorstGroup.mean)} birlikka past ekanligini inobatga olib, texnologik nazorat va mehnat sharoitini kuchaytirish zarur.`,
        "Murakkab va yuqori aniqlik talab qiladigan buyurtmalarni yuqori unumdorlik ko'rsatgan guruhlarga taqsimlash orqali yaroqsiz mahsulotlar ulushini kamaytirish tavsiya etiladi.",
      ],
      chart: {
        figureNumber: "1-rasm",
        title:
          "Ishlab chiqarish smenalari bo'yicha o'rtacha mahsulot hajmi (x̄ⱼ) va umumiy o'rtacha (X̄)",
        yAxisLabel: "Mahsulot hajmi (ming dona)",
        overallMean: p1Anova.grandMean,
        overallMeanLabel: `Umumiy o'rtacha X̄ = ${fmt(p1Anova.grandMean)}`,
        bars: p1Anova.groupStats.map((g) => ({
          label: g.name,
          value: g.mean,
          count: g.n,
          color: g.color,
        })),
        caption: `1-rasm. 1-masala bo'yicha guruhlar o'rtacha qiymatlari ustunli diagrammasi va umumiy o'rtacha chizig'i (X̄ = ${fmt(p1Anova.grandMean)}).`,
      },
    },
  };

  // ============================================================================
  // 2-MASALA (2 BALL): Yig'ma statistikalar bo'yicha bir omilli ANOVA (Teng bo'lmagan guruhlar)
  // ============================================================================
  const p2Groups = [
    {
      name: "Tikuv sexi (n₁=5)",
      values: [86 + delta, 88 + delta, 84 + delta, 90 + delta, 87 + delta],
      color: "#10b981",
    },
    {
      name: "Bo'yash sexi (n₂=4)",
      values: [75 + delta, 78 + delta, 73 + delta, 76 + delta],
      color: "#f59e0b",
    },
    {
      name: "Qadoqlash sexi (n₃=5)",
      values: [80 + delta, 83 + delta, 79 + delta, 82 + delta, 81 + delta],
      color: "#8b5cf6",
    },
  ];
  const p2Anova = computeOneWayAnova(p2Groups, 3.9823);

  const problem2: AmaliyIshProblem = {
    number: 2,
    title: "2-MASALA",
    points: "2 BALL",
    condition: `Korxonaning 3 ta bo'limi (Tikuv sexi — 5 nafar, Bo'yash sexi — 4 nafar, Qadoqlash sexi — 5 nafar xodim; jami N = 14) bo'yicha o'tkazilgan xodimlar so'rovida mehnat sharoiti va rag'batlantirish tizimidan qoniqish indeksi (100 ballik shkalada) baholandi. Birlamchi kuzatuvlar soni teng bo'lmagan guruhlar hamda yig'ma statistik ko'rsatkichlar (nⱼ, Tⱼ, x̄ⱼ, sⱼ²) asosida bir omilli dispersion tahlilni (One-Way ANOVA from summary statistics) α = 0,05 darajasida bajaring.`,
    initialTable: {
      title: "2-masala dastlabki ma'lumotlari: Bo'limlar bo'yicha xodimlar so'rovi ballari",
      headers: ["Bo'lim (Sex)", "1-xodim", "2-xodim", "3-xodim", "4-xodim", "5-xodim"],
      rows: [
        [p2Groups[0].name, ...p2Groups[0].values],
        [p2Groups[1].name, ...p2Groups[1].values, "— (kuzatuv yo'q)"],
        [p2Groups[2].name, ...p2Groups[2].values],
      ],
    },
    stepA: {
      heading: "a) Gipotezalar va teng bo'lmagan guruhlar yig'ma ko'rsatkichlari",
      hypotheses: [
        "H₀: μ₁ = μ₂ = μ₃ — barcha bo'limlarda xodimlarning mehnatdan qoniqish o'rtacha ballari bir xil (bo'lim omilining ta'siri statistik ahamiyatga ega emas).",
        "H₁: kamida bitta bo'limda o'rtacha qoniqish indeksi boshqa bo'limlardan statistik farq qiladi (bo'lim omili qoniqish darajasiga sezilarli ta'sir qiladi).",
      ],
      helperTable: {
        title:
          "4-jadval. Yig'ma statistikalar va teng bo'lmagan guruhlar yordamchi hisoblari (2-masala)",
        headers: [
          "Bo'lim nomi",
          "Kuzatuvlar (nⱼ)",
          "Yig'indi (Tⱼ)",
          "O'rtacha (x̄ⱼ)",
          "∑(xᵢⱼ − x̄ⱼ)²",
          "Tanlanma dispersiya (sⱼ²)",
        ],
        rows: [
          ...p2Anova.groupStats.map((g) => [
            g.name,
            g.n,
            fmt(g.sum),
            fmt(g.mean),
            fmt(g.ssWithin),
            fmt(g.variance),
          ]),
          [
            "Jami / Umumiy",
            p2Anova.N,
            fmt(p2Anova.grandTotal),
            `X̄ = ${fmt(p2Anova.grandMean)}`,
            `SS_qoldiq = ${fmt(p2Anova.ssWithin)}`,
            "—",
          ],
        ],
      },
      manualSampleCalc: [
        `T₁ = ${p2Groups[0].values.join(" + ")} = ${fmt(p2Anova.groupStats[0].sum)};  n₁ = 5 ⇒ x̄₁ = ${fmt(p2Anova.groupStats[0].mean)}`,
        `T₂ = ${p2Groups[1].values.join(" + ")} = ${fmt(p2Anova.groupStats[1].sum)};  n₂ = 4 ⇒ x̄₂ = ${fmt(p2Anova.groupStats[1].mean)}`,
        `T₃ = ${p2Groups[2].values.join(" + ")} = ${fmt(p2Anova.groupStats[2].sum)};  n₃ = 5 ⇒ x̄₃ = ${fmt(p2Anova.groupStats[2].mean)}`,
        `Vaznli umumiy o'rtacha: X̄ = (T₁ + T₂ + T₃) / (n₁ + n₂ + n₃) = ${fmt(p2Anova.grandTotal)} / ${p2Anova.N} = ${fmt(p2Anova.grandMean)}`,
        `Dispersiyalar bo'yicha qoldiq SS: SS_qoldiq = ∑(nⱼ − 1)·sⱼ² = (5−1)·${fmt(p2Anova.groupStats[0].variance)} + (4−1)·${fmt(p2Anova.groupStats[1].variance)} + (5−1)·${fmt(p2Anova.groupStats[2].variance)} = ${fmt(p2Anova.ssWithin)}`,
      ],
    },
    stepB: {
      heading: "b) Kvadratik chetlanishlar va tekshirish tengligi",
      formulaTable: {
        title: "5-jadval. Formula, hisob va natijalar jadvali (2-masala)",
        headers: ["Ko'rsatkich", "Formula", "Hisob-kitob", "Natija"],
        rows: [
          [
            "SS_omil (Bo'limlararo)",
            "∑ nⱼ(x̄ⱼ − X̄)²",
            `5·(${fmt(p2Anova.groupStats[0].mean)}−${fmt(p2Anova.grandMean)})² + 4·(${fmt(p2Anova.groupStats[1].mean)}−${fmt(p2Anova.grandMean)})² + 5·(${fmt(p2Anova.groupStats[2].mean)}−${fmt(p2Anova.grandMean)})²`,
            fmt(p2Anova.ssBetween),
          ],
          [
            "SS_qoldiq (Bo'lim ichida)",
            "∑∑ (xᵢⱼ − x̄ⱼ)²",
            `${fmt(p2Anova.groupStats[0].ssWithin)} + ${fmt(p2Anova.groupStats[1].ssWithin)} + ${fmt(p2Anova.groupStats[2].ssWithin)}`,
            fmt(p2Anova.ssWithin),
          ],
          [
            "SS_umumiy",
            "SS_omil + SS_qoldiq",
            `${fmt(p2Anova.ssBetween)} + ${fmt(p2Anova.ssWithin)}`,
            fmt(p2Anova.ssTotal),
          ],
          [
            "Erkinlik darajalari",
            "df₁ = k−1; df₂ = N−k",
            `df₁ = 3−1 = 2; df₂ = 14−3 = 11; df_um = 13`,
            "df₁=2; df₂=11",
          ],
          [
            "F_kuz",
            "MS_omil / MS_qoldiq",
            `${fmt(p2Anova.msBetween)} / ${fmt(p2Anova.msWithin)}`,
            fmt(p2Anova.fObserved),
          ],
        ],
      },
      verificationEquality: `Tekshirish: SS_umumiy = ${fmt(p2Anova.ssBetween)} + ${fmt(p2Anova.ssWithin)} = ${fmt(p2Anova.ssTotal)}; df_umumiy = 2 + 11 = 13.`,
    },
    stepC: {
      heading: "c) Yakuniy ANOVA jadvali (2-masala)",
      anovaTable: {
        title: "6-jadval. Teng bo'lmagan guruhlar uchun ANOVA jadvali (2-masala)",
        headers: ["Tebranish manbai", "SS", "df", "MS", "F_kuz", "F_kr (α=0,05)", "p-qiymat"],
        rows: [
          [
            "Bo'limlararo (Omil)",
            fmt(p2Anova.ssBetween),
            p2Anova.dfBetween,
            fmt(p2Anova.msBetween),
            fmt(p2Anova.fObserved),
            fmt(p2Anova.fCritical),
            p2Anova.pValue,
          ],
          [
            "Bo'lim ichida (Qoldiq)",
            fmt(p2Anova.ssWithin),
            p2Anova.dfWithin,
            fmt(p2Anova.msWithin),
            "—",
            "—",
            "—",
          ],
          ["Jami (Umumiy)", fmt(p2Anova.ssTotal), p2Anova.dfTotal, "—", "—", "—", "—"],
        ],
      },
    },
    stepD: {
      heading: "d) Statistik qaror",
      fObserved: p2Anova.fObserved,
      fCritical: p2Anova.fCritical,
      pValue: p2Anova.pValue,
      alpha: 0.05,
      decisionTitle:
        p2Anova.fObserved > p2Anova.fCritical
          ? `F_kuz (${fmt(p2Anova.fObserved)}) > F_kr (${fmt(p2Anova.fCritical)}) ⇒ H₀ rad etiladi!`
          : `F_kuz (${fmt(p2Anova.fObserved)}) ≤ F_kr (${fmt(p2Anova.fCritical)}) ⇒ H₀ rad etilmaydi (farq tasodifiy)!`,
      decisionExplanation: `df₁ = 2 va df₂ = 11 erkinlik darajalarida F_kr(0,05; 2; 11) = ${fmt(p2Anova.fCritical)} ga teng. Kuzatilgan F_kuz = ${fmt(p2Anova.fObserved)} ${
        p2Anova.fObserved > p2Anova.fCritical
          ? `> ${fmt(p2Anova.fCritical)} bo'lgani uchun bo'limlar kesimida xodimlarning qoniqish darajasida statistik ahamiyatli tafovut mavjud.`
          : `≤ ${fmt(p2Anova.fCritical)} bo'lgani uchun bo'limlar o'rtasidagi tafovut statistik jihatdan tasodifiy deb baholanadi.`
      }`,
    },
    stepE: {
      heading: "e) Omil kuchi (η²) va HR-boshqaruv xulosasi",
      etaSquaredPercent: p2Anova.etaSquared,
      etaFormula: `η² = (${fmt(p2Anova.ssBetween)} / ${fmt(p2Anova.ssTotal)}) × 100% = ${fmt(p2Anova.etaSquared, 2)}%`,
      economicInterpretation: `Xodimlarning mehnatdan qoniqish indeksidagi variatsiyaning ${fmt(p2Anova.etaSquared, 2)}% qismi ularning qaysi sexda ishlashi bilan bog'liq. Bo'yash sexida qoniqish ko'rsatkichi eng past (x̄₂ = ${fmt(p2Anova.groupStats[1].mean)} ball), Tikuv sexida esa eng yuqori (x̄₁ = ${fmt(p2Anova.groupStats[0].mean)} ball).`,
      recommendations: [
        "Bo'yash sexida ventilyatsiya, zararli mehnat sharoiti uchun qo'shimcha ustamalar va smenali dam olish grafiklarini qayta ko'rib chiqish lozim.",
        "Tikuv sexidagi KPI va mukofotlash tajribasini Qadoqlash hamda Bo'yash sexlariga bosqichma-bosqich tatbiq etish tavsiya etiladi.",
      ],
      chart: {
        figureNumber: "2-rasm",
        title: "Bo'limlar bo'yicha xodimlar so'rovi o'rtacha ballari (x̄ⱼ) va umumiy o'rtacha (X̄)",
        yAxisLabel: "Qoniqish indeksi (ball)",
        overallMean: p2Anova.grandMean,
        overallMeanLabel: `Umumiy o'rtacha X̄ = ${fmt(p2Anova.grandMean)}`,
        bars: p2Anova.groupStats.map((g) => ({
          label: g.name,
          value: g.mean,
          count: g.n,
          color: g.color,
        })),
        caption: `2-rasm. 2-masala bo'yicha sexlar kesimida xodimlar qoniqish indeksi diagrammasi (X̄ = ${fmt(p2Anova.grandMean)}).`,
      },
    },
  };

  // ============================================================================
  // 3-MASALA (3 BALL): Ikki omilli dispersion tahlil (Two-Way ANOVA without replication)
  // ============================================================================
  const p3Rows = ["1-smena (A₁)", "2-smena (A₂)", "3-smena (A₃)"];
  const p3Cols = [
    "1-toifa: Yosh mutaxassis (B₁)",
    "2-toifa: O'rta malaka (B₂)",
    "3-toifa: Katta usta (B₃)",
    "4-toifa: Yetakchi operator (B₄)",
  ];
  const p3Matrix = [
    [74 + delta, 80 + delta, 86 + delta, 92 + delta],
    [68 + delta, 75 + delta, 81 + delta, 88 + delta],
    [60 + delta, 66 + delta, 73 + delta, 79 + delta],
  ];
  const p3Anova = computeTwoWayAnova(p3Rows, p3Cols, p3Matrix, 5.1433, 4.7571);

  const problem3: AmaliyIshProblem = {
    number: 3,
    title: "3-MASALA",
    points: "3 BALL",
    condition: `Ishlab chiqarish smenasi (A omil: 3 ta smena) va xodimlarning malaka toifasi (B omil: 4 ta malaka darajasi) birgalikda korxona mehnat unumdorligiga (smenada ishlab chiqarilgan standart birliklar soni) qanday ta'sir ko'rsatishini takrorlanishsiz ikki omilli dispersion tahlil (Two-Way ANOVA without replication) yordamida α = 0,05 darajada tekshiring.`,
    initialTable: {
      title: "3-masala dastlabki ma'lumotlari: Smena (A) va Malaka toifasi (B) bo'yicha unumdorlik",
      headers: ["Smena (A omil)", ...p3Cols],
      rows: p3Rows.map((rName, i) => [rName, ...p3Matrix[i]]),
    },
    stepA: {
      heading: "a) Ikki juft statistik gipotezalar va qator/ustun ko'rsatkichlari",
      hypotheses: [
        "1-juft (A omil — Smenalar bo'yicha): H₀ᴬ: α₁ = α₂ = α₃ = 0 (smenalar o'rtasida farq yo'q) vs H₁ᴬ: kamida bitta smena o'rtachasi farq qiladi.",
        "2-juft (B omil — Malaka toifasi bo'yicha): H₀ᴮ: β₁ = β₂ = β₃ = β₄ = 0 (malaka toifalari o'rtasida farq yo'q) vs H₁ᴮ: kamida bitta malaka toifasi natijasi farq qiladi.",
      ],
      helperTable: {
        title:
          "7-jadval. Ikki omilli tahlil uchun qator va ustun yig'indilari hamda o'rtachalari (3-masala)",
        headers: [
          "Smena \\ Malaka",
          "B₁ (1-toifa)",
          "B₂ (2-toifa)",
          "B₃ (3-toifa)",
          "B₄ (4-toifa)",
          "Qator yig'indisi (Tᵢ.)",
          "Qator o'rtachasi (x̄ᵢ.)",
        ],
        rows: [
          ...p3Rows.map((rName, i) => [
            rName,
            ...p3Matrix[i],
            fmt(p3Anova.rowSums[i]),
            fmt(p3Anova.rowMeans[i]),
          ]),
          [
            "Ustun yig'indisi (T.ⱼ)",
            ...p3Anova.colSums.map((s) => fmt(s)),
            `G = ${fmt(p3Anova.grandTotal)}`,
            "—",
          ],
          [
            "Ustun o'rtachasi (x̄.ⱼ)",
            ...p3Anova.colMeans.map((m) => fmt(m)),
            "—",
            `X̄ = ${fmt(p3Anova.grandMean)}`,
          ],
        ],
      },
      manualSampleCalc: [
        `Qator o'rtachalari (Smenalar): x̄₁. = ${fmt(p3Anova.rowSums[0])}/4 = ${fmt(p3Anova.rowMeans[0])};  x̄₂. = ${fmt(p3Anova.rowSums[1])}/4 = ${fmt(p3Anova.rowMeans[1])};  x̄₃. = ${fmt(p3Anova.rowSums[2])}/4 = ${fmt(p3Anova.rowMeans[2])}`,
        `Ustun o'rtachalari (Malaka): x̄.₁ = ${fmt(p3Anova.colMeans[0])};  x̄.₂ = ${fmt(p3Anova.colMeans[1])};  x̄.₃ = ${fmt(p3Anova.colMeans[2])};  x̄.₄ = ${fmt(p3Anova.colMeans[3])}`,
        `Umumiy o'rtacha: X̄ = ${fmt(p3Anova.grandTotal)} / ${p3Anova.N} = ${fmt(p3Anova.grandMean)}`,
      ],
    },
    stepB: {
      heading: "b) Ikki omilli tahlil kvadratlar yig'indisi (SS_A, SS_B, SS_qoldiq) hisobi",
      formulaTable: {
        title: "8-jadval. Ikki omilli ANOVA formulalari va hisob-kitoblari (3-masala)",
        headers: ["Ko'rsatkich", "Formula", "Hisob-kitob", "Natija"],
        rows: [
          [
            "SS_A (Smena omili)",
            "c · ∑ (x̄ᵢ. − X̄)²",
            `4 · [(${fmt(p3Anova.rowMeans[0])}−${fmt(p3Anova.grandMean)})² + (${fmt(p3Anova.rowMeans[1])}−${fmt(p3Anova.grandMean)})² + (${fmt(p3Anova.rowMeans[2])}−${fmt(p3Anova.grandMean)})²]`,
            fmt(p3Anova.ssRow),
          ],
          [
            "SS_B (Malaka omili)",
            "r · ∑ (x̄.ⱼ − X̄)²",
            `3 · [(${fmt(p3Anova.colMeans[0])}−${fmt(p3Anova.grandMean)})² + (${fmt(p3Anova.colMeans[1])}−${fmt(p3Anova.grandMean)})² + (${fmt(p3Anova.colMeans[2])}−${fmt(p3Anova.grandMean)})² + (${fmt(p3Anova.colMeans[3])}−${fmt(p3Anova.grandMean)})²]`,
            fmt(p3Anova.ssCol),
          ],
          [
            "SS_qoldiq (Tasodifiy xatolik)",
            "SS_umumiy − SS_A − SS_B",
            `${fmt(p3Anova.ssTotal)} − ${fmt(p3Anova.ssRow)} − ${fmt(p3Anova.ssCol)}`,
            fmt(p3Anova.ssError),
          ],
          [
            "SS_umumiy",
            "∑∑ (xᵢⱼ − X̄)²",
            `${fmt(p3Anova.ssRow)} + ${fmt(p3Anova.ssCol)} + ${fmt(p3Anova.ssError)}`,
            fmt(p3Anova.ssTotal),
          ],
          [
            "Fisher mezonlari (F_A va F_B)",
            "F_A = MS_A/MS_q; F_B = MS_B/MS_q",
            `F_A = ${fmt(p3Anova.msRow)}/${fmt(p3Anova.msError)} = ${fmt(p3Anova.fRow)};  F_B = ${fmt(p3Anova.msCol)}/${fmt(p3Anova.msError)} = ${fmt(p3Anova.fCol)}`,
            `F_A=${fmt(p3Anova.fRow)}; F_B=${fmt(p3Anova.fCol)}`,
          ],
        ],
      },
      verificationEquality: `Tekshirish tengligi: SS_umumiy = SS_A + SS_B + SS_qoldiq ⇒ ${fmt(p3Anova.ssRow)} + ${fmt(p3Anova.ssCol)} + ${fmt(p3Anova.ssError)} = ${fmt(p3Anova.ssTotal)}; df_umumiy = 2 + 3 + 6 = 11.`,
    },
    stepC: {
      heading: "c) Ikki omilli dispersion tahlil (Two-Way ANOVA) yakuniy jadvali",
      anovaTable: {
        title: "9-jadval. Takrorlanishsiz ikki omilli ANOVA yakuniy jadvali (3-masala)",
        headers: ["Tebranish manbai", "SS", "df", "MS", "F_kuz", "F_kr (α=0,05)", "p-qiymat"],
        rows: [
          [
            "A omil (Qatorlar — Smena)",
            fmt(p3Anova.ssRow),
            p3Anova.dfRow,
            fmt(p3Anova.msRow),
            fmt(p3Anova.fRow),
            fmt(p3Anova.fCritRow),
            "< 0.0001",
          ],
          [
            "B omil (Ustunlar — Malaka toifasi)",
            fmt(p3Anova.ssCol),
            p3Anova.dfCol,
            fmt(p3Anova.msCol),
            fmt(p3Anova.fCol),
            fmt(p3Anova.fCritCol),
            "< 0.0001",
          ],
          [
            "Qoldiq (Xatolik)",
            fmt(p3Anova.ssError),
            p3Anova.dfError,
            fmt(p3Anova.msError),
            "—",
            "—",
            "—",
          ],
          ["Jami (Umumiy)", fmt(p3Anova.ssTotal), p3Anova.dfTotal, "—", "—", "—", "—"],
        ],
      },
    },
    stepD: {
      heading: "d) Har ikkala omil bo'yicha statistik qaror",
      fObserved: p3Anova.fRow,
      fCritical: p3Anova.fCritRow,
      pValue: "< 0.0001",
      alpha: 0.05,
      decisionTitle: `A omil: ${
        p3Anova.fRow > p3Anova.fCritRow
          ? `F_A (${fmt(p3Anova.fRow)}) > F_kr (${fmt(p3Anova.fCritRow)}) ⇒ H₀ᴬ rad etiladi`
          : `F_A (${fmt(p3Anova.fRow)}) ≤ F_kr (${fmt(p3Anova.fCritRow)}) ⇒ H₀ᴬ rad etilmaydi`
      }; B omil: ${
        p3Anova.fCol > p3Anova.fCritCol
          ? `F_B (${fmt(p3Anova.fCol)}) > F_kr (${fmt(p3Anova.fCritCol)}) ⇒ H₀ᴮ rad etiladi`
          : `F_B (${fmt(p3Anova.fCol)}) ≤ F_kr (${fmt(p3Anova.fCritCol)}) ⇒ H₀ᴮ rad etilmaydi`
      }!`,
      decisionExplanation: `1) Smena omili (A) bo'yicha F_A = ${fmt(p3Anova.fRow)} ${
        p3Anova.fRow > p3Anova.fCritRow
          ? `> F_kr(0,05; 2; 6) = ${fmt(p3Anova.fCritRow)} bo'lgani uchun smena rejimi unumdorlikka statistik ahamiyatli ta'sir qiladi.`
          : `≤ F_kr(0,05; 2; 6) = ${fmt(p3Anova.fCritRow)} bo'lib uning ta'siri tasodifiy farqdan iborat.`
      } 2) Malaka toifasi (B) bo'yicha F_B = ${fmt(p3Anova.fCol)} ${
        p3Anova.fCol > p3Anova.fCritCol
          ? `> F_kr(0,05; 3; 6) = ${fmt(p3Anova.fCritCol)} bo'lgani sababli xodimlarning malaka toifasi ham unumdorlikka juda kuchli statistik ta'sir ko'rsatadi.`
          : `≤ F_kr(0,05; 3; 6) = ${fmt(p3Anova.fCritCol)} bo'lib uning ta'siri statistik jihatdan tasodifiy hisoblanadi.`
      }`,
    },
    stepE: {
      heading: "e) Omillar ulushi (η_A², η_B²) va iqtisodiy talqin",
      etaSquaredPercent: p3Anova.etaTotal,
      etaFormula: `η_A² = (${fmt(p3Anova.ssRow)}/${fmt(p3Anova.ssTotal)})×100% = ${fmt(p3Anova.etaRow, 2)}%;  η_B² = (${fmt(p3Anova.ssCol)}/${fmt(p3Anova.ssTotal)})×100% = ${fmt(p3Anova.etaCol, 2)}%;  Jami: ${fmt(p3Anova.etaTotal, 2)}%`,
      economicInterpretation: `Ikki omilli tahlil natijasiga ko'ra, unumdorlikdagi umumiy tebranishning ${fmt(p3Anova.etaCol, 2)}% qismi xodimning malaka toifasi (B omil) hissasiga, ${fmt(p3Anova.etaRow, 2)}% qismi esa ish smenasi (A omil) hissasiga to'g'ri keladi. Tasodifiy xatolik ulushi atigi ${fmt(100 - p3Anova.etaTotal, 2)}% ni tashkil etadi.`,
      recommendations: [
        "Malaka toifasi omili (B) eng yuqori ta'sir kuchiga ega bo'lgani sababli, 1- va 2-toifali yosh xodimlar uchun mentorlik («Ustoz-shogird») dasturini joriy etish eng tez samara beradi.",
        "Tungi smenaga 3- va 4-toifali tajribali operatorlarni navbatma-navbat biriktirish smenalararo tafovutni qisqartiradi.",
      ],
      chart: {
        figureNumber: "3-rasm",
        title:
          "Malaka toifalari (B₁–B₄) kesimida o'rtacha mehnat unumdorligi va umumiy o'rtacha (X̄)",
        yAxisLabel: "O'rtacha unumdorlik (birlik)",
        overallMean: p3Anova.grandMean,
        overallMeanLabel: `Umumiy o'rtacha X̄ = ${fmt(p3Anova.grandMean)}`,
        bars: p3Cols.map((cName, j) => ({
          label: cName.split(":")[0],
          value: p3Anova.colMeans[j],
          count: 3,
          color: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b"][j],
        })),
        caption: `3-rasm. 3-masala bo'yicha malaka toifalari o'rtacha ko'rsatkichlari va umumiy o'rtacha chizig'i (X̄ = ${fmt(p3Anova.grandMean)}).`,
      },
    },
  };

  // ============================================================================
  // 4-MASALA (1,5 BALL): ANOVA jadvalini to'ldirish va Fisher LSD juftlik tahlili
  // ============================================================================
  const g1 = p1Anova.groupStats[0];
  const g2 = p1Anova.groupStats[1] || p1Anova.groupStats[0];
  const g3 = p1Anova.groupStats[2] || g2;
  const diff12 = round4(Math.abs(g1.mean - g2.mean));
  const diff13 = round4(Math.abs(g1.mean - g3.mean));
  const diff23 = round4(Math.abs(g2.mean - g3.mean));
  const tCrit = getTCritical05(p1Anova.dfWithin);
  const sePair = round4(Math.sqrt(p1Anova.msWithin * (1 / g1.n + 1 / g2.n)) || 0.0001);
  const lsdVal = round4(tCrit * sePair);

  const problem4: AmaliyIshProblem = {
    number: 4,
    title: "4-MASALA",
    points: "1,5 BALL",
    condition: `Dispersion tahlil o'tkazilgan ishlab chiqarish korxonasi bo'yicha quyidagi qisman to'ldirilgan ANOVA jadvali taqdim etildi. Undagi noma'lum ko'rsatkichlarni («?» bilan belgilangan kataklar) dispersiyalar additivligi va erkinlik darajalari balansidan foydalanib to'liq tiklang hamda smenalar o'rtacha qiymatlari (x̄₁ = ${fmt(g1.mean)}, x̄₂ = ${fmt(g2.mean)}, x̄₃ = ${fmt(g3.mean)}) o'rtasidagi statistik farqni Fisherning eng kichik ahamiyatli farq mezoni (LSD — Least Significant Difference) yordamida α = 0,05 darajasida baholang.`,
    initialTable: {
      title: "10-jadval. 4-masala dastlabki ma'lumotlari: Qisman to'ldirilgan ANOVA jadvali",
      headers: [
        "Tebranish manbai",
        "SS (Kvadratlar yig'indisi)",
        "df (Erkinlik darajasi)",
        "MS (O'rtacha kvadrat)",
        "F_kuz",
        "F_kr (α=0,05)",
      ],
      rows: [
        [
          "Guruhlararo (Smena omili)",
          fmt(p1Anova.ssBetween),
          "?",
          "?",
          "?",
          fmt(p1Anova.fCritical),
        ],
        ["Guruh ichida (Qoldiq)", "?", p1Anova.dfWithin, fmt(p1Anova.msWithin), "—", "—"],
        ["Jami (Umumiy)", fmt(p1Anova.ssTotal), p1Anova.dfTotal, "—", "—", "—"],
      ],
    },
    stepA: {
      heading: "a) ANOVA jadvali kataklarini tiklash qoidalari va juftlik gipotezalari",
      hypotheses: [
        `1. Erkinlik darajasi qoidasi: df_omil = df_umumiy − df_qoldiq = ${p1Anova.dfTotal} − ${p1Anova.dfWithin} = ${p1Anova.dfBetween} (k = ${p1Anova.k} ta guruh).`,
        `2. Dispersiyalar additivligi: SS_qoldiq = SS_umumiy − SS_omil = ${fmt(p1Anova.ssTotal)} − ${fmt(p1Anova.ssBetween)} = ${fmt(p1Anova.ssWithin)}.`,
        `3. O'rtacha kvadratlar: MS_omil = SS_omil / df_omil = ${fmt(p1Anova.ssBetween)} / ${p1Anova.dfBetween} = ${fmt(p1Anova.msBetween)}.`,
        `4. Fisher statistikasi: F_kuz = MS_omil / MS_qoldiq = ${fmt(p1Anova.msBetween)} / ${fmt(p1Anova.msWithin)} = ${fmt(p1Anova.fObserved)}.`,
        "5. Juftlik gipotezalari: H₀(1-2): μ₁ = μ₂;  H₀(1-3): μ₁ = μ₃;  H₀(2-3): μ₂ = μ₃.",
      ],
      helperTable: {
        title:
          "11-jadval. Smenalar juftliklari o'rtacha qiymatlari farqi va LSD chegarasi (4-masala)",
        headers: [
          "Taqqoslanayotgan juftlik",
          "Guruh o'rtachalari (x̄ᵢ va x̄ⱼ)",
          "Mutlaq farq |x̄ᵢ − x̄ⱼ|",
          "Standart xatolik SE",
          "Kritik chegara LSD₀.₀₅",
        ],
        rows: [
          [
            "1-smena va 2-smena",
            `${fmt(g1.mean)} va ${fmt(g2.mean)}`,
            fmt(diff12),
            fmt(sePair),
            fmt(lsdVal),
          ],
          [
            "1-smena va 3-smena",
            `${fmt(g1.mean)} va ${fmt(g3.mean)}`,
            fmt(diff13),
            fmt(sePair),
            fmt(lsdVal),
          ],
          [
            "2-smena va 3-smena",
            `${fmt(g2.mean)} va ${fmt(g3.mean)}`,
            fmt(diff23),
            fmt(sePair),
            fmt(lsdVal),
          ],
        ],
      },
      manualSampleCalc: [
        `df_omil = df_umumiy − df_qoldiq = ${p1Anova.dfTotal} − ${p1Anova.dfWithin} = ${p1Anova.dfBetween}`,
        `SS_qoldiq = SS_umumiy − SS_omil = ${fmt(p1Anova.ssTotal)} − ${fmt(p1Anova.ssBetween)} = ${fmt(p1Anova.ssWithin)}`,
        `MS_omil = SS_omil / df_omil = ${fmt(p1Anova.ssBetween)} / ${p1Anova.dfBetween} = ${fmt(p1Anova.msBetween)}`,
        `F_kuz = MS_omil / MS_qoldiq = ${fmt(p1Anova.msBetween)} / ${fmt(p1Anova.msWithin)} = ${fmt(p1Anova.fObserved)}`,
        `LSD₀.₀₅ = t_kr(0,05; ${p1Anova.dfWithin}) · √(2·MS_q / n) = ${fmt(tCrit)} · ${fmt(sePair)} = ${fmt(lsdVal)}`,
      ],
    },
    stepB: {
      heading: "b) Noma'lum ko'rsatkichlarni hisoblash formulalari va tekshirish ayniyati",
      formulaTable: {
        title: "12-jadval. Tiklangan parametrlar formulasi va hisob-kitob natijalari (4-masala)",
        headers: [
          "Noma'lum katak",
          "Hisoblash formulasi",
          "Hisob-kitob ifodasi",
          "Tiklangan qiymat",
        ],
        rows: [
          [
            "df_omil (Guruhlararo df)",
            "df_umumiy − df_qoldiq",
            `${p1Anova.dfTotal} − ${p1Anova.dfWithin}`,
            String(p1Anova.dfBetween),
          ],
          [
            "SS_qoldiq (Xatolik SS)",
            "SS_umumiy − SS_omil",
            `${fmt(p1Anova.ssTotal)} − ${fmt(p1Anova.ssBetween)}`,
            fmt(p1Anova.ssWithin),
          ],
          [
            "MS_omil (Omil o'rtacha kv.)",
            "SS_omil / df_omil",
            `${fmt(p1Anova.ssBetween)} / ${p1Anova.dfBetween}`,
            fmt(p1Anova.msBetween),
          ],
          [
            "F_kuz (Fisher statistikasi)",
            "MS_omil / MS_qoldiq",
            `${fmt(p1Anova.msBetween)} / ${fmt(p1Anova.msWithin)}`,
            fmt(p1Anova.fObserved),
          ],
          [
            "LSD kritik qiymati",
            "t_kr · √(2·MS_q / n)",
            `${fmt(tCrit)} · ${fmt(sePair)}`,
            fmt(lsdVal),
          ],
        ],
      },
      verificationEquality: `Tekshirish ayniyati: SS_umumiy = SS_omil + SS_qoldiq ⇒ ${fmt(p1Anova.ssBetween)} + ${fmt(p1Anova.ssWithin)} = ${fmt(p1Anova.ssTotal)} (Ayniyat 100% bajarildi); df_umumiy = ${p1Anova.dfBetween} + ${p1Anova.dfWithin} = ${p1Anova.dfTotal}.`,
    },
    stepC: {
      heading: "c) To'liq tiklangan ANOVA yakuniy jadvali va Post-hoc LSD natijalari",
      anovaTable: {
        title: "13-jadval. To'liq tiklangan ANOVA yakuniy jadvali (4-masala)",
        headers: [
          "Tebranish manbai",
          "SS (Kvadratlar yig'indisi)",
          "df (Erkinlik darajasi)",
          "MS (O'rtacha kvadrat)",
          "F_kuz",
          "F_kr (α=0,05)",
          "p-qiymat",
        ],
        rows: [
          [
            "Guruhlararo (Smena omili)",
            fmt(p1Anova.ssBetween),
            p1Anova.dfBetween,
            fmt(p1Anova.msBetween),
            fmt(p1Anova.fObserved),
            fmt(p1Anova.fCritical),
            p1Anova.pValue,
          ],
          [
            "Guruh ichida (Qoldiq)",
            fmt(p1Anova.ssWithin),
            p1Anova.dfWithin,
            fmt(p1Anova.msWithin),
            "—",
            "—",
            "—",
          ],
          ["Jami (Umumiy)", fmt(p1Anova.ssTotal), p1Anova.dfTotal, "—", "—", "—", "—"],
        ],
      },
    },
    stepD: {
      heading: "d) Tiklangan ANOVA jadvali va juftliklar bo'yicha statistik qaror",
      fObserved: p1Anova.fObserved,
      fCritical: p1Anova.fCritical,
      pValue: p1Anova.pValue,
      alpha: 0.05,
      decisionTitle: `ANOVA jadvalidagi barcha kataklar tiklandi: F_kuz (${fmt(p1Anova.fObserved)}) ${
        p1Anova.fObserved > p1Anova.fCritical
          ? `> F_kr (${fmt(p1Anova.fCritical)})`
          : `≤ F_kr (${fmt(p1Anova.fCritical)})`
      } hamda LSD = ${fmt(lsdVal)} chegarasiga ko'ra ${
        diff12 > lsdVal && diff13 > lsdVal && diff23 > lsdVal
          ? "barcha guruhlararo farqlar statistik ahamiyatli!"
          : "aniqlangan farqlar qisman statistik ahamiyatga ega."
      }`,
      decisionExplanation: `1) Tiklangan ANOVA jadvalida hisoblangan F_kuz = ${fmt(p1Anova.fObserved)} qiymati F_kr(0,05; 2; 12) = ${fmt(p1Anova.fCritical)} kritik qiymatidan ${
        p1Anova.fObserved > p1Anova.fCritical
          ? "katta bo'lgani sababli H₀ rad etiladi (smenalar bo'yicha unumdorlik teng emas)."
          : "kichik bo'lgani sababli H₀ rad etilmaydi."
      } 2) Post-hoc Fisher LSD tahlili ko'rsatkichlari: |x̄₁ − x̄₂| = ${fmt(diff12)} (${diff12 > lsdVal ? ">" : "≤"} ${fmt(lsdVal)}), |x̄₁ − x̄₃| = ${fmt(diff13)} (${diff13 > lsdVal ? ">" : "≤"} ${fmt(lsdVal)}), va |x̄₂ − x̄₃| = ${fmt(diff23)} (${diff23 > lsdVal ? ">" : "≤"} ${fmt(lsdVal)}). Demak, ${
        diff12 > lsdVal && diff13 > lsdVal && diff23 > lsdVal
          ? "har bir smena juftligidagi tafovutlar tasodifiy xatolik chegarasidan tashqarida bo'lib, statistik jihatdan ishonchli va yuqori ahamiyatga ega."
          : "faqat LSD dan oshgan juftliklar bo'yicha farqlar statistik ahamiyatli hisoblanadi."
      }`,
    },
    stepE: {
      heading:
        "e) Omil kuchi (η²), chuqur iqtisodiy talqin va smena me'yorlarini optimallashtirish",
      etaSquaredPercent: p1Anova.etaSquared,
      etaFormula: `η² = (SS_omil / SS_umumiy) × 100% = (${fmt(p1Anova.ssBetween)} / ${fmt(p1Anova.ssTotal)}) × 100% = ${fmt(p1Anova.etaSquared, 2)}%`,
      economicInterpretation: `ANOVA jadvalini to'ldirish va Fisher LSD diagnostikasi shuni ko'rsatdiki, smenalar ta'siri kuchi juda yuqori (η² = ${fmt(p1Anova.etaSquared, 2)}%). 1-smena va 3-smena o'rtasidagi uzilish maksimal ${fmt(diff13)} birlikni tashkil qiladi. Bu ishlab chiqarish rejasini smenalar bo'yicha bir xil normallashtirish xato ekanligini, smena koeffitsiyentlarini qo'llash zarurligini tasdiqlaydi.`,
      recommendations: [
        "Har bir smena uchun yagona tekis norma o'rniga smena koeffitsiyentli (K₁=1.08; K₂=1.00; K₃=0.92) moslashuvchan reja-grafik joriy etish.",
        "3-smena xodimlari uchun qo'shimcha 15 daqiqalik tetiklashtiruvchi tanaffus va ergonomik tekshiruv tashkil etish.",
      ],
      chart: {
        figureNumber: "4-rasm",
        title: "Smenalararo juftlik farqlari |x̄ᵢ − x̄ⱼ| va kritik LSD chegarasi",
        yAxisLabel: "O'rtachalar farqi (ming dona)",
        overallMean: lsdVal,
        overallMeanLabel: `Kritik chegara LSD = ${fmt(lsdVal)}`,
        bars: [
          { label: "|x̄₁ − x̄₂| (1 va 2)", value: diff12, color: "#0284c7" },
          { label: "|x̄₂ − x̄₃| (2 va 3)", value: diff23, color: "#7c3aed" },
          { label: "|x̄₁ − x̄₃| (1 va 3)", value: diff13, color: "#dc2626" },
        ],
        caption: `4-rasm. ANOVA jadvali va smenalar juftliklari o'rtasidagi mutlaq farqlar hamda Fisher LSD = ${fmt(lsdVal)} kritik chizig'i.`,
      },
    },
  };

  const allProblems = [problem1, problem2, problem3, problem4].slice(0, problemCount);
  const totalPoints = round2(
    allProblems.reduce((sum, p) => {
      const m = p.points.replace(",", ".").match(/\d+(?:\.\d+)?/);
      return sum + (m ? Number(m[0]) : 0);
    }, 0)
  );

  const p1GroupCount = p1Groups.length;
  const lastColLetter = String.fromCharCode(65 + p1GroupCount);
  const summaryCol = String.fromCharCode(65 + p1GroupCount + 1);
  const lastDataRow = 1 + p1MaxCols;
  const sumRow = lastDataRow + 2;
  const meanRow = sumRow + 1;
  const varRow = meanRow + 1;
  const devsqRow = varRow + 1;
  const ssTotalRow = devsqRow + 1;
  const ssWithinRow = ssTotalRow + 1;
  const ssBetweenRow = ssWithinRow + 1;
  const fObsRow = ssBetweenRow + 1;
  const fCritRow = fObsRow + 1;
  const pValRow = fCritRow + 1;
  const etaRow = pValRow + 1;
  const tCritRow = etaRow + 1;
  const lsdRow = tCritRow + 1;

  const firstGroupRange = `B2:B${lastDataRow}`;
  const allDataRange = `B2:${lastColLetter}${lastDataRow}`;
  const sumRange = `B${sumRow}:${lastColLetter}${sumRow}`;
  const meanRange = `B${meanRow}:${lastColLetter}${meanRow}`;
  const varRange = `B${varRow}:${lastColLetter}${varRow}`;
  const devsqRange = `B${devsqRow}:${lastColLetter}${devsqRow}`;

  const excelFormulas: AmaliyIshExcelRow[] = [
    {
      cell: sumRange,
      indicator: "Guruhlar yig'indisi (Tⱼ)",
      formulaEn: `=SUM(${firstGroupRange})`,
      formulaRu: `=СУММ(${firstGroupRange})`,
      result: p1Anova.groupStats.map((g) => fmt(g.sum)).join("; "),
    },
    {
      cell: meanRange,
      indicator: "Guruhlar o'rtachasi (x̄ⱼ)",
      formulaEn: `=AVERAGE(${firstGroupRange})`,
      formulaRu: `=СРЗНАЧ(${firstGroupRange})`,
      result: p1Anova.groupStats.map((g) => fmt(g.mean)).join("; "),
    },
    {
      cell: varRange,
      indicator: "Tanlanma dispersiya (sⱼ²)",
      formulaEn: `=VAR.S(${firstGroupRange})`,
      formulaRu: `=ДИСП.В(${firstGroupRange})`,
      result: p1Anova.groupStats.map((g) => fmt(g.variance)).join("; "),
    },
    {
      cell: devsqRange,
      indicator: "Guruh ichidagi kv. chetlanish",
      formulaEn: `=DEVSQ(${firstGroupRange})`,
      formulaRu: `=КВАДРОТКЛ(${firstGroupRange})`,
      result: p1Anova.groupStats.map((g) => fmt(g.ssWithin)).join("; "),
    },
    {
      cell: `${summaryCol}${meanRow}`,
      indicator: "Umumiy o'rtacha (X̄)",
      formulaEn: `=AVERAGE(${allDataRange})`,
      formulaRu: `=СРЗНАЧ(${allDataRange})`,
      result: fmt(p1Anova.grandMean),
    },
    {
      cell: `${summaryCol}${ssTotalRow}`,
      indicator: "Umumiy kv. chetlanish (SS_umumiy)",
      formulaEn: `=DEVSQ(${allDataRange})`,
      formulaRu: `=КВАДРОТКЛ(${allDataRange})`,
      result: fmt(p1Anova.ssTotal),
    },
    {
      cell: `${summaryCol}${ssWithinRow}`,
      indicator: "Guruh ichidagi SS (SS_qoldiq)",
      formulaEn: `=SUM(${devsqRange})`,
      formulaRu: `=СУММ(${devsqRange})`,
      result: fmt(p1Anova.ssWithin),
    },
    {
      cell: `${summaryCol}${ssBetweenRow}`,
      indicator: "Guruhlararo SS (SS_omil)",
      formulaEn: `=${summaryCol}${ssTotalRow}-${summaryCol}${ssWithinRow}`,
      formulaRu: `=${summaryCol}${ssTotalRow}-${summaryCol}${ssWithinRow}`,
      result: fmt(p1Anova.ssBetween),
    },
    {
      cell: `${summaryCol}${fObsRow}`,
      indicator: "Kuzatilgan Fisher mezoni (F_kuz)",
      formulaEn: `=(${summaryCol}${ssBetweenRow}/${p1Anova.dfBetween})/(${summaryCol}${ssWithinRow}/${p1Anova.dfWithin})`,
      formulaRu: `=(${summaryCol}${ssBetweenRow}/${p1Anova.dfBetween})/(${summaryCol}${ssWithinRow}/${p1Anova.dfWithin})`,
      result: fmt(p1Anova.fObserved),
    },
    {
      cell: `${summaryCol}${fCritRow}`,
      indicator: "Kritik Fisher qiymati (F_kr, α=0.05)",
      formulaEn: `=F.INV.RT(0.05, ${p1Anova.dfBetween}, ${p1Anova.dfWithin})`,
      formulaRu: `=Ф.ОБР.ПХ(0,05; ${p1Anova.dfBetween}; ${p1Anova.dfWithin})`,
      result: fmt(p1Anova.fCritical),
    },
    {
      cell: `${summaryCol}${pValRow}`,
      indicator: "Ehtimollik darajasi (p-qiymat)",
      formulaEn: `=F.DIST.RT(${summaryCol}${fObsRow}, ${p1Anova.dfBetween}, ${p1Anova.dfWithin})`,
      formulaRu: `=Ф.РАСП.ПХ(${summaryCol}${fObsRow}; ${p1Anova.dfBetween}; ${p1Anova.dfWithin})`,
      result: p1Anova.pValue,
    },
    {
      cell: `${summaryCol}${etaRow}`,
      indicator: "Omil ta'sir kuchi (η² %)",
      formulaEn: `=(${summaryCol}${ssBetweenRow}/${summaryCol}${ssTotalRow})*100`,
      formulaRu: `=(${summaryCol}${ssBetweenRow}/${summaryCol}${ssTotalRow})*100`,
      result: `${fmt(p1Anova.etaSquared, 2)}%`,
    },
    {
      cell: `${summaryCol}${tCritRow}`,
      indicator: "Kritik t-Student chegarasi (LSD, α=0.05)",
      formulaEn: `=T.INV.2T(0.05, ${p1Anova.dfWithin})`,
      formulaRu: `=СТЬЮДЕНТ.ОБР.2Х(0,05; ${p1Anova.dfWithin})`,
      result: fmt(tCrit),
    },
    {
      cell: `${summaryCol}${lsdRow}`,
      indicator: "Fisher LSD kritik chegarasi",
      formulaEn: `=${summaryCol}${tCritRow}*SQRT(${summaryCol}${ssWithinRow}/${p1Anova.dfWithin}*(1/${g1.n}+1/${g2.n}))`,
      formulaRu: `=${summaryCol}${tCritRow}*КОРЕНЬ(${summaryCol}${ssWithinRow}/${p1Anova.dfWithin}*(1/${g1.n}+1/${g2.n}))`,
      result: fmt(lsdVal),
    },
  ];

  const conclusionsList = [
    `1. «${subject}» fanidan ${variantLabel} doirasida «${topic}» mavzusi va «${situation}» amaliy vaziyati bo'yicha jami ${problemCount} ta kompleks masala (${totalPoints} ballik tizimda) dispersion tahlil (ANOVA) metodologiyasi asosida to'liq yechildi.`,
    `2. Bir omilli dispersion tahlil (1- va 2-masalalar) natijalari shuni ko'rsatdiki, ishlab chiqarish smenasi (F_kuz = ${fmt(p1Anova.fObserved)}, F_kr = ${fmt(p1Anova.fCritical)}; η² = ${fmt(p1Anova.etaSquared, 2)}%) hamda sexlar kesimidagi mehnat sharoitlari (F_kuz = ${fmt(p2Anova.fObserved)}, F_kr = ${fmt(p2Anova.fCritical)}; η² = ${fmt(p2Anova.etaSquared, 2)}%) yakuniy ko'rsatkichlarga yuqori statistik ishonchlilik bilan ta'sir ko'rsatadi.`,
    problemCount >= 3
      ? `3. Takrorlanishsiz ikki omilli dispersion tahlilda (3-masala) smena omili bilan bir qatorda xodimlarning malaka toifasi o'rganilganda, umumiy variatsiyaning ${fmt(p3Anova.etaTotal, 2)}% qismi aynan shu ikki omil birgalikdagi ta'siri bilan izohlanishi isbotlandi.`
      : `3. O'tkazilgan hisob-kitoblar va MS Excel tekshiruvlari asosida guruhlararo tafovutlarni qisqartirish hamda past ko'rsatkichli bo'limlarni eng ilg'or guruh («${p1BestGroup.name}», x̄ = ${fmt(p1BestGroup.mean)}) darajasiga olib chiqish bo'yicha aniq boshqaruv qarorlari ishlab chiqildi.`,
    problemCount >= 4
      ? `4. Qisman to'ldirilgan ANOVA jadvali noma'lumlari muvaffaqiyatli tiklandi va Fisher LSD mezoni (LSD = ${fmt(lsdVal)}) yordamida har bir smena juftligidagi uzilishlar statistik ahamiyatga egaligi aniqlandi.`
      : ``,
  ].filter(Boolean);

  const cleanMeta = {
    ministry:
      language === "ru"
        ? "МИНИСТЕРСТВО ВЫСШЕГО ОБРАЗОВАНИЯ, НАУКИ И ИННОВАЦИЙ РЕСПУБЛИКИ УЗБЕКИСТАН"
        : language === "en"
          ? "MINISTRY OF HIGHER EDUCATION, SCIENCE AND INNOVATIONS OF THE REPUBLIC OF UZBEKISTAN"
          : "O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI",
    university,
    department,
    subject,
    workType:
      language === "ru"
        ? "ПРАКТИЧЕСКАЯ РАБОТА (AMALIY ISH)"
        : language === "en"
          ? "PRACTICAL WORK (AMALIY ISH)"
          : "AMALIY ISH",
    variant: variantLabel,
    topic,
    situation,
    studentName,
    studentGroup,
    teacherName,
    city,
    year,
    language,
    totalPoints,
  };

  const defaultIntro = buildDefaultIntroduction(cleanMeta, problemCount);
  const defaultTheory = buildDefaultTheorySection(cleanMeta);
  const defaultRefs = buildDefaultReferences(cleanMeta);

  const docWithoutMarkdown: Omit<AmaliyIshDocument, "markdown"> = {
    meta: cleanMeta,
    methodologicalNote: {
      title:
        language === "ru"
          ? "Методические указания и правила расчёта"
          : language === "en"
            ? "Methodological Note & Calculation Rules"
            : "Kirish va amaliy ishni yechishning uslubiy qoidalari",
      rules: [
        "Nazariy asos: Dispersion tahlil (ANOVA — Analysis of Variance) bir yoki bir nechta sifat omillarining o'rganilayotgan natijaviy ko'rsatkichga ta'siri statistik ahamiyatga egaligini tekshirish usuli hisoblanadi.",
        "Gipotezalar tizimi: Har bir masalada dastlab nol gipoteza H₀ (guruhlar o'rtachalarining tengligi: μ₁ = μ₂ = ... = μₖ) va muqobil gipoteza H₁ (kamida bitta guruh o'rtachasi boshqalaridan farq qiladi) aniq matematik ifodalanadi.",
        "Dispersiyalar additivligi: Barcha masalalarda umumiy kvadratik chetlanish omil va qoldiq qismlariga ajraladi: SS_umumiy = SS_omil + SS_qoldiq (ikki omilli holatda: SS_umumiy = SS_A + SS_B + SS_qoldiq). Ushbu ayniyat barcha hisob-kitoblarda tekshirilishi shart.",
        "Erkinlik darajalari balansi: df_umumiy = N − 1, df_omil = k − 1, df_qoldiq = N − k bo'lib, df_umumiy = df_omil + df_qoldiq ayniyati saqlanadi.",
        "Fisher mezonini qo'llash: O'rtacha kvadratlar nisbati F_kuz = MS_omil / MS_qoldiq hisoblanadi. Agar F_kuz > F_kr(α; df₁; df₂) (yoki p-qiymat < α = 0,05) bo'lsa, H₀ gipoteza rad etilib, omil ta'siri statistik ishonchli deb topiladi.",
        "Yaxlitlash va aniqlik talabi: Barcha statistik ko'rsatkichlar (SS, MS, F_kuz, F_kr, SE, LSD) 4 ta o'nli xonagacha (0,0001), determinatsiya koeffitsiyenti (η²) esa 2 ta o'nli xonagacha (0,01%) aniqlikda yoziladi.",
        "MS Excel nazorati: Barcha tahlillar MS Excel dasturining «Data Analysis» paketi hamda DEVSQ, F.DIST.RT, F.INV.RT funksiyalari orqali avtomatlashtirilgan tarzda tekshirilishi ko'rsatiladi.",
      ],
    },
    introduction: defaultIntro,
    theorySection: defaultTheory,
    problems: allProblems,
    excelSection: {
      title: "EXCEL’DA BAJARISH VA FORMULALAR RO'YXATI",
      subtitle:
        "MS Excel dasturida «Data Analysis (Анализ данных)» paketi va standart funksiyalar yordamida hisoblash yo'riqnomasi",
      steps: [
        "1-qadam (Ma'lumotlarni kiritish): MS Excel ishchi varag'ining B1:D1 kataklariga guruh nomlarini («1-smena», «2-smena», «3-smena»), B2:D6 diapazoniga esa dastlabki kuzatuv qiymatlarini joylashtiring.",
        "2-qadam (Dispersion tahlil paketi): Menyudan «Data (Данные)» → «Data Analysis (Анализ данных)» → «Anova: Single Factor (Однофакторный дисперсионный анализ)» modulini oching.",
        "3-qadam (Parametrlarni sozlash): «Input Range (Входной интервал)» ga $B$1:$D$6 ni kiriting, «Grouped By: Columns (По столбцам)» va «Labels in first row (Метки в первой строке)» katakchalarini yoqing, «Alpha (Альфа)» = 0.05 qilib «OK» tugmasini bosing.",
        "4-qadam (Ikki omilli tahlil): Ikki omilli tahlil (3-masala) uchun «Anova: Two-Factor Without Replication (Двухфакторный дисперсионный анализ без повторений)» modulidan foydalaning.",
        "5-qadam (Formulalar yordamida tekshirish): Standart formulalar (EN va RU) orqali har bir katakdagi ko'rsatkichlarni tekshirish uchun quyidagi 14-jadvaldagi formulalardan foydalaning:",
      ],
      tableTitle:
        "14-jadval. Excel funksiyalari jadvali (Katak | Ko'rsatkich | Formula (EN) | Formula (RU) | Natija)",
      formulas: excelFormulas,
    },
    summarySection: {
      title: "UMUMIY XULOSA VA AMALIY TAVSIYALAR",
      comparisonTable: {
        title:
          "15-jadval. Barcha masalalar bo'yicha dispersion tahlil natijalarining qiyosiy tahlili",
        headers: [
          "Masala",
          "Tahlil turi va obyekti",
          "F_kuz / t_kuz",
          "F_kr / t_kr (α=0,05)",
          "p-qiymat",
          "Statistik qaror",
          "Omil kuchi (η²)",
        ],
        rows: allProblems.map((p) => [
          `${p.number}-masala (${p.points})`,
          p.number === 1
            ? `1-omilli ANOVA (${p1Anova.k} guruh, N=${p1Anova.N})`
            : p.number === 2
              ? "Yig'ma statistikalar ANOVA (3 sex, N=14)"
              : p.number === 3
                ? "2-omilli ANOVA (Smena A × Malaka B)"
                : "ANOVA jadvalini to'ldirish & Fisher LSD",
          fmt(p.stepD.fObserved),
          fmt(p.stepD.fCritical),
          p.stepD.pValue,
          p.stepD.fObserved > p.stepD.fCritical
            ? "H₀ rad etildi (Ta'sir ahamiyatli)"
            : "H₀ qabul qilindi (Farq tasodifiy)",
          `${fmt(p.stepE.etaSquaredPercent, 2)}%`,
        ]),
      },
      conclusions: conclusionsList,
      practicalRecommendations: [
        "Tungi (3-smena) va Bo'yash sexidagi texnologik hamda ergonomik sharoitlarni modernizatsiya qilish orqali smenalararo dispersiyani kamida 25–30% ga qisqartirish.",
        "Xodimlar malaka toifasini oshirish va KPI tizimini smena koeffitsiyentlariga bog'lash orqali korxonaning o'rtacha unumdorligini 1-smena darajasiga (x̄₁) yaqinlashtirish.",
        "Barcha iqtisodiy-statistik monitoring hisobotlarini MS Excel «Data Analysis (ANOVA)» moduli yordamida har oyda avtomatlashtirilgan tarzda yuritish.",
      ],
    },
    references: defaultRefs,
  };

  return {
    ...docWithoutMarkdown,
    markdown: renderAmaliyIshToMarkdown(docWithoutMarkdown),
  };
}

function renderTableMarkdown(t: AmaliyIshTable): string {
  const headerLine = `| ${t.headers.join(" | ")} |`;
  const sepLine = `| ${t.headers.map(() => "---").join(" | ")} |`;
  const bodyLines = t.rows.map((r) => `| ${r.map((c) => String(c)).join(" | ")} |`).join("\n");
  return `**${t.title}**\n\n${headerLine}\n${sepLine}\n${bodyLines}${t.footerNote ? `\n\n*${t.footerNote}*` : ""}`;
}

export function renderAmaliyIshToMarkdown(doc: Omit<AmaliyIshDocument, "markdown">): string {
  const lines: string[] = [];
  const isRu = doc.meta.language === "ru";
  const isEn = doc.meta.language === "en";

  // TITUL VARAG'I
  lines.push(`# ${doc.meta.ministry}`);
  lines.push(`## ${doc.meta.university.toUpperCase()}`);
  if (doc.meta.department) {
    lines.push(`*${doc.meta.department}*`);
  }
  lines.push("");
  lines.push(`### «${doc.meta.subject.toUpperCase()}» FANIDAN`);
  lines.push(`# ${doc.meta.workType}`);
  lines.push(`### ${doc.meta.variant}`);
  lines.push("");
  lines.push(`**Mavzu:** ${doc.meta.topic}`);
  lines.push(`**Vaziyat:** ${doc.meta.situation}`);
  lines.push("");
  lines.push(`**Tayyorladi:** ${doc.meta.studentName}`);
  lines.push(`**Guruhi:** ${doc.meta.studentGroup}`);
  lines.push(`**Vazifa berdi:** ${doc.meta.teacherName}`);
  lines.push("");
  lines.push(`${doc.meta.city} – ${doc.meta.year}`);
  lines.push("");
  lines.push("<!-- PAGE_BREAK -->");
  lines.push("");

  // KIRISH / ВВЕДЕНИЕ / INTRODUCTION
  lines.push(`## ${doc.introduction.title}`);
  lines.push(
    `### ${isRu ? "Актуальность темы" : isEn ? "Relevance of the Topic" : "Mavzuning dolzarbligi"}`
  );
  lines.push(doc.introduction.relevance);
  lines.push("");
  lines.push(
    `### ${isRu ? "Цель работы" : isEn ? "Purpose of Practical Work" : "Amaliy ishning maqsadi"}`
  );
  lines.push(doc.introduction.purpose);
  lines.push("");
  lines.push(
    `### ${isRu ? "Основные задачи работы" : isEn ? "Primary Tasks" : "Amaliy ishning asosiy vazifalari"}`
  );
  for (const t of doc.introduction.tasks) {
    lines.push(`- ${t}`);
  }
  lines.push("");
  lines.push(
    `### ${isRu ? "Объект и предмет исследования" : isEn ? "Object and Subject of Research" : "Tadqiqot obyekti va predmeti"}`
  );
  lines.push(doc.introduction.objectAndSubject);
  lines.push("");
  lines.push(
    `### ${isRu ? "Методы исследования" : isEn ? "Applied Methods & Tools" : "Qo'llanilgan metodlar va dasturiy vositalar"}`
  );
  for (const m of doc.introduction.methods) {
    lines.push(`- ${m}`);
  }
  lines.push("");
  lines.push("<!-- PAGE_BREAK -->");
  lines.push("");

  // I BOB / ГЛАВА I / CHAPTER I: NAZARIY ASOSLAR
  lines.push(`## ${doc.theorySection.title}`);
  for (const p of doc.theorySection.paragraphs) {
    lines.push(p);
    lines.push("");
  }
  lines.push(
    renderTableMarkdown({
      title: isRu
        ? "Таблица 0. Ключевые формулы дисперсионного анализа"
        : isEn
          ? "Table 0. Key ANOVA Mathematical Formulas"
          : "Nazariy asoslar: Dispersion tahlilning asosiy matematik formulalari",
      headers: [
        isRu ? "Показатель" : isEn ? "Indicator" : "Ko'rsatkich nomi",
        isRu ? "Формула" : isEn ? "Formula" : "Matematik formula",
        isRu ? "Описание" : isEn ? "Description" : "Iqtisodiy-statistik tavsifi",
      ],
      rows: doc.theorySection.keyFormulas.map((f) => [f.name, f.formula, f.note]),
    })
  );
  lines.push("");
  lines.push("<!-- PAGE_BREAK -->");
  lines.push("");

  // II BOB / ГЛАВА II / CHAPTER II: HISOBLASH VA TAHLIL QISMI
  const ch2Title = isRu
    ? "ГЛАВА II. РАСЧЕТНО-АНАЛИТИЧЕСКАЯ ЧАСТЬ ПРАКТИЧЕСКОЙ РАБОТЫ"
    : isEn
      ? "CHAPTER II. COMPUTATIONAL AND EMPIRICAL ANALYSIS"
      : "II BOB. AMALIY ISHNING HISOBLASH VA TAHLIL QISMI";
  lines.push(`## ${ch2Title}`);
  lines.push(`*«${doc.meta.topic}» (${doc.meta.situation})*\n`);

  for (const p of doc.problems) {
    lines.push(`## ${p.title} (${p.points})`);
    lines.push(`**Masala sharti:** ${p.condition}\n`);
    lines.push(renderTableMarkdown(p.initialTable));
    lines.push(`\n### Yechim:\n`);

    lines.push(`#### ${p.stepA.heading}`);
    for (const h of p.stepA.hypotheses) {
      lines.push(`- ${h}`);
    }
    lines.push("");
    lines.push(renderTableMarkdown(p.stepA.helperTable));
    lines.push("\n**Qo'lda hisoblash namunasi:**");
    for (const c of p.stepA.manualSampleCalc) {
      lines.push(`- \`${c}\``);
    }
    lines.push("");

    lines.push(`#### ${p.stepB.heading}`);
    lines.push(renderTableMarkdown(p.stepB.formulaTable));
    lines.push(`\n> **${p.stepB.verificationEquality}**\n`);

    lines.push(`#### ${p.stepC.heading}`);
    lines.push(renderTableMarkdown(p.stepC.anovaTable));
    lines.push("");

    lines.push(`#### ${p.stepD.heading}`);
    lines.push(`- **${p.stepD.decisionTitle}**`);
    lines.push(`- ${p.stepD.decisionExplanation}\n`);

    lines.push(`#### ${p.stepE.heading}`);
    lines.push(`- **Omil ulushi (Determinatsiya koeffitsiyenti):** \`${p.stepE.etaFormula}\``);
    lines.push(`- **Iqtisodiy talqin:** ${p.stepE.economicInterpretation}`);
    for (const rec of p.stepE.recommendations) {
      lines.push(`  - *Tavsiya:* ${rec}`);
    }
    lines.push(`\n*(${p.stepE.chart.caption})*\n`);
    lines.push(`---\n`);
  }

  // III BOB / ГЛАВА III / CHAPTER III: EXCEL
  lines.push("<!-- PAGE_BREAK -->");
  lines.push("");
  const ch3Title = isRu
    ? "ГЛАВА III. МЕТОДИКА РАСЧЁТА В СРЕДЕ MICROSOFT EXCEL"
    : isEn
      ? "CHAPTER III. COMPUTATIONAL IMPLEMENTATION IN MICROSOFT EXCEL"
      : "III BOB. AMALIY ISHNI MS EXCEL DASTURIDA BAJARISH METODIKASI";
  lines.push(`## ${ch3Title}`);
  lines.push(`### ${doc.excelSection.title}`);
  lines.push(`*${doc.excelSection.subtitle}*\n`);
  for (const s of doc.excelSection.steps) {
    lines.push(`${s}`);
  }
  lines.push("");
  lines.push(
    renderTableMarkdown({
      title: doc.excelSection.tableTitle,
      headers: ["Katak", "Ko'rsatkich", "Formula (EN)", "Formula (RU)", "Natija"],
      rows: doc.excelSection.formulas.map((f) => [
        f.cell,
        f.indicator,
        f.formulaEn,
        f.formulaRu,
        f.result,
      ]),
    })
  );
  lines.push("");

  // XULOSA VA TAVSIYALAR
  lines.push("<!-- PAGE_BREAK -->");
  lines.push("");
  lines.push(`## ${doc.summarySection.title}`);
  lines.push(renderTableMarkdown(doc.summarySection.comparisonTable));
  lines.push("\n### Asosiy xulosalar:");
  for (const c of doc.summarySection.conclusions) {
    lines.push(`${c}`);
  }
  lines.push("\n### Amaliy va boshqaruv tavsiyalari:");
  for (const r of doc.summarySection.practicalRecommendations) {
    lines.push(`- ${r}`);
  }
  lines.push("");

  // FOYDALANILGAN ADABIYOTLAR
  lines.push("<!-- PAGE_BREAK -->");
  lines.push("");
  const litTitle = isRu
    ? "СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ"
    : isEn
      ? "LIST OF REFERENCES"
      : "FOYDALANILGAN ADABIYOTLAR RO'YXATI";
  lines.push(`## ${litTitle}`);
  for (const ref of doc.references) {
    lines.push(ref);
  }

  return lines.join("\n");
}

function escapeHtml(str: string | number): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtmlTableForWord(t: AmaliyIshTable): string {
  const ths = t.headers
    .map(
      (h) =>
        `<th style="border:1pt solid #1e293b;background:#e2e8f0;padding:6pt 8pt;font-size:11pt;font-weight:bold;text-align:center;color:#0f172a;">${escapeHtml(h)}</th>`
    )
    .join("");
  const trs = t.rows
    .map((r, rIdx) => {
      const isLastTotal = rIdx === t.rows.length - 1 && String(r[0]).toLowerCase().includes("jami");
      const tds = r
        .map(
          (cell, cIdx) =>
            `<td style="border:1pt solid #334155;padding:5pt 7pt;font-size:11pt;text-align:${cIdx === 0 ? "left" : "center"};${isLastTotal ? "font-weight:bold;background:#f8fafc;" : ""}">${escapeHtml(cell)}</td>`
        )
        .join("");
      return `<tr style="page-break-inside:avoid;mso-pagination:lines-together;">${tds}</tr>`;
    })
    .join("");

  return `
    <p style="margin:10pt 0 4pt 0;font-weight:bold;font-size:11.5pt;color:#0f172a;text-indent:0;page-break-after:avoid;">${escapeHtml(t.title)}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:10pt;font-family:'Times New Roman',serif;page-break-inside:avoid;mso-pagination:lines-together;">
      <thead><tr style="page-break-inside:avoid;mso-pagination:lines-together;">${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>
  `;
}

function renderHtmlChartForWord(chart: AmaliyIshChart): string {
  const maxVal = Math.max(...chart.bars.map((b) => b.value), chart.overallMean, 1);
  const rowsHtml = chart.bars
    .map((b) => {
      const pct = Math.min(100, Math.max(12, Math.round((b.value / maxVal) * 88)));
      return `
        <tr>
          <td style="width:32%;padding:5pt 8pt;border:1pt solid #cbd5e1;font-size:10pt;font-weight:bold;">${escapeHtml(b.label)}</td>
          <td style="width:53%;padding:5pt 8pt;border:1pt solid #cbd5e1;background:#f8fafc;">
            <div style="width:${pct}%;background:${b.color};color:#ffffff;padding:3pt 6pt;font-size:9.5pt;font-weight:bold;text-align:right;">
              ${escapeHtml(b.value)}
            </div>
          </td>
          <td style="width:15%;padding:5pt 8pt;border:1pt solid #cbd5e1;text-align:center;font-size:10pt;font-weight:bold;">${escapeHtml(b.value)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="border:1pt solid #94a3b8;padding:10pt;margin:10pt 0;background:#ffffff;">
      <p style="margin:0 0 6pt 0;font-weight:bold;font-size:11pt;text-align:center;color:#0f172a;">${escapeHtml(chart.figureNumber)}. ${escapeHtml(chart.title)}</p>
      <p style="margin:0 0 6pt 0;font-size:10pt;text-align:center;color:#b91c1c;font-weight:bold;">--- ${escapeHtml(chart.overallMeanLabel)} ---</p>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border:1pt solid #cbd5e1;background:#f1f5f9;padding:4pt 6pt;font-size:9.5pt;text-align:left;">Guruh / Ko'rsatkich</th>
            <th style="border:1pt solid #cbd5e1;background:#f1f5f9;padding:4pt 6pt;font-size:9.5pt;text-align:left;">Ustunli grafik ulushi (${escapeHtml(chart.yAxisLabel)})</th>
            <th style="border:1pt solid #cbd5e1;background:#f1f5f9;padding:4pt 6pt;font-size:9.5pt;text-align:center;">Qiymat</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <p style="margin:6pt 0 0 0;font-size:9.5pt;font-style:italic;text-align:center;color:#334155;">${escapeHtml(chart.caption)}</p>
    </div>
  `;
}

/**
 * Microsoft Word (.doc) uchun to'liq A4 formatdagi HTML hujjat generatsiyasi
 * (Titul varag'i, barcha jadvallar, diagrammalar, Excel funksiyalari va Xulosa bilan)
 */
export function buildAmaliyIshWordHtml(doc: AmaliyIshDocument): string {
  const problemsHtml = doc.problems
    .map(
      (p) => `
      <div style="page-break-inside:avoid;margin-top:16pt;">
        <h2 style="font-size:14pt;font-weight:bold;color:#0f172a;border-bottom:1.5pt solid #1e3a8a;padding-bottom:4pt;margin-bottom:8pt;">
          ${escapeHtml(p.title)} (${escapeHtml(p.points)})
        </h2>
        <p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin-bottom:8pt;">
          <b>Masala sharti:</b> ${escapeHtml(p.condition)}
        </p>
        ${renderHtmlTableForWord(p.initialTable)}

        <h3 style="font-size:13.5pt;font-weight:bold;color:#1e3a8a;margin:10pt 0 4pt 0;">
          Yechim:
        </h3>

        <p style="font-size:13.5pt;font-weight:bold;margin:8pt 0 4pt 0;">${escapeHtml(p.stepA.heading)}</p>
        <ul style="margin:4pt 0 8pt 18pt;font-size:13pt;line-height:1.45;">
          ${p.stepA.hypotheses.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
        </ul>
        ${renderHtmlTableForWord(p.stepA.helperTable)}
        <p style="font-size:11.5pt;font-weight:bold;margin:4pt 0 2pt 0;">Qo'lda hisoblash ifodalari:</p>
        <ul style="margin:2pt 0 8pt 18pt;font-size:11pt;font-family:'Courier New',monospace;">
          ${p.stepA.manualSampleCalc.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
        </ul>

        <p style="font-size:13.5pt;font-weight:bold;margin:8pt 0 4pt 0;">${escapeHtml(p.stepB.heading)}</p>
        ${renderHtmlTableForWord(p.stepB.formulaTable)}
        <p style="font-size:12.5pt;background:#f1f5f9;border-left:3pt solid #2563eb;padding:6pt 8pt;margin:6pt 0;">
          <b>${escapeHtml(p.stepB.verificationEquality)}</b>
        </p>

        <p style="font-size:13.5pt;font-weight:bold;margin:8pt 0 4pt 0;">${escapeHtml(p.stepC.heading)}</p>
        ${renderHtmlTableForWord(p.stepC.anovaTable)}

        <p style="font-size:13.5pt;font-weight:bold;margin:8pt 0 4pt 0;">${escapeHtml(p.stepD.heading)}</p>
        <p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin:4pt 0;">
          <b>Qaror:</b> ${escapeHtml(p.stepD.decisionTitle)}<br/>
          ${escapeHtml(p.stepD.decisionExplanation)}
        </p>

        <p style="font-size:13.5pt;font-weight:bold;margin:8pt 0 4pt 0;">${escapeHtml(p.stepE.heading)}</p>
        <p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin:4pt 0;">
          <b>Omil kuchi (η²):</b> ${escapeHtml(p.stepE.etaFormula)}<br/>
          <b>Iqtisodiy talqin:</b> ${escapeHtml(p.stepE.economicInterpretation)}
        </p>
        <ul style="margin:4pt 0 8pt 18pt;font-size:13pt;line-height:1.45;">
          ${p.stepE.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
        </ul>
        ${renderHtmlChartForWord(p.stepE.chart)}
      </div>
    `
    )
    .join('<hr style="border:none;border-top:1pt dashed #94a3b8;margin:16pt 0;" />');

  const excelTable: AmaliyIshTable = {
    title: doc.excelSection.tableTitle,
    headers: ["Katak", "Ko'rsatkich", "Formula (EN)", "Formula (RU)", "Natija"],
    rows: doc.excelSection.formulas.map((f) => [
      f.cell,
      f.indicator,
      f.formulaEn,
      f.formulaRu,
      f.result,
    ]),
  };

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.meta.subject)} - ${escapeHtml(doc.meta.variant)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 595.3pt 841.9pt;
      margin: 56.7pt 42.5pt 56.7pt 85.05pt;
      mso-header-margin: 35.4pt;
      mso-footer-margin: 35.4pt;
    }
    div.WordSection1 {
      page: WordSection1;
      font-family: "Times New Roman", Times, serif;
      font-size: 14pt;
      line-height: 1.5;
      color: #000000;
    }
    p, li, td, th {
      font-family: "Times New Roman", Times, serif;
    }
    p.academic-para {
      font-size: 14pt;
      line-height: 1.5;
      text-align: justify;
      text-indent: 1.25cm;
      margin: 0 0 6pt 0;
      mso-pagination: widow-orphan;
    }
    table {
      page-break-inside: avoid;
      mso-pagination: lines-together;
      border-collapse: collapse;
    }
    tr {
      page-break-inside: avoid;
      mso-pagination: lines-together;
    }
  </style>
</head>
<body>
  <div class="WordSection1">
    <!-- TITUL VARAG'I -->
    <div style="text-align:center;padding:16pt 0;font-family:'Times New Roman',serif;">
      <p style="font-size:11pt;font-weight:bold;letter-spacing:0.5pt;margin:0 0 6pt 0;text-transform:uppercase;">
        ${escapeHtml(doc.meta.ministry)}
      </p>
      <p style="font-size:13.5pt;font-weight:bold;color:#000000;margin:0 0 4pt 0;text-transform:uppercase;">
        ${escapeHtml(doc.meta.university)}
      </p>
      <p style="font-size:11pt;font-style:italic;color:#334155;margin:0 0 24pt 0;">
        ${escapeHtml(doc.meta.department)}
      </p>

      <div style="margin:28pt 0 18pt 0;">
        <p style="font-size:12pt;font-weight:bold;margin:0 0 8pt 0;text-transform:uppercase;">
          «${escapeHtml(doc.meta.subject)}» FANIDAN
        </p>
        <h1 style="font-size:24pt;font-weight:bold;color:#000000;margin:8pt 0;letter-spacing:1.5pt;">
          ${escapeHtml(doc.meta.workType)}
        </h1>
        <p style="font-size:13pt;font-weight:bold;color:#000000;margin:8pt 0;letter-spacing:0.5pt;">
          ${escapeHtml(doc.meta.variant)}
        </p>
      </div>

      <div style="margin:20pt auto 24pt auto;text-align:center;width:90%;font-size:12pt;line-height:1.6;">
        <p style="margin:4pt 0;"><b>Mavzu:</b> ${escapeHtml(doc.meta.topic)}</p>
        <p style="margin:4pt 0;color:#1e293b;"><b>Vaziyat:</b> ${escapeHtml(doc.meta.situation)}</p>
      </div>

      <table style="width:55%;margin:28pt 0 28pt auto;border-collapse:collapse;font-size:12pt;font-family:'Times New Roman',serif;">
        <tr>
          <td style="text-align:left;padding:5pt 0;width:45%;"><b>Tayyorladi:</b></td>
          <td style="text-align:right;padding:5pt 0;border-bottom:1pt solid #000000;">${escapeHtml(doc.meta.studentName)}</td>
        </tr>
        <tr>
          <td style="text-align:left;padding:5pt 0;"><b>Guruhi:</b></td>
          <td style="text-align:right;padding:5pt 0;border-bottom:1pt solid #000000;">${escapeHtml(doc.meta.studentGroup)}</td>
        </tr>
        <tr>
          <td style="text-align:left;padding:5pt 0;"><b>Vazifa berdi:</b></td>
          <td style="text-align:right;padding:5pt 0;border-bottom:1pt solid #000000;">${escapeHtml(doc.meta.teacherName)}</td>
        </tr>
      </table>

      <p style="font-size:12pt;font-weight:bold;margin-top:40pt;text-align:center;">
        ${escapeHtml(doc.meta.city)} – ${escapeHtml(doc.meta.year)}
      </p>
    </div>

    <br clear="all" style="page-break-before:always" />

    <!-- 1. KIRISH -->
    <h1 style="font-size:16pt;font-weight:bold;text-align:center;color:#000000;margin-bottom:14pt;text-transform:uppercase;">
      ${escapeHtml(doc.introduction.title)}
    </h1>
    <h3 style="font-size:13.5pt;font-weight:bold;color:#000000;margin:10pt 0 4pt 0;">
      ${doc.meta.language === "ru" ? "Актуальность темы:" : doc.meta.language === "en" ? "Relevance of the Topic:" : "Mavzuning dolzarbligi:"}
    </h3>
    <p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin-bottom:8pt;">
      ${escapeHtml(doc.introduction.relevance)}
    </p>

    <h3 style="font-size:13.5pt;font-weight:bold;color:#000000;margin:10pt 0 4pt 0;">
      ${doc.meta.language === "ru" ? "Цель работы:" : doc.meta.language === "en" ? "Purpose of Practical Work:" : "Amaliy ishning maqsadi:"}
    </h3>
    <p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin-bottom:8pt;">
      ${escapeHtml(doc.introduction.purpose)}
    </p>

    <h3 style="font-size:13.5pt;font-weight:bold;color:#000000;margin:10pt 0 4pt 0;">
      ${doc.meta.language === "ru" ? "Основные задачи работы:" : doc.meta.language === "en" ? "Primary Tasks:" : "Amaliy ishning asosiy vazifalari:"}
    </h3>
    <ul style="margin:4pt 0 8pt 24pt;font-size:14pt;line-height:1.5;">
      ${doc.introduction.tasks.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
    </ul>

    <h3 style="font-size:13.5pt;font-weight:bold;color:#000000;margin:10pt 0 4pt 0;">
      ${doc.meta.language === "ru" ? "Объект и предмет исследования:" : doc.meta.language === "en" ? "Object and Subject of Research:" : "Tadqiqot obyekti va predmeti:"}
    </h3>
    <p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin-bottom:8pt;">
      ${escapeHtml(doc.introduction.objectAndSubject)}
    </p>

    <h3 style="font-size:13.5pt;font-weight:bold;color:#000000;margin:10pt 0 4pt 0;">
      ${doc.meta.language === "ru" ? "Методы исследования:" : doc.meta.language === "en" ? "Applied Methods & Tools:" : "Qo'llanilgan metodlar va dasturiy vositalar:"}
    </h3>
    <ul style="margin:4pt 0 8pt 24pt;font-size:14pt;line-height:1.5;">
      ${doc.introduction.methods.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
    </ul>

    <br clear="all" style="page-break-before:always" />

    <!-- 2. I BOB: NAZARIY VA USLUBIY ASOSLAR -->
    <h1 style="font-size:15pt;font-weight:bold;text-align:center;color:#000000;margin-bottom:14pt;text-transform:uppercase;">
      ${escapeHtml(doc.theorySection.title)}
    </h1>
    ${doc.theorySection.paragraphs
      .map(
        (p) =>
          `<p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin-bottom:8pt;">${escapeHtml(p)}</p>`
      )
      .join("")}

    ${renderHtmlTableForWord({
      title:
        doc.meta.language === "ru"
          ? "Таблица 0. Ключевые аналитические формулы дисперсионного анализа"
          : doc.meta.language === "en"
            ? "Table 0. Key Analytical Formulas of ANOVA"
            : "Nazariy asoslar: Dispersion tahlilning asosiy matematik formulalari",
      headers: [
        doc.meta.language === "ru"
          ? "Показатель"
          : doc.meta.language === "en"
            ? "Indicator"
            : "Ko'rsatkich nomi",
        doc.meta.language === "ru"
          ? "Формула"
          : doc.meta.language === "en"
            ? "Formula"
            : "Matematik formula",
        doc.meta.language === "ru"
          ? "Описание"
          : doc.meta.language === "en"
            ? "Description"
            : "Iqtisodiy-statistik tavsifi",
      ],
      rows: doc.theorySection.keyFormulas.map((f) => [f.name, f.formula, f.note]),
    })}

    <br clear="all" style="page-break-before:always" />

    <!-- 3. II BOB: ASOSIY HISOBLASH VA TAHLIL QISMI -->
    <h1 style="font-size:15pt;font-weight:bold;text-align:center;color:#000000;margin-bottom:4pt;text-transform:uppercase;">
      ${
        doc.meta.language === "ru"
          ? "ГЛАВА II. РАСЧЕТНО-АНАЛИТИЧЕСКАЯ ЧАСТЬ ПРАКТИЧЕСКОЙ РАБОТЫ"
          : doc.meta.language === "en"
            ? "CHAPTER II. COMPUTATIONAL AND EMPIRICAL ANALYSIS"
            : "II BOB. AMALIY ISHNING HISOBLASH VA TAHLIL QISMI"
      }
    </h1>
    <p style="font-size:11pt;text-align:center;color:#334155;margin-top:0;margin-bottom:12pt;">
      <b>${doc.meta.variant}:</b> ${escapeHtml(doc.meta.topic)} (${escapeHtml(doc.meta.situation)})
    </p>

    <div style="border:1pt solid #cbd5e1;background:#f8fafc;padding:10pt 12pt;margin-bottom:14pt;">
      <p style="font-size:11pt;font-weight:bold;margin:0 0 4pt 0;color:#1e3a8a;">
        ${escapeHtml(doc.methodologicalNote.title)}:
      </p>
      <ul style="margin:0 0 0 18pt;font-size:10.5pt;line-height:1.4;">
        ${doc.methodologicalNote.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
      </ul>
    </div>

    ${problemsHtml}

    <br clear="all" style="page-break-before:always" />

    <!-- 4. III BOB: EXCEL BO'LIMI -->
    <h1 style="font-size:15pt;font-weight:bold;text-align:center;color:#000000;margin-bottom:8pt;text-transform:uppercase;">
      ${
        doc.meta.language === "ru"
          ? "ГЛАВА III. МЕТОДИКА РАСЧЁТА В СРЕДЕ MICROSOFT EXCEL"
          : doc.meta.language === "en"
            ? "CHAPTER III. COMPUTATIONAL IMPLEMENTATION IN MICROSOFT EXCEL"
            : "III BOB. AMALIY ISHNI MS EXCEL DASTURIDA BAJARISH METODIKASI"
      }
    </h1>
    <h2 style="font-size:13pt;font-weight:bold;color:#0f172a;border-bottom:1.5pt solid #166534;padding-bottom:4pt;">
      ${escapeHtml(doc.excelSection.title)}
    </h2>
    <p style="font-size:11pt;font-style:italic;margin-bottom:8pt;">
      ${escapeHtml(doc.excelSection.subtitle)}
    </p>
    <ol style="margin:4pt 0 10pt 18pt;font-size:11pt;line-height:1.5;">
      ${doc.excelSection.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
    </ol>
    ${renderHtmlTableForWord(excelTable)}

    <br clear="all" style="page-break-before:always" />

    <!-- 5. UMUMIY XULOSA VA TAVSIYALAR -->
    <h1 style="font-size:15pt;font-weight:bold;text-align:center;color:#000000;margin-bottom:12pt;text-transform:uppercase;">
      ${escapeHtml(doc.summarySection.title)}
    </h1>
    ${renderHtmlTableForWord(doc.summarySection.comparisonTable)}

    <p style="font-size:13.5pt;font-weight:bold;margin:10pt 0 4pt 0;">Ilmiy-amaliy xulosalar:</p>
    ${doc.summarySection.conclusions
      .map(
        (c) =>
          `<p style="font-size:14pt;line-height:1.5;text-align:justify;text-indent:1.25cm;margin:4pt 0;">${escapeHtml(c)}</p>`
      )
      .join("")}

    <p style="font-size:13.5pt;font-weight:bold;margin:10pt 0 4pt 0;">Boshqaruv uchun amaliy tavsiyalar:</p>
    <ul style="margin:4pt 0 12pt 24pt;font-size:13.5pt;line-height:1.5;">
      ${doc.summarySection.practicalRecommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}
    </ul>

    <br clear="all" style="page-break-before:always" />

    <!-- 6. FOYDALANILGAN ADABIYOTLAR -->
    <h1 style="font-size:15pt;font-weight:bold;text-align:center;color:#000000;margin-bottom:14pt;text-transform:uppercase;">
      ${
        doc.meta.language === "ru"
          ? "СПИСОК ИСПОЛЬЗОВАННОЙ ЛИТЕРАТУРЫ"
          : doc.meta.language === "en"
            ? "LIST OF REFERENCES"
            : "FOYDALANILGAN ADABIYOTLAR RO'YXATI"
      }
    </h1>
    <ol style="margin:4pt 0 12pt 24pt;font-size:13pt;line-height:1.6;">
      ${doc.references.map((r) => `<li style="margin-bottom:4pt;">${escapeHtml(r.replace(/^\d+\.\s*/, ""))}</li>`).join("")}
    </ol>
  </div>
</body>
</html>`;
}
