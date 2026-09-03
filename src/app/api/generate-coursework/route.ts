import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: ".env.local faylida GEMINI_API_KEY topilmadi" },
        { status: 500 }
      );
    }

    const { subject, topic, university, studentName, teacherName, year } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);

    // Rasmiy ishlaydigan aniq model ID: "gemini-1.5-flash" (yoki "gemini-pro")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Siz O'zbekiston OTM standartlarini mukammal biladigan senior akademik professorsiz. 
Quyidagi ma'lumotlar bo'yicha to'liq, chuqur va akademik Kurs Ishi matnini tuzing:

- Fan: ${subject}
- Mavzu: ${topic}
- Universitet/OTM: ${university}
- Talaba F.I.Sh: ${studentName}
- Ilmiy rahbar: ${teacherName}
- Yil: ${year}

Struktura strictly quyidagicha bo'lsin:
# TITUL SAHIFASI
[Universitet, Mavzu, Talaba va O'qituvchi ma'lumotlari]

---
# MUNDARIJA

---
# KIRISH
- Mavzuning dolzarbligi, maqsadi va vazifalari

---
# I-BOB. [Nazariy Bob]
## 1.1. Kichik bo'lim
## 1.2. Kichik bo'lim

---
# II-BOB. [Amaliy/Tahliliy Bob]
## 2.1. Kichik bo'lim
## 2.2. Kichik bo'lim

---
# XULOSA VA TAVSIYALAR

---
# FOYDALANILGAN ADABIYOTLAR RO'YXATI
    `;

    // Agar gemini-1.5-flash ishlamasa fallback qilish
    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (_e) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
      result = await fallbackModel.generateContent(prompt);
    }

    const responseText = result.response.text();
    return NextResponse.json({ result: responseText });
  } catch (error: unknown) {
    console.error("Gemini API Error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err?.message || "AI bilan bog'lanishda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
