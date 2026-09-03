import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminResumesPage() {
  const documents = await prisma.document.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground text-3xl font-bold tracking-tight">Documents</h2>
        <p className="text-foreground-secondary">Review documents created by users.</p>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-elevated text-foreground-secondary text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr
                    key={document.id}
                    className="border-border hover:bg-surface-elevated/50 border-b"
                  >
                    <td className="px-4 py-4 font-medium">{document.title}</td>
                    <td className="text-foreground-secondary px-4 py-4">
                      {document.user.name || document.user.email || "Unknown"}
                    </td>
                    <td className="px-4 py-4">{document.type.replace("_", " ")}</td>
                    <td className="px-4 py-4">{document.status}</td>
                    <td className="text-foreground-secondary px-4 py-4">
                      {document.updatedAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-foreground-muted px-4 py-8 text-center">
                      No documents found.
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
