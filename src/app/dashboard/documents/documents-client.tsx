"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Copy,
  Download,
  Trash2,
  Share2,
} from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Document } from "@prisma/client";

export function DocumentsClient({ documents }: { documents: Document[] }) {
  const { t, lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t.documentsTitle || "Hujjatlar"}
          </h1>
          <p className="text-foreground-secondary mt-1">
            {t.documentsDesc || "Rezyumelar, arizalar va barcha hujjatlaringizni boshqaring."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/documents/new"
            className="flex items-center gap-2 rounded-full bg-primary hover:bg-primary/90 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            {t.topbarNewDoc || "Yangi hujjat"}
          </Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            {t.noDocsTitle || "Hali hujjatlaringiz yo'q"}
          </h3>
          <p className="text-sm text-foreground-secondary max-w-sm mx-auto mb-6">
            {t.noDocsDesc || "AI yordamida birinchi professional hujjatingizni bir necha daqiqada yarating."}
          </p>
          <Link
            href="/dashboard/documents/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            {t.createNewDoc || "Yangi hujjat yaratish"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:bg-surface-elevated"
            >
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-foreground-secondary hover:text-foreground"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 border-border bg-surface-elevated text-foreground"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/editor/${doc.id}`}
                        className="flex cursor-pointer items-center"
                      >
                        <Edit className="mr-2 h-4 w-4" /> {lang === "ru" ? "Редактировать" : "Tahrirlash"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex cursor-pointer items-center">
                      <Download className="mr-2 h-4 w-4" /> {lang === "ru" ? "Скачать PDF" : "PDF yuklash"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex cursor-pointer items-center text-error focus:bg-error/10 focus:text-error">
                      <Trash2 className="mr-2 h-4 w-4" /> {lang === "ru" ? "Удалить" : "O'chirish"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/dashboard/editor/${doc.id}`} className="block flex flex-1 flex-col">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {doc.title}
                </h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-foreground-secondary">
                  <span className="capitalize">{doc.type.replace("_", " ").toLowerCase()}</span>
                  <span>•</span>
                  <span>{doc.status}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
