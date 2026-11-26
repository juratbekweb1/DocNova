export interface TokenPack {
  id: "TOKEN_1" | "TOKEN_5" | "TOKEN_15";
  tokens: number;
  amountUzs: number;
  title: string;
  subtitle: string;
  badge?: string;
  pricePerTokenLabel: string;
}

export const ACADEMIC_TOKEN_PACKS: TokenPack[] = [
  {
    id: "TOKEN_1",
    tokens: 1,
    amountUzs: 5_000,
    title: "1 ta Akademik Token",
    subtitle: "1 ta kurs ishi, referat, mustaqil ish yoki amaliy ish uchun",
    pricePerTokenLabel: "5 000 so'm / ish",
  },
  {
    id: "TOKEN_5",
    tokens: 5,
    amountUzs: 20_000,
    title: "5 ta Akademik Token",
    subtitle: "5 ta ixtiyoriy akademik ish (20% tejamkor)",
    badge: "Ommabop",
    pricePerTokenLabel: "4 000 so'm / ish",
  },
  {
    id: "TOKEN_15",
    tokens: 15,
    amountUzs: 50_000,
    title: "15 ta Akademik Token",
    subtitle: "Semestr davomida barcha fanlar uchun (33% tejamkor)",
    badge: "Eng foydali",
    pricePerTokenLabel: "3 333 so'm / ish",
  },
];

export function resolveTokenPackById(id: string): TokenPack | undefined {
  const normalized = id.trim().toUpperCase();
  return ACADEMIC_TOKEN_PACKS.find((p) => p.id === normalized);
}

export function resolveTokenPackByAmount(amount: number): TokenPack | undefined {
  return ACADEMIC_TOKEN_PACKS.find((p) => Math.abs(p.amountUzs - amount) < 1);
}
