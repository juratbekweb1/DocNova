"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [_error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return { error: result.error };
      }

      router.push("/?auth=success");
      router.refresh();
      return {};
    } catch (_error) {
      setError("Something went wrong. Please try again.");
      return { error: "Something went wrong. Please try again." };
    }
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  const handleOAuthProviderClick = (provider: string) => {
    signIn(provider, { callbackUrl: "/?auth=success" });
  };

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center px-4 py-12">
      {/* Animated orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />
      <div className="auth-orb auth-orb-4" />

      {/* Sparkling particles */}
      <div className="auth-particle auth-particle-1" />
      <div className="auth-particle auth-particle-2" />
      <div className="auth-particle auth-particle-3" />
      <div className="auth-particle auth-particle-4" />
      <div className="auth-particle auth-particle-5" />

      <div className="relative z-10 w-full max-w-md">
        <LoginForm
          onLogin={handleLogin}
          onForgotPassword={handleForgotPassword}
          onOAuthProviderClick={handleOAuthProviderClick}
        />
      </div>
    </div>
  );
}
