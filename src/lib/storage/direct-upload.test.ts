import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  formatBytesCompact,
  isAllowedDirectUploadFile,
  isValidDirectStoragePath,
  sanitizeStorageFileName,
} from "./direct-upload-shared";
import {
  createSupabaseSignedUploadUrl,
  getActiveDirectStorageProvider,
} from "./direct-upload-server";
import { GET as storageUploadGet, POST as storageUploadPost } from "@/app/api/storage/upload/route";

describe("Direct Client-Side Storage Upload (4.5 MB Vercel limit bypass)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_STORAGE_BUCKET;
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.BLOB_STORE_ID;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("validates storage paths strictly against SSRF and path traversal", () => {
    expect(isValidDirectStoragePath("uploads/samples/abc-123-thesis.pdf")).toBe(true);
    expect(isValidDirectStoragePath("uploads/topics/img_01.jpg")).toBe(true);
    expect(isValidDirectStoragePath("uploads/pdf/doc.pdf")).toBe(true);
    expect(isValidDirectStoragePath("uploads/outputs/merged.pdf")).toBe(true);

    expect(isValidDirectStoragePath("../etc/passwd")).toBe(false);
    expect(isValidDirectStoragePath("uploads/samples/../../secret.env")).toBe(false);
    expect(isValidDirectStoragePath("https://evil.example/file.pdf")).toBe(false);
    expect(isValidDirectStoragePath("/uploads/samples/file.pdf")).toBe(false);
    expect(isValidDirectStoragePath("private/other/file.pdf")).toBe(false);
    expect(isValidDirectStoragePath("uploads/samples/file\0.pdf")).toBe(false);
  });

  it("allows safe academic/image/PDF file types and blocks executables/scripts", () => {
    expect(isAllowedDirectUploadFile("diplom-ishi.docx")).toBe(true);
    expect(isAllowedDirectUploadFile("kitob-12mb.pdf")).toBe(true);
    expect(isAllowedDirectUploadFile("mavzular.heic")).toBe(true);
    expect(isAllowedDirectUploadFile("screenshot.png", "image/png")).toBe(true);
    expect(isAllowedDirectUploadFile("notes.txt", "text/plain")).toBe(true);

    expect(isAllowedDirectUploadFile("shell.php")).toBe(false);
    expect(isAllowedDirectUploadFile("malware.exe", "application/octet-stream")).toBe(false);
    expect(isAllowedDirectUploadFile("xss.svg", "application/octet-stream")).toBe(false);
    expect(isAllowedDirectUploadFile("script.sh")).toBe(false);
  });

  it("sanitizes filenames and formats byte sizes cleanly", () => {
    expect(sanitizeStorageFileName("../../O'zbekcha Diplom (2026).pdf")).toBe(
      "O_zbekcha_Diplom_2026_.pdf"
    );
    expect(formatBytesCompact(512)).toBe("512 B");
    expect(formatBytesCompact(1536)).toBe("1.5 KB");
    expect(formatBytesCompact(12 * 1024 * 1024)).toBe("12.0 MB");
  });

  it("prioritizes Supabase when configured, otherwise selects Vercel Blob, or null when unconfigured", () => {
    expect(getActiveDirectStorageProvider()).toBeNull();

    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_test_token";
    expect(getActiveDirectStorageProvider()).toBe("vercel-blob");

    process.env.SUPABASE_URL = "https://demo.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_service_role_secret";
    expect(getActiveDirectStorageProvider()).toBe("supabase");
  });

  it("creates a Supabase Signed Upload URL via REST API without sending file bytes to Vercel", async () => {
    process.env.SUPABASE_URL = "https://demo.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_service_role_secret";
    process.env.SUPABASE_STORAGE_BUCKET = "academic-docs";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          url: "/object/upload/sign/academic-docs/uploads/samples/test.pdf?token=abc123",
          token: "abc123",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const signed = await createSupabaseSignedUploadUrl({
      folder: "samples",
      fileName: "Katta Kitob 18MB.pdf",
      fileSize: 18 * 1024 * 1024,
      mimeType: "application/pdf",
    });

    expect(signed.provider).toBe("supabase");
    expect(signed.bucket).toBe("academic-docs");
    expect(signed.signedUrl).toContain("https://demo.supabase.co/storage/v1/object/upload/sign/");
    expect(signed.path).toMatch(/^uploads\/samples\/.*Katta_Kitob_18MB\.pdf$/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("GET /api/storage/upload reports active provider and POST issues Supabase signed URL", async () => {
    process.env.SUPABASE_URL = "https://demo.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_service_role_secret";

    const getRes = await storageUploadGet();
    expect(getRes.status).toBe(200);
    const getBody = (await getRes.json()) as { available: boolean; provider: string };
    expect(getBody.available).toBe(true);
    expect(getBody.provider).toBe("supabase");

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          url: "/object/upload/sign/docnova-uploads/uploads/pdf/large.pdf?token=tok_1",
          token: "tok_1",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const postReq = new NextRequest("http://localhost:3000/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-signed-url",
        folder: "pdf",
        fileName: "large-thesis.pdf",
        fileSize: 14 * 1024 * 1024,
        mimeType: "application/pdf",
      }),
    });

    const postRes = await storageUploadPost(postReq);
    expect(postRes.status).toBe(200);
    const postBody = (await postRes.json()) as {
      provider: string;
      signedUrl: string;
      path: string;
    };
    expect(postBody.provider).toBe("supabase");
    expect(postBody.signedUrl).toContain("token=tok_1");
    expect(postBody.path).toMatch(/^uploads\/pdf\/.*large-thesis\.pdf$/);
  });

  it("rejects files over 50 MB and dangerous extensions at the signed URL handshake", async () => {
    process.env.SUPABASE_URL = "https://demo.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_service_role_secret";

    const oversizedReq = new NextRequest("http://localhost:3000/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-signed-url",
        folder: "pdf",
        fileName: "huge.pdf",
        fileSize: 60 * 1024 * 1024,
        mimeType: "application/pdf",
      }),
    });
    const oversizedRes = await storageUploadPost(oversizedReq);
    expect(oversizedRes.status).toBe(400);

    const dangerousReq = new NextRequest("http://localhost:3000/api/storage/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-signed-url",
        folder: "samples",
        fileName: "payload.php",
        fileSize: 1024,
        mimeType: "application/x-httpd-php",
      }),
    });
    const dangerousRes = await storageUploadPost(dangerousReq);
    expect(dangerousRes.status).toBe(400);
  });
});
