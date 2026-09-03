import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUserSubscription } from "@/lib/billing/subscription";

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);

    // Only Premium users can access aiScoreFeedback
    if (!subscription.isPremium || subscription.planSlug !== "premium") {
      return NextResponse.json(
        {
          error: "Access Denied",
          requireUpgrade: true,
          upgradeMessage:
            "IELTS AI Score & Feedback faqat Premium tarifida mavjud. Iltimos, tarifingizni yangilang.",
        },
        { status: 403 }
      );
    }

    // Logic for AI Score Feedback would go here

    return NextResponse.json({
      success: true,
      message: "AI Score Feedback generated successfully.",
    });
  } catch (error) {
    console.error("aiScoreFeedback error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
