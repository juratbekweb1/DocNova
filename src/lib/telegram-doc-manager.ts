import { prisma } from "@/lib/prisma";
import { DocumentType, DocumentStatus, Prisma } from "@prisma/client";

export type SectionKey =
  "titul" | "mundarija" | "kirish" | "bob1" | "bob2" | "bob3" | "xulosa" | "adabiyot";

export interface ParsedSection {
  key: SectionKey;
  label: string;
  startIndex: number;
  endIndex: number;
  content: string;
}

export interface AcademicDocSnapshot {
  markdown: string;
  topic: string;
  workType: string;
  subject?: string;
  fileName: string;
  version: number;
  timestamp: number;
}

/**
 * Parses markdown into academic sections based on headings (MOVSO / GOST standards)
 */
export function parseDocumentSections(markdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  if (!markdown) return sections;

  const patterns: { key: SectionKey; label: string; regex: RegExp }[] = [
    {
      key: "titul",
      label: "📄 Titul / Muqova varag'i",
      regex: /^(?:#+\s*(?:TITUL|MUQOVA|ТИТУЛ|МУҚОВА))/im,
    },
    {
      key: "mundarija",
      label: "📑 Mundarija / Reja",
      regex: /^(?:#+\s*(?:MUNDARIJA|REJA|МУНДАРИЖА|РЕЖА|ПЛАН|СОДЕРЖАНИЕ))/im,
    },
    {
      key: "kirish",
      label: "🎯 Kirish qismi",
      regex: /^(?:#+\s*(?:KIRISH|КИРИШ|ВВЕДЕНИЕ))/im,
    },
    {
      key: "bob1",
      label: "1️⃣ 1-bob (Nazariy asoslar)",
      regex: /^(?:#+\s*(?:I\s*BOB|1[-.]?\s*BOB|I\s*БОБ|1[-.]?\s*БОБ|ГЛАВА\s*1|РАЗДЕЛ\s*1))/im,
    },
    {
      key: "bob2",
      label: "2️⃣ 2-bob (Amaliy / Tahlil)",
      regex: /^(?:#+\s*(?:II\s*BOB|2[-.]?\s*BOB|II\s*БОБ|2[-.]?\s*БОБ|ГЛАВА\s*2|РАЗДЕЛ\s*2))/im,
    },
    {
      key: "bob3",
      label: "3️⃣ 3-bob (Taklif va tavsiyalar)",
      regex: /^(?:#+\s*(?:III\s*BOB|3[-.]?\s*BOB|III\s*БОБ|3[-.]?\s*БОБ|ГЛАВА\s*3|РАЗДЕЛ\s*3))/im,
    },
    {
      key: "xulosa",
      label: "🏁 Xulosa va tavsiyalar",
      regex: /^(?:#+\s*(?:XULOSA|ХУЛОСА|ЗАКЛЮЧЕНИЕ))/im,
    },
    {
      key: "adabiyot",
      label: "📚 Foydalanilgan adabiyotlar",
      regex:
        /^(?:#+\s*(?:FOYDALANILGAN\s+ADABIYOTLAR|ADABIYOTLAR|АДАБИЁТЛАР|СПИСОК\s+ЛИТЕРАТУРЫ))/im,
    },
  ];

  const lines = markdown.split(/\r?\n/);
  const matches: { key: SectionKey; label: string; lineIndex: number; charIndex: number }[] = [];

  let cumulativeChars = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of patterns) {
      if (pat.regex.test(line)) {
        matches.push({
          key: pat.key,
          label: pat.label,
          lineIndex: i,
          charIndex: cumulativeChars,
        });
        break;
      }
    }
    cumulativeChars += line.length + 1; // +1 for \n
  }

  // Sort matches by position
  matches.sort((a, b) => a.charIndex - b.charIndex);

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.charIndex;
    const endIndex = i + 1 < matches.length ? matches[i + 1].charIndex : markdown.length;
    const content = markdown.slice(startIndex, endIndex).trim();

    sections.push({
      key: current.key,
      label: current.label,
      startIndex,
      endIndex,
      content,
    });
  }

  return sections;
}

/**
 * Replaces a specific parsed section in a markdown string
 */
export function replaceDocumentSection(
  markdown: string,
  sectionKey: SectionKey,
  newSectionContent: string
): string {
  const sections = parseDocumentSections(markdown);
  const target = sections.find((s) => s.key === sectionKey);

  if (!target) {
    // If section wasn't boundary-isolated by regex, append or return updated
    return `${markdown}\n\n${newSectionContent}`;
  }

  const prefix = markdown.slice(0, target.startIndex);
  const suffix = markdown.slice(target.endIndex);

  return `${prefix}${newSectionContent.trim()}\n\n${suffix}`.trim();
}

/**
 * Saves initial academic document into PostgreSQL with version 1
 */
export async function createAcademicDocumentRecord(params: {
  userId: string;
  workType: string;
  topic: string;
  subject?: string;
  markdownContent: string;
  fileName: string;
}): Promise<{ docId: string; version: number }> {
  const safeTopicSlug = params.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const slug = `doc_tg_${safeTopicSlug}_${Date.now()}`;

  const snapshot: AcademicDocSnapshot = {
    markdown: params.markdownContent,
    topic: params.topic,
    workType: params.workType,
    subject: params.subject,
    fileName: params.fileName,
    version: 1,
    timestamp: Date.now(),
  };

  const doc = await prisma.document.create({
    data: {
      userId: params.userId,
      type: DocumentType.REPORT,
      title: params.topic,
      slug,
      status: DocumentStatus.DRAFT,
      metadata: {
        create: [
          { key: "workType", value: params.workType as Prisma.InputJsonValue },
          { key: "subject", value: (params.subject || "") as Prisma.InputJsonValue },
          { key: "fileName", value: params.fileName as Prisma.InputJsonValue },
        ],
      },
      versions: {
        create: {
          version: 1,
          changeLog: "Boshlang'ich generatsiya (v1)",
          createdBy: "DocNova AI Telegram Bot",
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
      },
    },
    select: { id: true },
  });

  return { docId: doc.id, version: 1 };
}

/**
 * Saves a new edited version of an academic document
 */
export async function saveNewDocumentVersion(params: {
  docId: string;
  userId: string;
  markdownContent: string;
  changeLog: string;
  topic?: string;
  subject?: string;
  workType?: string;
  fileName?: string;
}): Promise<{ version: number }> {
  // Multi-tenant check: ensure document belongs to this user
  const doc = await prisma.document.findFirst({
    where: { id: params.docId, userId: params.userId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!doc) {
    throw new Error("Hujjat topilmadi yoki unga ruxsat yo'q.");
  }

  const latestVersion = doc.versions[0]?.version || 1;
  const newVersion = latestVersion + 1;

  const snapshot: AcademicDocSnapshot = {
    markdown: params.markdownContent,
    topic: params.topic || doc.title,
    workType: params.workType || "Academic Document",
    subject: params.subject,
    fileName: params.fileName || `${doc.title}.doc`,
    version: newVersion,
    timestamp: Date.now(),
  };

  await prisma.documentVersion.create({
    data: {
      documentId: params.docId,
      version: newVersion,
      changeLog: params.changeLog,
      createdBy: "DocNova AI Telegram Bot",
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.document.update({
    where: { id: params.docId },
    data: { updatedAt: new Date() },
  });

  return { version: newVersion };
}

/**
 * Retrieves snapshot data for a specific document version
 */
export async function getDocumentVersionData(params: {
  docId: string;
  userId: string;
  version: number;
}): Promise<AcademicDocSnapshot | null> {
  // Multi-tenant check
  const doc = await prisma.document.findFirst({
    where: { id: params.docId, userId: params.userId },
  });

  if (!doc) return null;

  const ver = await prisma.documentVersion.findUnique({
    where: {
      documentId_version: {
        documentId: params.docId,
        version: params.version,
      },
    },
  });

  if (!ver || !ver.snapshot) return null;
  return ver.snapshot as unknown as AcademicDocSnapshot;
}

/**
 * Reverts to previous version
 */
export async function revertToPreviousVersion(params: {
  docId: string;
  userId: string;
  currentVersion: number;
}): Promise<{ snapshot: AcademicDocSnapshot; targetVersion: number } | null> {
  const targetVersion = params.currentVersion - 1;
  if (targetVersion < 1) return null;

  const snapshot = await getDocumentVersionData({
    docId: params.docId,
    userId: params.userId,
    version: targetVersion,
  });

  if (!snapshot) return null;
  return { snapshot, targetVersion };
}

/**
 * Marks academic document as finalized/accepted
 */
export async function finalizeAcademicDocument(docId: string, userId: string): Promise<boolean> {
  const doc = await prisma.document.findFirst({
    where: { id: docId, userId },
  });

  if (!doc) return false;

  await prisma.document.update({
    where: { id: docId },
    data: { status: DocumentStatus.PUBLISHED },
  });

  return true;
}

/**
 * Lists all available versions for a document
 */
export async function listDocumentVersions(docId: string, userId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: docId, userId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        select: {
          version: true,
          changeLog: true,
          createdAt: true,
        },
      },
    },
  });

  if (!doc) return [];
  return doc.versions;
}
