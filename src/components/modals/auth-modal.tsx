"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Smartphone } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  callbackUrl = "/?auth=success",
  title = "Tizimga kirish",
  description = "DocNova imkoniyatlaridan to'liq foydalanish uchun hisobingizga kiring.",
}: AuthModalProps) {
  const { status } = useSession();
  const router = useRouter();

  // TASK 2: As soon as status becomes "authenticated", automatically close modal and redirect
  useEffect(() => {
    if (status === "authenticated" && isOpen) {
      onClose();
      if (callbackUrl) {
        router.push(callbackUrl);
      }
    }
  }, [status, isOpen, onClose, callbackUrl, router]);

  if (!isOpen) return null;

  const handleOAuth = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md duration-200">
      <div className="border-border bg-surface relative w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-foreground-secondary hover:bg-surface-elevated hover:text-foreground absolute top-4 right-4 cursor-pointer rounded-full p-2 transition-colors"
          aria-label="Yopish"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center pb-5 text-center">
          <div className="bg-primary/10 border-primary/20 relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
            <Smartphone className="text-primary h-8 w-8" />
            <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-blue-400" />
          </div>
          <h2 className="text-foreground text-xl font-extrabold sm:text-2xl">{title}</h2>
          <p className="text-foreground-secondary mt-1.5 max-w-xs text-xs">{description}</p>
        </div>

        {/* Telegram Fast Login Card */}
        <div className="bg-surface-elevated/70 border-border/80 text-foreground-secondary mb-5 space-y-2 rounded-2xl border p-4 text-xs">
          <div className="text-foreground flex items-center gap-2 font-bold">
            <span className="bg-primary text-primary-foreground flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
              ✓
            </span>
            <span>Tezkor va xavfsiz avtorizatsiya</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Parol yoki SMS kod kutish shart emas. Telegram boti yoki Google orqali 1 klikda tizimga
            kiring.
          </p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          {/* Telegram Login */}
          <button
            type="button"
            onClick={() => window.open("https://t.me/docnova_official_bot?start=login", "_blank")}
            className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-[#2AABEE] px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#2AABEE]/25 transition-all hover:-translate-y-0.5 hover:bg-[#229ED9] sm:text-sm"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.411-.168.56-.505 1.24-.857 1.24-.341 0-.749-.311-1.229-.624l-3.32-2.19c-.439-.289-.92-.686-.06-1.52.215-.208 2.05-1.92 2.148-2.079.13-.217-.035-.195-.198-.088l-3.155 2.12c-.442.296-.856.44-1.296.43-.44-.01-1.045-.178-1.554-.343-.51-.166-1.125-.333-1.125-.76 0-.256.248-.567.564-.812 2.657-1.446 5.86-3.23 7.822-4.148 2.457-1.147 3.322-1.326 3.79-1.326.467 0 .848.165.98.508.131.341.05.908-.148 1.48z" />
            </svg>
            <span>Telegram orqali kirish</span>
          </button>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="border-border w-full border-t" />
            </div>
            <div className="text-foreground-muted relative flex justify-center text-[11px]">
              <span className="bg-surface px-2">yoki</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            className="border-border bg-surface-elevated text-foreground hover:bg-surface hover:border-foreground/30 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border px-4 py-3.5 text-xs font-semibold shadow-xs transition-all hover:-translate-y-0.5 sm:text-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google orqali kirish</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-5 text-center">
          <p className="text-foreground-muted text-[11px]">
            Kirish orqali siz platformaning{" "}
            <a href="/privacy" className="hover:text-foreground underline">
              foydalanish shartlariga
            </a>{" "}
            rozilik bildirasiz.
          </p>
        </div>
      </div>
    </div>
  );
}
