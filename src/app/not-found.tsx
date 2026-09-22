"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-8 rounded-full bg-primary/10 p-6">
        <h1 className="text-7xl font-extrabold text-primary">404</h1>
      </div>
      <h2 className="mb-4 text-3xl font-bold text-foreground">Sahifa topilmadi</h2>
      <p className="mb-8 max-w-md text-foreground-secondary">
        Siz qidirayotgan sahifa mavjud emas yoki o&apos;chirilgan bo&apos;lishi mumkin.
      </p>
      <Link href="/">
        <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <Home className="h-4 w-4" />
          Bosh sahifaga qaytish
        </button>
      </Link>
    </div>
  );
}
