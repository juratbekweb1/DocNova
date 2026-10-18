"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function generateSectionSuggestion(
  sectionType: string,
  currentText: string,
  instruction: string
): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  // In a real implementation, this would call IAIProvider
  // For Phase 9 preparation, we mock a blocking AI response to build the UI logic

  await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate AI latency

  if (instruction === "Make Professional") {
    return `[AI Enhanced] ${currentText} (Rewritten for maximum professional impact and ATS optimization)`;
  }

  if (instruction === "Add Impact") {
    return `${currentText} Resulting in a 40% increase in performance and saving $10,000 annually.`;
  }

  return `Here is a suggested improvement for your ${sectionType}: ${currentText} ...`;
}
