"use client";

import React from "react";
import Link from "next/link";
import { FileText, Plus, MoreVertical, Edit, Download, Trash2 } from "lucide-react";
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            {t.documentsTitle || "Hujjatlar"}
          </h1>
          <p className="text-foreground-secondary mt-1">
            {t.documentsDesc || "Rezyumelar, arizalar va barcha hujjatlaringizni boshqaring."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/documents/new"
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            {t.topbarNewDoc || "Yangi hujjat"}
          </Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="border-border bg-surface rounded-2xl border p-12 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-foreground mb-2 text-lg font-bold">
            {t.noDocsTitle || "Hali hujjatlaringiz yo'q"}
          </h3>
          <p className="text-foreground-secondary mx-auto mb-6 max-w-sm text-sm">
            {t.noDocsDesc ||
              "AI yordamida birinchi professional hujjatingizni bir necha daqiqada yarating."}
          </p>
          <Link
            href="/dashboard/documents/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all"
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
              className="group border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated relative flex flex-col rounded-2xl border p-6 transition-all"
            >
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-foreground-secondary hover:text-foreground h-8 w-8"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-border bg-surface-elevated text-foreground w-48"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/editor/${doc.id}`}
                        className="flex cursor-pointer items-center"
                      >
                        <Edit className="mr-2 h-4 w-4" />{" "}
                        {lang === "ru" ? "Редактировать" : "Tahrirlash"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex cursor-pointer items-center">
                      <Download className="mr-2 h-4 w-4" />{" "}
                      {lang === "ru" ? "Скачать PDF" : "PDF yuklash"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-error focus:bg-error/10 focus:text-error flex cursor-pointer items-center">
                      <Trash2 className="mr-2 h-4 w-4" /> {lang === "ru" ? "Удалить" : "O'chirish"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/dashboard/editor/${doc.id}`} className="block flex flex-1 flex-col">
                <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
                  {doc.title}
                </h3>
                <div className="text-foreground-secondary mt-2 flex items-center gap-2 text-xs">
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
