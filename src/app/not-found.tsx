"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, LayoutDashboard, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { status } = useSession();
  const router = useRouter();

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 rounded-full bg-primary/10 p-6">
        <h1 className="text-6xl font-extrabold text-primary sm:text-7xl">404</h1>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-foreground sm:text-3xl">Sahifa topilmadi</h2>
      <p className="mb-8 max-w-md text-sm text-foreground-secondary sm:text-base">
        Siz qidirayotgan sahifa mavjud emas, ko&apos;chirilgan yoki manzili o&apos;zgargan bo&apos;lishi mumkin.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === "authenticated" && (
          <Link href="/dashboard">
            <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
              <LayoutDashboard className="h-4 w-4" />
              Boshqaruv paneli
            </button>
          </Link>
        )}
        <Link href="/">
          <button className="flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-surface-elevated">
            <Home className="h-4 w-4 text-primary" />
            Bosh sahifa
          </button>
        </Link>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-xl border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </button>
      </div>
    </div>
  );
}

