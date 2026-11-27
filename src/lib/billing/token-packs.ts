export interface TokenPack {
  id:
    | "TOKEN_1"
    | "TOKEN_3"
    | "TOKEN_5"
    | "TOKEN_10"
    | "TOKEN_15"
    | "TOKEN_20"
    | "TOKEN_CUSTOM"
    | string;
  tokens: number;
  amountUzs: number;
  title: string;
  subtitle: string;
  badge?: string;
  pricePerTokenLabel: string;
}

/** Price per token based on balanced quantity tiers */
export function calcCustomTokenPrice(tokens: number): number {
  if (tokens >= 20) return Math.round(tokens * 3_000); // 40% discount
  if (tokens >= 10) return Math.round(tokens * 3_500); // 30% discount
  if (tokens >= 5) return Math.round(tokens * 3_800); // 24% discount
  if (tokens >= 3) return Math.round(tokens * 4_000); // 20% discount
  return tokens * 5_000;
}

export function buildCustomTokenPack(tokens: number): TokenPack {
  const amount = calcCustomTokenPrice(tokens);
  const priceEach = Math.round(amount / tokens);
  const discount =
    tokens >= 20
      ? " (40% tejamkor)"
      : tokens >= 10
        ? " (30% tejamkor)"
        : tokens >= 5
          ? " (24% tejamkor)"
          : tokens >= 3
            ? " (20% tejamkor)"
            : "";
  return {
    id: "TOKEN_CUSTOM",
    tokens,
    amountUzs: amount,
    title: `${tokens} ta Akademik Token`,
    subtitle: `${tokens} ta ixtiyoriy akademik ish${discount}`,
    pricePerTokenLabel: `${priceEach.toLocaleString("uz-UZ")} so'm / ish`,
  };
}

export const ACADEMIC_TOKEN_PACKS: TokenPack[] = [
  {
    id: "TOKEN_1",
    tokens: 1,
    amountUzs: 5_000,
    title: "1 ta Token",
    subtitle: "1 ta kurs ishi, referat, mustaqil ish yoki amaliy ish uchun",
    pricePerTokenLabel: "5 000 so'm / ish",
  },
  {
    id: "TOKEN_3",
    tokens: 3,
    amountUzs: 12_000,
    title: "3 ta Token",
    subtitle: "3 ta ixtiyoriy akademik ish (20% tejamkor)",
    badge: "Talabalar tanlovi",
    pricePerTokenLabel: "4 000 so'm / ish",
  },
  {
    id: "TOKEN_5",
    tokens: 5,
    amountUzs: 19_000,
    title: "5 ta Token",
    subtitle: "5 ta akademik ish (24% tejamkor)",
    badge: "Ommabop 🔥",
    pricePerTokenLabel: "3 800 so'm / ish",
  },
  {
    id: "TOKEN_10",
    tokens: 10,
    amountUzs: 35_000,
    title: "10 ta Token",
    subtitle: "Oraliq va yakuniy barcha ishlar uchun (30% tejamkor)",
    badge: "Eng maqbul 🌟",
    pricePerTokenLabel: "3 500 so'm / ish",
  },
  {
    id: "TOKEN_20",
    tokens: 20,
    amountUzs: 60_000,
    title: "20 ta Token",
    subtitle: "Butun semestr barcha fanlar uchun (40% tejamkor)",
    badge: "Super VIP 👑",
    pricePerTokenLabel: "3 000 so'm / ish",
  },
];

// Backwards compatibility legacy packs
const LEGACY_PACKS: TokenPack[] = [
  {
    id: "TOKEN_15",
    tokens: 15,
    amountUzs: 50_000,
    title: "15 ta Akademik Token",
    subtitle: "Semestr davomida barcha fanlar uchun (33% tejamkor)",
    badge: "Eng foydali",
    pricePerTokenLabel: "3 333 so'm / ish",
  },
  {
    id: "TOKEN_5_LEGACY",
    tokens: 5,
    amountUzs: 20_000,
    title: "5 ta Akademik Token",
    subtitle: "5 ta ixtiyoriy akademik ish",
    pricePerTokenLabel: "4 000 so'm / ish",
  },
];

export function resolveTokenPackById(id: string): TokenPack | undefined {
  const normalized = id.trim().toUpperCase();
  return (
    ACADEMIC_TOKEN_PACKS.find((p) => p.id === normalized) ||
    LEGACY_PACKS.find((p) => p.id === normalized)
  );
}

export function resolveTokenPackByAmount(amount: number): TokenPack | undefined {
  return (
    ACADEMIC_TOKEN_PACKS.find((p) => Math.abs(p.amountUzs - amount) < 1) ||
    LEGACY_PACKS.find((p) => Math.abs(p.amountUzs - amount) < 1)
  );
}
