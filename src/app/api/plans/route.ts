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
    limits: { dailyAiCount: 5 }
  },
  {
    id: "plan_pro",
    name: "Pro",
    slug: "pro",
    description: "Professional features",
    priceMonthly: 29990,
    priceYearly: 287900,
    features: ["Pro features"],
    limits: { dailyAiCount: 50 }
  },
  {
    id: "plan_premium",
    name: "Premium",
    slug: "premium",
    description: "All features unlocked",
    priceMonthly: 49990,
    priceYearly: 479900,
    features: ["Everything"],
    limits: { dailyAiCount: 9999 }
  }
];

export async function GET() {
  try {
    let plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: "asc" },
    });
    
    // Override prices
    plans = plans.map(p => {
      if (p.slug === 'pro') {
        return { ...p, priceMonthly: 29990, priceYearly: 287900 };
      }
      if (p.slug === 'premium') {
        return { ...p, priceMonthly: 49990, priceYearly: 479900 };
      }
      return p;
    });

    if (!plans || plans.length === 0) {
      return NextResponse.json(FALLBACK_PLANS);
    }

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Database connection failed in /api/plans:", error.message);
    // Return fallback plans instead of 500 error so the UI doesn't crash
    return NextResponse.json(FALLBACK_PLANS, { status: 200 });
  }
}
