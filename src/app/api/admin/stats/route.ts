import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Type assertion for session
type Session = {
  user?: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  };
};

export async function GET() {
  try {
    const session = (await getServerSession(auth)) as Session;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch admin stats
    const [totalUsers, totalResumes, activeUsers, premiumUsers, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.user.count({
        where: {
          sessions: {
            some: {
              expires: {
                gt: new Date(),
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          organizations: {
            some: {
              organization: {
                subscriptions: {
                  some: {
                    status: "active",
                  },
                },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    const formattedRecentUsers = recentUsers.map(
      (user: { id: string; name: string | null; email: string | null; createdAt: Date }) => ({
        id: user.id,
        name: user.name || "Unknown",
        email: user.email || "No email",
        createdAt: formatTimeAgo(user.createdAt),
      })
    );

    return NextResponse.json({
      stats: {
        totalUsers,
        totalResumes,
        activeUsers,
        premiumUsers,
      },
      recentUsers: formattedRecentUsers,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
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
