import { NextResponse } from "next/server";
import { checkUserLimit, incrementFeatureUsage } from "@/lib/limits";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generateChatResponse } from "@/lib/ai/geminiService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "mock-user-id";

    if (session?.user?.id) {
      const limitCheck = await checkUserLimit(userId, "chat");
      if (limitCheck.limitExceeded) {
        return NextResponse.json(
          { error: limitCheck.error, code: limitCheck.code },
          { status: 429 }
        );
      }
    }

    const { message } = await req.json();
    const reply = await generateChatResponse(message);

    if (session?.user?.id) {
      await incrementFeatureUsage(userId, "chat");
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
