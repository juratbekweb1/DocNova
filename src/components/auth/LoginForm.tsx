"use client";

import { AuthCard } from "./AuthCard";
import { KeyRound, Smartphone } from "lucide-react";

type LoginFormProps = {
  onOAuthProviderClick?: (provider: string) => void;
  // Kept for signature compatibility but unused
  onLogin?: any;
  onForgotPassword?: any;
};

export function LoginForm({ onOAuthProviderClick }: LoginFormProps) {
  return (
    <AuthCard>
      <div className="flex flex-col items-center justify-center text-center pb-6">
        <div className="mb-6 relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Smartphone className="h-10 w-10 text-primary" />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-400 animate-pulse" />
          <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Войти в свой аккаунт</h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          Через Telegram — SMS не нужен, 30 секунд.
        </p>
      </div>

      <div className="mb-6 rounded-2xl bg-surface p-5 border border-border shadow-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </div>
            <p className="text-sm font-medium text-foreground">
              Откройте бота в Telegram
              <span className="block text-xs font-normal text-foreground-secondary mt-0.5">@docnova_official_bot</span>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </div>
            <p className="text-sm font-medium text-foreground">Бот отправит вам 6-значный код и ссылку</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </div>
            <p className="text-sm font-medium text-foreground">Нажмите на ссылку — или введите код здесь</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => window.open("https://t.me/docnova_official_bot?start=login", "_blank")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2AABEE] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#229ED9] shadow-lg shadow-[#2AABEE]/20 hover:-translate-y-0.5"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.411-.168.56-.505 1.24-.857 1.24-.341 0-.749-.311-1.229-.624l-3.32-2.19c-.439-.289-.92-.686-.06-1.52.215-.208 2.05-1.92 2.148-2.079.13-.217-.035-.195-.198-.088l-3.155 2.12c-.442.296-.856.44-1.296.43-.44-.01-1.045-.178-1.554-.343-.51-.166-1.125-.333-1.125-.76 0-.256.248-.567.564-.812 2.657-1.446 5.86-3.23 7.822-4.148 2.457-1.147 3.322-1.326 3.79-1.326.467 0 .848.165.98.508.131.341.05.908-.148 1.48z"/></svg>
          Войти через Telegram
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-foreground-secondary">
            <span className="bg-surface px-2">или</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOAuthProviderClick && onOAuthProviderClick("google")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-surface-elevated hover:border-foreground/20 hover:-translate-y-0.5"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Войти через Google
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground-secondary transition-colors hover:text-foreground"
        >
          <KeyRound className="h-4 w-4" />
          Войти по коду учебного центра
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-foreground-secondary/70">
        Продолжая, вы соглашаетесь с условиями использования.
      </p>
    </AuthCard>
  );
}
