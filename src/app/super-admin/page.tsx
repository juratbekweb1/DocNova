import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import {
  ShieldAlert,
  Activity,
  Globe,
  Users,
  CreditCard,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const [totalUsers, paidUsers, totalAiusages, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { plan: { in: ["PRO", "PREMIUM"] } },
    }),
    prisma.aIUsage.count(),
    prisma.securityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div className="animate-in fade-in mx-auto max-w-7xl space-y-8 p-6 duration-500 md:p-8">
      <div>
        <h1 className="text-foreground mb-1 text-3xl font-extrabold tracking-tight">
          Super Admin Boshqaruv Markazi
        </h1>
        <p className="text-foreground-secondary text-sm">
          Tizim monitoringi, xavfsizlik telemetriyasi, foydalanuvchilar va global sozlamalar.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-surface border-border rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              Jami Foydalanuvchilar
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-foreground mt-2 text-3xl font-black">{totalUsers}</div>
          <div className="mt-3">
            <Link
              href="/admin/users"
              className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-600"
            >
              Foydalanuvchilarni ko&apos;rish <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-surface border-border rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              Pullik Obunachilar
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-500">{paidUsers}</div>
          <div className="mt-3">
            <Link
              href="/admin/pricing"
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Tariflarni boshqarish <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="bg-surface border-border rounded-2xl border p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              AI So&apos;rovlari
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-purple-500">{totalAiusages}</div>
          <div className="mt-3">
            <Link
              href="/admin/ai-analytics"
              className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
            >
              AI tahlillarini ko&apos;rish <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Telemetry & Quick Control */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Security Telemetry */}
        <div className="bg-surface border-border rounded-2xl border p-6 shadow-xs md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-foreground flex items-center gap-2 text-base font-bold">
              <ShieldAlert className="h-5 w-5 text-red-500" /> Xavfsizlik va Rate-Limit
              Telemetriyasi
            </h2>
            <span className="text-foreground-secondary text-xs font-medium">
              So&apos;nggi voqealar
            </span>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-foreground-secondary py-6 text-center text-sm">
                Xavfsizlik voqealari qayd etilmagan (Barchasi tinch).
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-surface-elevated border-border/50 flex items-center justify-between rounded-xl border p-3 text-xs"
                >
                  <div className="min-w-0 space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        {log.eventType}
                      </span>
                      <span className="text-foreground-secondary flex items-center gap-1 text-[11px]">
                        <Globe className="h-3 w-3" /> {log.ipAddress || "127.0.0.1"}
                      </span>
                    </div>
                    <p className="text-foreground-secondary max-w-sm truncate">
                      <span className="text-foreground font-semibold">Marshrut:</span> {log.path}
                    </p>
                  </div>
                  <div className="text-foreground-muted flex shrink-0 items-center gap-1 text-[11px]">
                    <Activity className="h-3 w-3" />
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-surface border-border space-y-4 rounded-2xl border p-6 shadow-xs">
          <h2 className="text-foreground text-base font-bold">Tezkor Boshqaruv</h2>
          <p className="text-foreground-secondary text-xs">
            Administrator panellari va sozlamalariga to&apos;g&apos;ridan-to&apos;g&apos;ri
            o&apos;tish:
          </p>

          <div className="space-y-2.5">
            <Link href="/admin/users" className="block">
              <Button
                variant="outline"
                className="border-border h-10 w-full justify-between text-xs font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" /> Foydalanuvchilar Ro&apos;yxati
                </span>
                <ArrowRight className="text-foreground-muted h-3.5 w-3.5" />
              </Button>
            </Link>

            <Link href="/admin/ai-analytics" className="block">
              <Button
                variant="outline"
                className="border-border h-10 w-full justify-between text-xs font-semibold"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" /> AI Xarajatlari va Tokenlar
                </span>
                <ArrowRight className="text-foreground-muted h-3.5 w-3.5" />
              </Button>
            </Link>

            <Link href="/admin/pricing" className="block">
              <Button
                variant="outline"
                className="border-border h-10 w-full justify-between text-xs font-semibold"
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-500" /> Tariflar va Narxlar
                </span>
                <ArrowRight className="text-foreground-muted h-3.5 w-3.5" />
              </Button>
            </Link>

            <Link href="/admin" className="block">
              <Button
                variant="default"
                className="mt-2 h-10 w-full justify-center text-xs font-bold"
              >
                Asosiy Admin Dashboardga O&apos;tish
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
