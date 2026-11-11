import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { DocumentStatus, DocumentType, Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { buildDocumentSlug, saveAcademicTopicsSchema } from "@/lib/academic/topic-parser";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        error: "Mavzularni bazaga saqlash uchun iltimos avval tizimga kiring.",
        requireLogin: true,
      },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "So'rov tanasi yaroqli JSON formatida emas" },
      { status: 400 }
    );
  }

  const parsed = saveAcademicTopicsSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Saqlash ma'lumotlari noto'g'ri";
    return NextResponse.json({ error: firstIssue }, { status: 400 });
  }

  const {
    topics,
    documentTitle,
    sourceFileName,
    pagesPerTopic,
    workType = "general",
  } = parsed.data;

  const resolvedTitle =
    documentTitle?.trim() ||
    (topics.length === 1
      ? topics[0].title
      : `${topics[0].title} va yana ${topics.length - 1} ta mavzu`);

  const tags = Array.from(
    new Set(["academic", "image-topics", workType].filter((tag) => Boolean(tag && tag.trim())))
  );

  try {
    const created = await prisma.document.create({
      data: {
        userId,
        type: DocumentType.REPORT,
        title: resolvedTitle.slice(0, 200),
        slug: buildDocumentSlug(resolvedTitle),
        status: DocumentStatus.DRAFT,
        tags,
        sections: {
          create: topics.map((topic, index) => ({
            type: "CONTENT",
            title: topic.title,
            content: {
              text: topic.content,
              ...(topic.pageCount ? { pageCount: topic.pageCount } : {}),
            } as Prisma.InputJsonValue,
            sortOrder: index,
            isVisible: true,
          })),
        },
        metadata: {
          create: {
            key: "academicImageTopics",
            value: {
              source: "parse-topics",
              workType,
              sourceFileName: sourceFileName ?? null,
              topicCount: topics.length,
              ...(pagesPerTopic ? { pagesPerTopic } : {}),
              savedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        _count: {
          select: {
            sections: true,
          },
        },
      },
    });

    try {
      revalidatePath("/dashboard/documents");
    } catch {
      // Safe no-op outside Next.js request store (e.g. unit tests)
    }

    return NextResponse.json(
      {
        success: true,
        documentId: created.id,
        title: created.title,
        slug: created.slug,
        sectionCount: created._count?.sections ?? topics.length,
        editorUrl: `/dashboard/editor/${created.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SAVE_ACADEMIC_TOPICS_ERROR]", error);
    return NextResponse.json(
      {
        error: "Mavzularni ma'lumotlar bazasiga saqlashda xatolik yuz berdi. Qayta urinib ko'ring.",
      },
      { status: 500 }
    );
  }
}
