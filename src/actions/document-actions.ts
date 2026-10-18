"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { revalidatePath } from "next/cache";
import { DocumentType, DocumentStatus, Prisma } from "@prisma/client";

export async function getDocuments() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const docs = await prisma.document.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  return docs;
}

export async function createDocument(type: DocumentType, title: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

  let initialSections = [];

  if (type === "RESUME" || type === "CV") {
    initialSections = [
      {
        type: "PERSONAL_INFO",
        title: "Personal Details",
        content: {} as Prisma.InputJsonValue,
        sortOrder: 0,
      },
      {
        type: "SUMMARY",
        title: "Professional Summary",
        content: {} as Prisma.InputJsonValue,
        sortOrder: 1,
      },
      {
        type: "EXPERIENCE",
        title: "Work Experience",
        content: { items: [] } as Prisma.InputJsonValue,
        sortOrder: 2,
      },
      {
        type: "EDUCATION",
        title: "Education",
        content: { items: [] } as Prisma.InputJsonValue,
        sortOrder: 3,
      },
      {
        type: "SKILLS",
        title: "Skills",
        content: { items: [] } as Prisma.InputJsonValue,
        sortOrder: 4,
      },
    ];
  } else {
    initialSections = [
      {
        type: "CONTENT",
        title: "Document Content",
        content: { text: "" } as Prisma.InputJsonValue,
        sortOrder: 0,
      },
    ];
  }

  const doc = await prisma.document.create({
    data: {
      userId: session.user.id,
      type,
      title,
      slug,
      status: DocumentStatus.DRAFT,
      sections: {
        create: initialSections,
      },
    },
  });

  revalidatePath("/dashboard/documents");
  return doc.id;
}

export async function getDocumentForEditor(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!doc) throw new Error("Document not found");
  if (doc.userId !== session.user.id) throw new Error("Unauthorized access to document");

  return doc;
}

export async function updateDocumentTitle(id: string, title: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.userId !== session.user.id) throw new Error("Unauthorized");

  await prisma.document.update({
    where: { id },
    data: { title },
  });

  revalidatePath(`/dashboard/editor/${id}`);
}

export async function updateSection(sectionId: string, content: Prisma.InputJsonValue) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const section = await prisma.documentSection.findUnique({
    where: { id: sectionId },
    include: { document: true },
  });

  if (!section || section.document.userId !== session.user.id) throw new Error("Unauthorized");

  await prisma.documentSection.update({
    where: { id: sectionId },
    data: { content },
  });
}
