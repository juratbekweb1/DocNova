import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getDocuments } from "@/actions/document-actions";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const documents = await getDocuments();

  return <DocumentsClient documents={documents} />;
}
