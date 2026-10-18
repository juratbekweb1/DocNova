import { prisma } from "@/lib/prisma";

const MAX_FREE_PDF_COUNTS = 5;

export const checkPdfLimit = async (userId: string) => {
  if (!userId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && (user.role === "SUPER_ADMIN" || user.role === "ADMIN")) {
    return true;
  }

  const userApiLimit = await prisma.userApiLimit.findUnique({
    where: {
      userId: userId,
    },
  });

  if (!userApiLimit || userApiLimit.pdfCount < MAX_FREE_PDF_COUNTS) {
    return true;
  } else {
    return false;
  }
};

export const increasePdfLimit = async (userId: string) => {
  if (!userId) {
    return;
  }

  const userApiLimit = await prisma.userApiLimit.findUnique({
    where: {
      userId: userId,
    },
  });

  if (userApiLimit) {
    await prisma.userApiLimit.update({
      where: { userId: userId },
      data: { pdfCount: userApiLimit.pdfCount + 1 },
    });
  } else {
    await prisma.userApiLimit.create({
      data: { userId: userId, pdfCount: 1 },
    });
  }
};
