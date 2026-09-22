export async function generateChatResponse(message: string): Promise<string> {
  // Artificial delay to simulate AI
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let reply = "Kechirasiz, men hali o'rganish jarayonidaman. Sizga qanday yordam bera olaman?";
  const text = message.toLowerCase();
  
  if (text.includes("salom")) {
    reply = "Assalomu alaykum! Sizga qanday karyera maslahati kerak?";
  } else if (text.includes("rezyume")) {
    reply = "Rezyume tayyorlash uchun /cv-builder bo'limiga o'tishingiz mumkin. Keling, yutuqlaringizni kuchliroq fe'llar bilan yozamiz!";
  } else if (text.includes("intervyu")) {
    reply = "Intervyuga tayyorgarlik ko'rish uchun /mock-test bo'limini tavsiya qilaman. Qaysi soha bo'yicha topshiryapsiz?";
  }

  return reply;
}

export async function generateMockTestQuestion(lang: string, role: string, difficulty: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return lang === "RU" 
    ? `Расскажите о себе и своем опыте работы в качестве ${role} (${difficulty}).`
    : `Please introduce yourself and your experience as a ${role} (${difficulty}).`;
}

export async function evaluateMockTestAnswer(answer: string, questionCount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  if (questionCount < 5) {
    return {
      isFinished: false,
      nextQuestion: "Can you describe a challenging project you worked on and how you overcame the obstacles?"
    };
  } else {
    return {
      isFinished: true,
      score: 85,
      feedback: "Great job! Your answers demonstrate a solid understanding of fundamental concepts.\n\nGrammar & Clarity:\n- Ensure you use past tense when discussing previous projects.\n- Your technical vocabulary is well utilized.\n\nProbability of passing a real interview: High."
    };
  }
}
