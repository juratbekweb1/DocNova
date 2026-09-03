import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export default async function AdminPricingPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { priceMonthly: "asc" },
  });

  async function updatePlan(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const priceMonthly = parseFloat(formData.get("priceMonthly") as string) || 0;
    const priceYearly = parseFloat(formData.get("priceYearly") as string) || 0;
    const aiDailyLimit = parseInt(formData.get("aiDailyLimit") as string) || 0;

    await prisma.plan.update({
      where: { id },
      data: {
        priceMonthly,
        priceYearly,
        aiDailyLimit,
      },
    });

    revalidatePath("/admin/pricing");
    revalidatePath("/pricing"); // Revalidate public pricing page
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Pricing Engine</h2>
        <p className="text-foreground-secondary">
          Manage subscription tiers, limits, and prices dynamically.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="bg-surface border-border flex flex-col">
            <CardHeader>
              <CardTitle className="text-xl capitalize">{plan.name} Plan</CardTitle>
            </CardHeader>
            <form action={updatePlan} className="flex flex-1 flex-col">
              <CardContent className="flex-1 space-y-4">
                <input type="hidden" name="id" value={plan.id} />

                <div>
                  <label className="text-foreground text-sm font-medium">Monthly Price (UZS)</label>
                  <input
                    name="priceMonthly"
                    type="number"
                    defaultValue={plan.priceMonthly || 0}
                    className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-foreground text-sm font-medium">Yearly Price (UZS)</label>
                  <input
                    name="priceYearly"
                    type="number"
                    defaultValue={plan.priceYearly || 0}
                    className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-foreground text-sm font-medium">AI Daily Limit</label>
                  <input
                    name="aiDailyLimit"
                    type="number"
                    defaultValue={plan.aiDailyLimit || 0}
                    className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  />
                  <p className="text-foreground-muted mt-1 text-xs">
                    Set to 0 for unlimited or strictly enforced otherwise.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-border border-t pt-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90 w-full">
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
