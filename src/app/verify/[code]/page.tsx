import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  GraduationCap,
  Calendar,
  Building2,
  User,
  Hash,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { verifyDocumentByCode } from "@/lib/academic-docx-exporter";

export const dynamic = "force-dynamic";

interface VerifyPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ d?: string }>;
}

export default async function VerifyDocumentPage({ params, searchParams }: VerifyPageProps) {
  const { code } = await params;
  const resolvedSearch = await searchParams;
  const compactParam = resolvedSearch?.d ?? null;

  const verification = await verifyDocumentByCode(code, compactParam);
  const doc = verification.payload;

  const formattedDate = doc?.issuedAt
    ? new Date(doc.issuedAt).toLocaleString("uz-UZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Noma'lum";

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/academic"
            className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-2 text-xs font-semibold transition-colors sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>DocNova Talabalar moduliga qaytish</span>
          </Link>
          <span className="border-border bg-surface text-foreground-muted rounded-full border px-3 py-1 font-mono text-xs">
            ID: {decodeURIComponent(code)}
          </span>
        </div>

        {verification.verified && doc ? (
          <div className="border-border bg-surface overflow-hidden rounded-3xl border shadow-2xl">
            {/* Official Verified Header Banner */}
            <div className="border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-sky-500/10 p-6 sm:p-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="h-9 w-9" />
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>HAQIQIY HUJJAT • TASDIQLANGAN</span>
                  </div>
                  <h1 className="text-foreground text-xl font-extrabold sm:text-2xl">
                    DocNova AI Akademik Sertifikati
                  </h1>
                  <p className="text-foreground-secondary mt-1 text-xs sm:text-sm">
                    Ushbu hujjat DocNova AI intellektual akademik platformasi orqali O&apos;zbekiston
                    OTM va GOST standartlariga muvofiq shakllantirilgan.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Metadata Details */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* Topic Box */}
              <div className="border-border bg-surface-elevated/60 rounded-2xl border p-4 sm:p-5">
                <div className="text-foreground-muted mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase">
                  <BookOpen className="h-3.5 w-3.5 text-sky-400" />
                  <span>Tadqiqot / Hujjat mavzusi</span>
                </div>
                <p className="text-foreground text-base leading-snug font-bold sm:text-lg">
                  «{doc.topic}»
                </p>
              </div>

              {/* Grid Attributes */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border-border bg-background/60 rounded-xl border p-4">
                  <div className="text-foreground-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Hujjat turi</span>
                  </div>
                  <p className="text-foreground text-sm font-bold">{doc.workType}</p>
                </div>

                <div className="border-border bg-background/60 rounded-xl border p-4">
                  <div className="text-foreground-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
                    <span>Fan / Yo&apos;nalish</span>
                  </div>
                  <p className="text-foreground text-sm font-bold">{doc.subject}</p>
                </div>

                <div className="border-border bg-background/60 rounded-xl border p-4">
                  <div className="text-foreground-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-purple-400" />
                    <span>Bajaruvchi (Talaba)</span>
                  </div>
                  <p className="text-foreground text-sm font-bold">{doc.studentName}</p>
                </div>

                <div className="border-border bg-background/60 rounded-xl border p-4">
                  <div className="text-foreground-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <Building2 className="h-3.5 w-3.5 text-sky-400" />
                    <span>Ta&apos;lim muassasasi (OTM)</span>
                  </div>
                  <p className="text-foreground text-sm font-bold">{doc.university}</p>
                </div>

                <div className="border-border bg-background/60 rounded-xl border p-4">
                  <div className="text-foreground-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Shakllantirilgan sana</span>
                  </div>
                  <p className="text-foreground text-sm font-bold">{formattedDate}</p>
                </div>

                <div className="border-border bg-background/60 rounded-xl border p-4">
                  <div className="text-foreground-muted mb-1 flex items-center gap-1.5 text-xs font-medium">
                    <Hash className="h-3.5 w-3.5 text-amber-400" />
                    <span>Kriptografik Hash / Hajm</span>
                  </div>
                  <p className="text-foreground font-mono text-xs font-bold sm:text-sm">
                    {doc.contentHash.slice(0, 12).toUpperCase()} • ~{doc.pagesEstimate} bet
                  </p>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="border-border flex flex-col items-center justify-between gap-3 border-t pt-5 text-xs sm:flex-row">
                <div className="text-foreground-secondary flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>
                    Raqamli imzo holati:{" "}
                    <strong className="text-emerald-400">
                      {verification.signatureValid ? "100% Asl (Original)" : "Tasdiqlangan"}
                    </strong>
                  </span>
                </div>
                <span className="text-foreground-muted font-mono text-[11px]">
                  DocNova Verification Engine v2.0
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-border bg-surface rounded-3xl border p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <ShieldAlert className="h-9 w-9" />
            </div>
            <h1 className="text-foreground mb-2 text-xl font-extrabold sm:text-2xl">
              Hujjat topilmadi yoki kod noto&apos;g&apos;ri
            </h1>
            <p className="text-foreground-secondary mx-auto mb-6 max-w-md text-xs sm:text-sm">
              Kiritilgan <strong>{decodeURIComponent(code)}</strong> raqamli verifikatsiya kodi
              bo&apos;yicha ma&apos;lumot topilmadi. QR-kod to&apos;g&apos;ri skanerlanganiga ishonch
              hosil qiling.
            </p>
            <Link
              href="/academic"
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold sm:text-sm"
            >
              <span>Yangi akademik hujjat yaratish</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
