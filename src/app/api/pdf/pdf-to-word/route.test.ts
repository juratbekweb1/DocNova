import { describe, it, expect, vi } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/pdf-limit", () => ({
  checkPdfLimit: vi.fn().mockResolvedValue(true),
  increasePdfLimit: vi.fn().mockResolvedValue(undefined),
}));

describe("PDF to Word API Route", () => {
  it("GET returns 405 Method Not Allowed", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
    const json = await res.json();
    expect(json.error).toContain("Method not allowed");
  });

  it("POST with application/json without storageFile returns 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/pdf/pdf-to-word", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Yuklangan PDF fayl havolasi topilmadi");
  });
});
