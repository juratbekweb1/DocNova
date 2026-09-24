import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json(plans);
  } catch (_error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
