import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PasswordResetService } from "@/core/auth/password-reset-service";
import { PrismaPasswordResetRepository } from "@/core/auth/prisma-password-reset-repository";

const passwordResetService = new PasswordResetService(new PrismaPasswordResetRepository());

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/0 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-transparent" />

      {/* Animated background orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="premium-card rounded-2xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl">
          <ForgotPasswordForm
            onSubmit={async (data) => {
              await passwordResetService.requestReset(data.email);
            }}
            onBackToLogin={() => {
              // handled by link in footer
            }}
          />
        </div>
      </div>
    </div>
  );
}
