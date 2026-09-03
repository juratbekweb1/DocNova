import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { Trash2, Plus } from "lucide-react";

export default async function AdminPromoPage() {
  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  async function createPromo(formData: FormData) {
    "use server";
    const code = formData.get("code") as string;
    const discountType = formData.get("discountType") as string;
    const discountValue = parseFloat(formData.get("discountValue") as string) || 0;
    const usageLimit = parseInt(formData.get("usageLimit") as string) || null;

    if (!code || !discountType || discountValue <= 0) return;

    await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        usageLimit,
      },
    });

    revalidatePath("/admin/promo");
  }

  async function deletePromo(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await prisma.promoCode.delete({ where: { id } });
    revalidatePath("/admin/promo");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Promo Codes</h2>
        <p className="text-foreground-secondary">Generate and manage promotional discounts.</p>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Create New Promo Code</CardTitle>
        </CardHeader>
        <form action={createPromo}>
          <CardContent className="grid items-end gap-4 md:grid-cols-4">
            <div>
              <label className="text-foreground text-sm font-medium">Code String</label>
              <input
                name="code"
                type="text"
                placeholder="e.g. SUMMER50"
                required
                className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium">Discount Type</label>
              <select
                name="discountType"
                className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (UZS)</option>
              </select>
            </div>
            <div>
              <label className="text-foreground text-sm font-medium">Discount Value</label>
              <input
                name="discountValue"
                type="number"
                step="0.01"
                required
                className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-foreground text-sm font-medium">Max Usages (Optional)</label>
              <input
                name="usageLimit"
                type="number"
                placeholder="Leave empty for unlimited"
                className="bg-background border-border focus:border-primary mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" /> Generate Code
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-foreground-secondary bg-surface-elevated text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Usage</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-border hover:bg-surface-elevated/50 border-b">
                    <td className="text-primary px-6 py-4 font-bold">{p.code}</td>
                    <td className="px-6 py-4">{p.discountType}</td>
                    <td className="px-6 py-4">
                      {p.discountValue} {p.discountType === "PERCENTAGE" ? "%" : "UZS"}
                    </td>
                    <td className="px-6 py-4">
                      {p.timesUsed} / {p.usageLimit || "∞"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={deletePromo}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          variant="ghost"
                          size="sm"
                          type="submit"
                          className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-foreground-muted px-6 py-8 text-center">
                      No promo codes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
