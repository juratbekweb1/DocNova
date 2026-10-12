import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";
import { redirect } from "next/navigation";
import { getDocuments } from "@/actions/document-actions";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user) {
    redirect("/login");
  }

  const documents = await getDocuments();

  return <DocumentsClient documents={documents} />;
}
