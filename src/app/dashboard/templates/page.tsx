import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { Filter, Eye, CheckCircle2, Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/billing/subscription";
import type { Template } from "@prisma/client";

type TemplateCard = Pick<
  Template,
  | "id"
  | "name"
  | "category"
  | "isPremium"
  | "premiumOnly"
  | "slug"
  | "thumbnailUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;

export default async function TemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(session.user.id);
  const isPremiumPlan = subscription.isPremium && subscription.planSlug === "premium";

  let dbTemplates: TemplateCard[] = await prisma.template.findMany({
    where: {
      isActive: true,
      // If not premium, exclude premiumOnly templates
      ...(!isPremiumPlan ? { premiumOnly: false } : {}),
    },
  });

  // Fallback to static templates if DB is empty, but still filter them conceptually
  if (dbTemplates.length === 0) {
    dbTemplates = [
      {
        id: "1",
        name: "Executive Pro",
        category: "Professional",
        isPremium: true,
        premiumOnly: false,
        slug: "exec",
        thumbnailUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Minimal Tech",
        category: "Modern",
        isPremium: false,
        premiumOnly: false,
        slug: "min",
        thumbnailUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Creative Studio",
        category: "Creative",
        isPremium: true,
        premiumOnly: true,
        slug: "creative",
        thumbnailUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        name: "Standard ATS",
        category: "ATS Friendly",
        isPremium: false,
        premiumOnly: false,
        slug: "ats",
        thumbnailUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "5",
        name: "Modern Finance",
        category: "Professional",
        isPremium: true,
        premiumOnly: false,
        slug: "fin",
        thumbnailUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "6",
        name: "Premium Exclusive",
        category: "Minimal",
        isPremium: true,
        premiumOnly: true,
        slug: "prem-excl",
        thumbnailUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ].filter((t) => isPremiumPlan || !t.premiumOnly);
  }

  const templates = dbTemplates.map((t) => ({
    ...t,
    ats: "99%", // Fake ATS score for UI
  }));

  const categories = ["All", "Professional", "Modern", "Minimal", "Creative", "ATS Friendly"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto w-full max-w-7xl flex-1 p-6 duration-500 md:p-8 lg:p-12">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-3">
          <h2 className="text-foreground text-3xl font-extrabold tracking-tight sm:text-4xl">
            Template Gallery
          </h2>
          <p className="text-foreground-secondary max-w-2xl text-lg font-light">
            Start with a professionally designed template optimized for ATS systems and modern
            standards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-border bg-surface text-foreground-secondary hover:bg-surface-elevated hover:text-foreground h-11 rounded-xl px-5 transition-all duration-300"
          >
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      <div className="no-scrollbar mb-8 flex gap-3 overflow-x-auto pb-4">
        {categories.map((cat, i) => (
          <button
            key={i}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5 active:scale-95 ${
              i === 0
                ? "bg-primary text-primary-foreground shadow-primary/20 shadow-md"
                : "bg-surface text-foreground-secondary border-border hover:bg-border/50 hover:text-foreground border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {templates.map((template, i) => (
          <Card
            key={i}
            className="group border-border bg-surface/40 hover:border-primary/40 relative flex flex-col overflow-hidden rounded-[24px] border shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(56,189,248,0.15)]"
          >
            <div className="from-primary/0 to-accent/0 group-hover:from-primary/10 group-hover:to-accent/5 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent transition-colors duration-500" />

            <div className="from-surface-elevated/80 to-background relative flex aspect-[1/1.4] w-full items-center justify-center overflow-hidden bg-gradient-to-b p-6">
              <div className="pointer-events-none absolute inset-0 bg-[url(/grid.svg)] opacity-[0.03]" />

              {/* Refined document preview */}
              <div className="flex h-[95%] w-[85%] flex-col overflow-hidden rounded-xl border border-slate-200/50 bg-[#FDFDFD] shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-[1.03]">
                {template.category === "Creative" ? (
                  <div className="flex h-full">
                    <div className="h-full w-1/3 border-r border-slate-100 bg-slate-50 p-2">
                      <div className="mx-auto mb-4 h-8 w-8 rounded-full bg-slate-200" />
                      <div className="mb-2 h-1.5 w-full rounded bg-slate-200/60" />
                      <div className="h-1.5 w-full rounded bg-slate-200/60" />
                    </div>
                    <div className="flex w-2/3 flex-col gap-3 p-4">
                      <div className="h-3 w-1/2 rounded bg-slate-700" />
                      <div className="h-1.5 w-full rounded bg-slate-200" />
                      <div className="h-1.5 w-4/5 rounded bg-slate-200" />
                      <div className="mt-auto h-12 rounded border border-slate-200/60" />
                    </div>
                  </div>
                ) : template.category === "Minimal" ? (
                  <div className="flex h-full flex-col gap-4 p-5">
                    <div className="mx-auto mb-2 h-3 w-1/3 rounded bg-slate-700" />
                    <div className="h-1.5 w-full rounded bg-slate-200" />
                    <div className="mx-auto h-1.5 w-3/4 rounded bg-slate-200" />
                    <div className="my-2 h-[1px] w-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-1.5 w-full rounded bg-slate-100" />
                      <div className="h-1.5 w-full rounded bg-slate-100" />
                      <div className="h-1.5 w-2/3 rounded bg-slate-100" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col gap-3 p-4">
                    <div className="mb-2 border-b-2 border-slate-700 pb-2">
                      <div className="mb-2 h-4 w-1/2 rounded bg-slate-700" />
                      <div className="flex gap-2">
                        <div className="h-1.5 w-1/4 rounded bg-slate-300" />
                        <div className="h-1.5 w-1/4 rounded bg-slate-300" />
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-1/4 rounded bg-slate-700" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-slate-200" />
                      <div className="h-1.5 w-full rounded bg-slate-200" />
                      <div className="h-1.5 w-5/6 rounded bg-slate-200" />
                    </div>
                    <div className="mt-4 h-2 w-1/4 rounded bg-slate-700" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded bg-slate-200" />
                      <div className="h-1.5 w-3/4 rounded bg-slate-200" />
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                {template.isPremium && (
                  <span className="from-primary to-accent text-primary-foreground border-primary/30 flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-3 py-1 text-[10px] font-bold tracking-wider uppercase shadow-lg">
                    <Star className="fill-primary-foreground h-3 w-3" /> Premium
                  </span>
                )}
                <span className="bg-surface/80 flex items-center gap-1.5 rounded-full border border-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase shadow-lg backdrop-blur-md">
                  <CheckCircle2 className="h-3 w-3" /> ATS {template.ats}
                </span>
              </div>

              <div className="bg-background/80 absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 opacity-0 backdrop-blur-[4px] transition-all duration-300 group-hover:opacity-100">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 font-bold shadow-[0_0_30px_-5px_rgba(56,189,248,0.4)] transition-transform hover:scale-105">
                  Use Template
                </Button>
                <Button
                  variant="outline"
                  className="bg-surface/50 border-border text-foreground hover:bg-border/50 h-10 rounded-full px-8 backdrop-blur-md transition-transform hover:scale-105"
                >
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
              </div>
            </div>
            <div className="border-border bg-surface/50 relative z-10 border-t p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-foreground mb-1 text-lg font-bold">{template.name}</h3>
                  <p className="text-foreground-secondary text-sm font-medium">
                    {template.category}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
