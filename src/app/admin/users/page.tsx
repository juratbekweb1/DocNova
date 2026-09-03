import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { apiLimit: true },
  });

  async function updateUserRole(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const roleValue = formData.get("role");
    if (!roleValue || !Object.values(UserRole).includes(roleValue as UserRole)) return;
    const role = roleValue as UserRole;
    await prisma.user.update({ where: { id }, data: { role } });
    revalidatePath("/admin/users");
  }

  async function grantCredits(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const credits = parseInt(formData.get("credits") as string) || 0;

    const userApiLimit = await prisma.userApiLimit.findUnique({ where: { userId: id } });
    if (userApiLimit) {
      await prisma.userApiLimit.update({
        where: { userId: id },
        data: { count: { decrement: credits } }, // Decrementing count gives them more generations if limit is based on count > max
      });
    }
    revalidatePath("/admin/users");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">User Management</h2>
        <p className="text-foreground-secondary">
          Manage users, roles, and grant manual AI credits.
        </p>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-foreground-secondary bg-surface-elevated text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">AI Executions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-border hover:bg-surface-elevated/50 border-b">
                    <td className="px-4 py-4 font-medium">{u.name || "N/A"}</td>
                    <td className="text-foreground-secondary px-4 py-4">{u.email}</td>
                    <td className="px-4 py-4">
                      <form action={updateUserRole} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="bg-background border-border rounded border px-2 py-1 text-xs focus:outline-none"
                          onChange={(e) => e.target.form?.requestSubmit()}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </form>
                    </td>
                    <td className="px-4 py-4">{u.apiLimit?.count || 0}</td>
                    <td className="px-4 py-4 text-right">
                      <form action={grantCredits} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="number"
                          name="credits"
                          placeholder="Credits"
                          className="bg-background border-border w-20 rounded border px-2 py-1 text-xs focus:outline-none"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          type="submit"
                          className="border-border h-7 text-xs"
                        >
                          Grant
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
