import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { PasswordResetService } from "@/core/auth/password-reset-service";
import { PrismaPasswordResetRepository } from "@/core/auth/prisma-password-reset-repository";

const passwordResetService = new PasswordResetService(new PrismaPasswordResetRepository());

export const dynamic = "force-dynamic";

type ResetPasswordPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = await params;
  const verification = await passwordResetService.verifyToken(token);

  if (!verification.valid) {
    return (
      <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/0 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-transparent" />

        <div className="relative z-10 w-full max-w-md">
          <div className="premium-card border-border bg-surface/80 rounded-2xl border p-8 shadow-2xl backdrop-blur-xl">
            <div className="space-y-6 text-center">
              <h1 className="text-2xl font-semibold text-white">Invalid or expired link</h1>
              <p className="text-foreground-secondary text-sm">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <a
                href="/forgot-password"
                className="inline-block rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/60"
              >
                Request new link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/0 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-transparent" />

      {/* Animated background orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="premium-card border-border bg-surface/95 rounded-2xl border p-8 shadow-2xl">
          <ResetPasswordForm
            onSubmit={async (data) => {
              await passwordResetService.resetPassword(token, data.password);
            }}
            onSuccess={() => {
              // handled by success state in form
            }}
          />
        </div>
      </div>
    </div>
  );
}
