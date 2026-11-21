"use client";

import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordClient({ token }: { token: string }) {
  const handleReset = async (data: { password: string }) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: data.password }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: json.error || "Parolni yangilashda xatolik yuz berdi." };
    }
    return {};
  };

  return <ResetPasswordForm onSubmit={handleReset} />;
}
