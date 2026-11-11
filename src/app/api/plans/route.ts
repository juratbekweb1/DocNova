import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FALLBACK_PLANS = [
  {
    id: "plan_free",
    name: "Free",
    slug: "free",
    description: "Start for free",
    priceMonthly: 0,
    priceYearly: 0,
    features: ["Basic features"],
    limits: { dailyAiCount: 5 },
  },
  {
    id: "plan_pro",
    name: "Pro",
    slug: "pro",
    description: "Professional features",
    priceMonthly: 39000,
    priceYearly: 374000,
    features: ["Pro features"],
    limits: { dailyAiCount: 50 },
  },
  {
    id: "plan_premium",
    name: "Premium",
    slug: "premium",
    description: "All features unlocked",
    priceMonthly: 69000,
    priceYearly: 662000,
    features: ["Everything"],
    limits: { dailyAiCount: 9999 },
  },
];

let cachedPlans: unknown[] | null = null;
let cachedPlansAt = 0;
const PLANS_CACHE_TTL_MS = 60_000;

export async function GET() {
  const now = Date.now();
  if (cachedPlans && now - cachedPlansAt < PLANS_CACHE_TTL_MS) {
    return NextResponse.json(cachedPlans, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    let plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: "asc" },
    });

    // Override prices
    plans = plans.map((p) => {
      if (p.slug === "pro") {
        return { ...p, priceMonthly: 39000, priceYearly: 374000 };
      }
      if (p.slug === "premium") {
        return { ...p, priceMonthly: 69000, priceYearly: 662000 };
      }
      return p;
    });

    const result = !plans || plans.length === 0 ? FALLBACK_PLANS : plans;
    cachedPlans = result;
    cachedPlansAt = Date.now();

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Plans fetch error";
    console.error("Database connection failed in /api/plans:", message);
    // Return fallback plans instead of 500 error so the UI doesn't crash
    return NextResponse.json(FALLBACK_PLANS, { status: 200 });
  }
}
