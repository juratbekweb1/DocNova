import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// Type assertion for session
type Session = {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
};

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's organization IDs
    const _organizationIds = user.organizations.map((org) => org.organizationId);

    // Fetch user-specific document stats
    const [totalResumes, drafts, published] = await Promise.all([
      prisma.document.count({
        where: { userId: session.user.id },
      }),
      prisma.document.count({
        where: { userId: session.user.id, status: "DRAFT" },
      }),
      prisma.document.count({
        where: { userId: session.user.id, status: "PUBLISHED" },
      }),
    ]);

    // Fetch recent documents for this user
    const recentResumes = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
    });

    const formattedResumes = recentResumes.map(
      (doc: { id: string; title: string; updatedAt: Date; status: string }) => ({
        id: doc.id,
        title: doc.title || "Untitled Document",
        updated: formatTimeAgo(doc.updatedAt),
        status: doc.status.toLowerCase(),
      })
    );

    return NextResponse.json({
      stats: {
        totalResumes,
        drafts,
        published,
      },
      recentResumes: formattedResumes,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Hozir";
  if (hours < 24) return `${hours} soat oldin`;
  if (days < 7) return `${days} kun oldin`;
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`;
  return `${Math.floor(days / 30)} oy oldin`;
}
