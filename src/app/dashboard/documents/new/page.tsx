import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { NewDocumentFlow } from "@/components/dashboard/new-document-flow";

export default async function NewDocumentPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <NewDocumentFlow />;
}
