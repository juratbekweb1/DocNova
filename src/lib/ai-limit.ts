import { prisma } from "@/lib/prisma";

const MAX_FREE_COUNTS = 3;

import { getUserSubscription } from "@/lib/billing/subscription";

export const checkApiLimit = async (userId: string) => {
  if (!userId) {
    return { allowed: false, limitReached: true, upgradeMessage: "Siz tizimga kirmagansiz." };
  }

  const subscription = await getUserSubscription(userId);
  if (subscription.isPremium && subscription.planSlug === "premium") {
    return { allowed: true, limitReached: false };
  }

  const userApiLimit = await prisma.userApiLimit.findUnique({
    where: {
      userId: userId,
    },
  });

  const count = userApiLimit?.count || 0;

  if (subscription.isPremium && subscription.planSlug === "pro") {
    const MAX_PRO_COUNTS = 25;
    if (count >= MAX_PRO_COUNTS) {
      return {
        allowed: false,
        limitReached: true,
        upgradeMessage:
          "Pro tarifidagi cheklovga yetdingiz. 100% cheksiz generatsiya va AI feedback uchun Premiumga o'ting",
      };
    }
    if (count >= 20 && count < MAX_PRO_COUNTS) {
      return {
        allowed: true,
        limitReached: false,
        warningMessage: `Sizning bugungi cheklovingiz ${MAX_PRO_COUNTS} ta, ${MAX_PRO_COUNTS - count} ta qoldi. Keyingi generatsiyalar uchun Premiumga o'ting.`,
      };
    }
    return { allowed: true, limitReached: false };
  }

  if (count >= MAX_FREE_COUNTS) {
    return {
      allowed: false,
      limitReached: true,
      upgradeMessage: "Bepul generatsiya limiti tugadi. Pro yoki Premiumga o'ting!",
    };
  }

  return { allowed: true, limitReached: false };
};

export const increaseApiLimit = async (userId: string) => {
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
      data: { count: userApiLimit.count + 1 },
    });
  } else {
    await prisma.userApiLimit.create({
      data: { userId: userId, count: 1 },
    });
  }
};

export const checkCvLimit = async (userId: string) => {
  if (!userId) return { allowed: false, limitReached: true };
  const subscription = await getUserSubscription(userId);
  if (subscription.isPremium && subscription.planSlug === "premium")
    return { allowed: true, limitReached: false };
  if (!subscription.isPremium)
    return {
      allowed: false,
      limitReached: true,
      upgradeMessage: "CV Analyzer bepul tarifda mavjud emas. Pro yoki Premiumga o'ting!",
    };

  const userApiLimit = await prisma.userApiLimit.findUnique({ where: { userId } });
  const count = userApiLimit?.cvCount || 0;
  if (count >= 10)
    return {
      allowed: false,
      limitReached: true,
      upgradeMessage: "Pro tarifidagi 10 ta CV tahlili limitiga yetdingiz. Premiumga o'ting!",
    };
  return {
    allowed: true,
    limitReached: false,
    warningMessage: count >= 8 ? `10 ta limitdan ${10 - count} ta qoldi.` : undefined,
  };
};

export const increaseCvLimit = async (userId: string) => {
  if (!userId) return;
  const userApiLimit = await prisma.userApiLimit.findUnique({ where: { userId } });
  if (userApiLimit) {
    await prisma.userApiLimit.update({
      where: { userId },
      data: { cvCount: userApiLimit.cvCount + 1 },
    });
  } else {
    await prisma.userApiLimit.create({ data: { userId, count: 0, cvCount: 1 } });
  }
};

export const checkIeltsLimit = async (userId: string) => {
  if (!userId) return { allowed: false, limitReached: true };
  const subscription = await getUserSubscription(userId);
  if (subscription.isPremium && subscription.planSlug === "premium")
    return { allowed: true, limitReached: false };
  if (!subscription.isPremium)
    return {
      allowed: false,
      limitReached: true,
      upgradeMessage: "IELTS Mock testlar bepul tarifda mavjud emas.",
    };

  const userApiLimit = await prisma.userApiLimit.findUnique({ where: { userId } });
  const count = userApiLimit?.ieltsCount || 0;
  if (count >= 5)
    return {
      allowed: false,
      limitReached: true,
      upgradeMessage: "Pro tarifidagi 5 ta IELTS mock limitiga yetdingiz. Premiumga o'ting!",
    };
  return {
    allowed: true,
    limitReached: false,
    warningMessage: count >= 4 ? `5 ta limitdan ${5 - count} ta qoldi.` : undefined,
  };
};

export const increaseIeltsLimit = async (userId: string) => {
  if (!userId) return;
  const userApiLimit = await prisma.userApiLimit.findUnique({ where: { userId } });
  if (userApiLimit) {
    await prisma.userApiLimit.update({
      where: { userId },
      data: { ieltsCount: userApiLimit.ieltsCount + 1 },
    });
  } else {
    await prisma.userApiLimit.create({ data: { userId, count: 0, ieltsCount: 1 } });
  }
};

export const getApiLimitCount = async (userId: string) => {
  if (!userId) {
    return 0;
  }

  const userApiLimit = await prisma.userApiLimit.findUnique({
    where: {
      userId,
    },
  });

  if (!userApiLimit) {
    return 0;
  }

  return userApiLimit.count;
};
