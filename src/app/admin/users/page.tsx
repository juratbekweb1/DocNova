/* eslint-disable @next/next/no-img-element */
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { revalidatePath } from "next/cache";
import { UserRole, SubscriptionTier } from "@prisma/client";
import { Users, Sparkles, CreditCard, Calendar, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user
    .findMany({
      orderBy: { createdAt: "desc" },
      include: {
        accounts: {
          select: {
            provider: true,
          },
        },
        apiLimit: true,
        _count: {
          select: {
            aiusages: true,
          },
        },
      },
    })
    .catch((err: unknown) => {
      console.error("[ADMIN_USERS_LOAD_ERROR]", err instanceof Error ? err.message : err);
      return [];
    });

  // Action: Update user role (USER, ADMIN, SUPER_ADMIN)
  async function updateUserRole(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const roleValue = formData.get("role");
    if (!roleValue || !Object.values(UserRole).includes(roleValue as UserRole)) return;
    const role = roleValue as UserRole;
    await prisma.user.update({ where: { id }, data: { role } });
    revalidatePath("/admin/users");
  }

  // Action: Update user subscription tier (FREE, PRO, PREMIUM)
  async function updateUserPlan(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const planValue = formData.get("plan");
    if (!planValue || !Object.values(SubscriptionTier).includes(planValue as SubscriptionTier))
      return;
    const plan = planValue as SubscriptionTier;

    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id },
      data: {
        plan,
        paymentStatus: plan === SubscriptionTier.FREE ? "NONE" : "PAID",
        subscriptionEndDate: plan === SubscriptionTier.FREE ? null : nextMonth,
      },
    });
    revalidatePath("/admin/users");
  }

  // Action: Grant manual AI generation credits
  async function grantCredits(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const credits = parseInt(formData.get("credits") as string) || 0;

    if (credits !== 0) {
      await prisma.user.update({
        where: { id },
        data: {
          aiUsageCount: {
            decrement: credits, // decrementing usage count increases available balance
          },
        },
      });

      const userApiLimit = await prisma.userApiLimit.findUnique({ where: { userId: id } });
      if (userApiLimit) {
        await prisma.userApiLimit.update({
          where: { userId: id },
          data: { count: { decrement: credits } },
        });
      }
    }
    revalidatePath("/admin/users");
  }

  const totalUsers = users.length;
  const googleUsersCount = users.filter((u) =>
    (u.accounts ?? []).some((a) => a?.provider === "google")
  ).length;
  const paidUsersCount = users.filter(
    (u) => u.plan === SubscriptionTier.PRO || u.plan === SubscriptionTier.PREMIUM
  ).length;
  const totalGenerations = users.reduce((acc, u) => acc + (u.aiUsageCount || 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Foydalanuvchilarni Boshqarish (User Management)
          </h1>
          <p className="text-foreground-secondary mt-1">
            Barcha ro&apos;yxatdan o&apos;tgan foydalanuvchilar, Google OAuth profillari, tariflar
            va AI limitlari.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-500">
          <CheckCircle className="h-3.5 w-3.5" />
          Real vaqt rejimida sinxron
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface border-border rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              Jami Foydalanuvchilar
            </span>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-foreground mt-2 text-2xl font-black">{totalUsers}</div>
          <p className="text-foreground-secondary mt-1 text-xs">
            Barcha ro&apos;yxatdan o&apos;tganlar
          </p>
        </div>

        <div className="bg-surface border-border rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              Google OAuth Foydalanuvchilari
            </span>
            <div className="rounded-xl bg-red-500/10 p-2 text-xs font-bold text-red-500">G</div>
          </div>
          <div className="text-foreground mt-2 text-2xl font-black">{googleUsersCount}</div>
          <p className="text-foreground-secondary mt-1 text-xs">Google hisobi bilan kirganlar</p>
        </div>

        <div className="bg-surface border-border rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              Pullik Obunachilar
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-500">{paidUsersCount}</div>
          <p className="text-foreground-secondary mt-1 text-xs">Pro (39k) & Premium (69k)</p>
        </div>

        <div className="bg-surface border-border rounded-2xl border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground-secondary text-xs font-bold tracking-wider uppercase">
              Jami AI Generatsiyalar
            </span>
            <div className="rounded-xl bg-purple-500/10 p-2 text-purple-500">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-500">{totalGenerations}</div>
          <p className="text-foreground-secondary mt-1 text-xs">Generatsiya qilingan hujjatlar</p>
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-surface border-border shadow-sm">
        <CardHeader className="border-border border-b pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Users className="text-primary h-4 w-4" />
            Foydalanuvchilar Ro&apos;yxati ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-elevated text-foreground-secondary border-border border-b text-xs font-bold tracking-wider uppercase">
                <tr>
                  <th className="px-5 py-3.5">Foydalanuvchi / Profil</th>
                  <th className="px-5 py-3.5">Email va Manba</th>
                  <th className="px-5 py-3.5">Ro&apos;yxat sanasi</th>
                  <th className="px-5 py-3.5">Tarif (Obuna)</th>
                  <th className="px-5 py-3.5">Rol (Huquq)</th>
                  <th className="px-5 py-3.5 text-center">AI Ishlatish</th>
                  <th className="px-5 py-3.5 text-right">Kredit Qo&apos;shish</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-foreground-secondary py-12 text-center">
                      Hozircha ro&apos;yxatdan o&apos;tgan foydalanuvchilar mavjud emas.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isGoogle = (u.accounts ?? []).some((a) => a?.provider === "google");
                    const avatarUrl = u.avatar || u.image;
                    const displayName = u.displayName || u.name || "Foydalanuvchi";

                    return (
                      <tr key={u.id} className="hover:bg-surface-elevated/60 transition-colors">
                        {/* Profile & Avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="border-border h-9 w-9 rounded-full border object-cover shadow-xs"
                              />
                            ) : (
                              <div className="bg-primary/10 text-primary border-primary/20 flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold uppercase">
                                {(displayName.charAt(0) || "?").toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-foreground max-w-[150px] truncate font-semibold">
                                {displayName}
                              </p>
                              {u.username && (
                                <p className="text-foreground-secondary max-w-[150px] truncate text-xs">
                                  @{u.username}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email & Auth Provider */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <p className="text-foreground max-w-[200px] truncate text-xs font-medium">
                              {u.email || "Email kiritilmagan"}
                            </p>
                            <div>
                              {isGoogle ? (
                                <span className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                  <span>Google OAuth</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded border border-slate-500/20 bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  <span>Email / Parol</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Registration Date */}
                        <td className="px-5 py-4">
                          <div className="text-foreground-secondary flex items-center gap-1.5 text-xs whitespace-nowrap">
                            <Calendar className="text-foreground-muted h-3.5 w-3.5" />
                            {new Date(u.createdAt).toLocaleDateString("uz-UZ", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>

                        {/* Subscription Tier Selector */}
                        <td className="px-5 py-4">
                          <form action={updateUserPlan} className="flex items-center">
                            <input type="hidden" name="id" value={u.id} />
                            <AutoSubmitSelect
                              name="plan"
                              defaultValue={u.plan}
                              className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-bold shadow-xs transition-all focus:outline-none ${
                                u.plan === "PREMIUM"
                                  ? "border-purple-500/30 bg-purple-500/10 text-purple-600"
                                  : u.plan === "PRO"
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                                    : "bg-background text-foreground-secondary border-border"
                              }`}
                            >
                              <option value="FREE">FREE (Bepul)</option>
                              <option value="PRO">PRO (39 000 so&apos;m)</option>
                              <option value="PREMIUM">PREMIUM (69 000 so&apos;m)</option>
                            </AutoSubmitSelect>
                          </form>
                        </td>

                        {/* User Role Selector */}
                        <td className="px-5 py-4">
                          <form action={updateUserRole} className="flex items-center">
                            <input type="hidden" name="id" value={u.id} />
                            <AutoSubmitSelect
                              name="role"
                              defaultValue={u.role}
                              className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold shadow-xs transition-all focus:outline-none ${
                                u.role === "SUPER_ADMIN"
                                  ? "border-rose-500/30 bg-rose-500/10 font-bold text-rose-600"
                                  : u.role === "ADMIN"
                                    ? "border-amber-500/30 bg-amber-500/10 font-bold text-amber-600"
                                    : "bg-background text-foreground-secondary border-border"
                              }`}
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                            </AutoSubmitSelect>
                          </form>
                        </td>

                        {/* AI Usage stats */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-foreground text-xs font-bold">
                              {u.aiUsageCount || 0} marta
                            </span>
                            <span className="text-foreground-muted text-[10px]">
                              {u._count?.aiusages || 0} ta so&apos;rov
                            </span>
                          </div>
                        </td>

                        {/* Grant Credits Form */}
                        <td className="px-5 py-4 text-right">
                          <form
                            action={grantCredits}
                            className="flex items-center justify-end gap-1.5"
                          >
                            <input type="hidden" name="id" value={u.id} />
                            <input
                              type="number"
                              name="credits"
                              placeholder="+10"
                              defaultValue="10"
                              className="bg-background border-border focus:ring-primary w-16 rounded-md border px-2 py-1 text-center text-xs font-medium focus:ring-1 focus:outline-none"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              type="submit"
                              className="border-border hover:bg-primary hover:text-primary-foreground h-7 px-2.5 text-xs font-semibold transition-all"
                            >
                              Berish
                            </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
