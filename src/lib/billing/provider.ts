import { prisma } from "@/lib/prisma";
import { SubscriptionTier } from "@prisma/client";
import crypto from "crypto";

export interface CheckoutSessionOptions {
  userId: string;
  organizationId?: string;
  planId: string;
  provider?: "click" | "payme" | "payx";
  billingCycle?: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentProvider {
  createCheckoutSession(
    options: CheckoutSessionOptions
  ): Promise<{ url: string; id: string; transactionId: string }>;
  handleWebhook(rawBody: string, signature: string): Promise<boolean>;
}

export interface FulfillmentResult {
  alreadyProcessed: boolean;
  transactionId: string;
  userId: string;
  planTier: SubscriptionTier;
  planSlug: "pro" | "premium";
  subscriptionEndDate: Date;
}

export function resolvePlanFromAmount(amount: number): {
  planSlug: "pro" | "premium";
  planTier: SubscriptionTier;
  planName: string;
  durationDays: number;
  aiDailyLimit: number;
  priceMonthly: number;
  priceYearly: number;
} {
  const isYearly = amount >= 300_000;
  const isPremium = isYearly ? amount >= 500_000 : amount >= 60_000;

  return {
    planSlug: isPremium ? "premium" : "pro",
    planTier: isPremium ? SubscriptionTier.PREMIUM : SubscriptionTier.PRO,
    planName: isPremium ? "DocNova Premium" : "DocNova Pro",
    durationDays: isYearly ? 365 : 30,
    aiDailyLimit: isPremium ? 500 : 100,
    priceMonthly: isPremium ? 69_000 : 39_000,
    priceYearly: isPremium ? 662_000 : 374_000,
  };
}

/**
 * Atomically and idempotently fulfills a payment transaction:
 * 1. Marks Transaction as PAID (or returns immediately if already PAID/COMPLETED)
 * 2. Allocates User subscription plan, end date, paymentStatus, and resets usage counters
 * 3. Ensures User's personal Organization, Plan, and active Subscription records are synced
 */
export async function fulfillPaymentTransaction(
  transactionId: string,
  providerOverride?: string
): Promise<FulfillmentResult> {
  return await prisma.$transaction(async (tx) => {
    const existingTx = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTx) {
      throw new Error(`TRANSACTION_NOT_FOUND:${transactionId}`);
    }

    const planMeta = resolvePlanFromAmount(existingTx.amount);

    if (existingTx.status === "PAID" || existingTx.status === "COMPLETED") {
      const existingUser = await tx.user.findUnique({
        where: { id: existingTx.userId },
        select: { subscriptionEndDate: true, plan: true },
      });
      return {
        alreadyProcessed: true,
        transactionId: existingTx.id,
        userId: existingTx.userId,
        planTier: existingUser?.plan || planMeta.planTier,
        planSlug: planMeta.planSlug,
        subscriptionEndDate:
          existingUser?.subscriptionEndDate ||
          new Date(Date.now() + planMeta.durationDays * 24 * 60 * 60 * 1000),
      };
    }

    // Atomic conditional update to prevent concurrent double-grant race conditions
    const claimed = await tx.transaction.updateMany({
      where: {
        id: transactionId,
        status: { notIn: ["PAID", "COMPLETED"] },
      },
      data: {
        status: "PAID",
        ...(providerOverride ? { provider: providerOverride.toUpperCase() } : {}),
      },
    });

    const user = await tx.user.findUnique({
      where: { id: existingTx.userId },
      select: { id: true, name: true, subscriptionEndDate: true, plan: true },
    });

    if (!user) {
      throw new Error(`USER_NOT_FOUND:${existingTx.userId}`);
    }

    if (claimed.count === 0) {
      return {
        alreadyProcessed: true,
        transactionId: existingTx.id,
        userId: existingTx.userId,
        planTier: user.plan || planMeta.planTier,
        planSlug: planMeta.planSlug,
        subscriptionEndDate:
          user.subscriptionEndDate ||
          new Date(Date.now() + planMeta.durationDays * 24 * 60 * 60 * 1000),
      };
    }

    const now = new Date();
    const baseDate =
      user.subscriptionEndDate && new Date(user.subscriptionEndDate) > now
        ? new Date(user.subscriptionEndDate)
        : now;
    const nextPeriodEnd = new Date(
      baseDate.getTime() + planMeta.durationDays * 24 * 60 * 60 * 1000
    );

    // Ensure Plan record exists in DB
    let plan = await tx.plan.findUnique({ where: { slug: planMeta.planSlug } });
    if (!plan) {
      plan = await tx.plan.create({
        data: {
          name: planMeta.planName,
          slug: planMeta.planSlug,
          priceMonthly: planMeta.priceMonthly,
          priceYearly: planMeta.priceYearly,
          aiDailyLimit: planMeta.aiDailyLimit,
          features: {
            isPremium: true,
            ai_usage_limit: planMeta.planSlug === "premium" ? 500 : 200,
            templates_limit: 999,
            export_formats: ["txt", "pdf", "docx"],
          },
          isActive: true,
        },
      });
    }

    // Update User subscription tier, dates, and reset daily/monthly counters
    await tx.user.update({
      where: { id: user.id },
      data: {
        plan: planMeta.planTier,
        planId: plan.id,
        paymentStatus: "PAID",
        subscriptionEndDate: nextPeriodEnd,
        dailyAiCount: 0,
        lastResetDate: now,
      },
    });

    // Reset UserApiLimit counters if present
    await tx.userApiLimit.upsert({
      where: { userId: user.id },
      update: {
        count: 0,
        pdfCount: 0,
        cvCount: 0,
        ieltsCount: 0,
      },
      create: {
        userId: user.id,
        count: 0,
        pdfCount: 0,
        cvCount: 0,
        ieltsCount: 0,
      },
    });

    // Ensure Personal Organization and active Subscription exist
    let orgUser = await tx.organizationUser.findFirst({
      where: { userId: user.id, role: "OWNER" },
    });

    if (!orgUser) {
      const org = await tx.organization.create({
        data: {
          name: `${user.name || "User"}'s Personal Workspace`,
          slug: `personal-${user.id.slice(0, 8)}-${Date.now()}`,
        },
      });
      orgUser = await tx.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: "OWNER",
        },
      });
    }

    const existingSub = await tx.subscription.findFirst({
      where: { organizationId: orgUser.organizationId, status: "active" },
      orderBy: { createdAt: "desc" },
    });

    if (existingSub) {
      await tx.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId: plan.id,
          status: "active",
          currentPeriodEnd: nextPeriodEnd,
        },
      });
    } else {
      await tx.subscription.create({
        data: {
          organizationId: orgUser.organizationId,
          planId: plan.id,
          status: "active",
          currentPeriodEnd: nextPeriodEnd,
        },
      });
    }

    return {
      alreadyProcessed: false,
      transactionId: existingTx.id,
      userId: user.id,
      planTier: planMeta.planTier,
      planSlug: planMeta.planSlug,
      subscriptionEndDate: nextPeriodEnd,
    };
  });
}

/**
 * Atomically and idempotently cancels/fails a transaction and revokes subscription if previously paid.
 */
export async function cancelPaymentTransaction(
  transactionId: string,
  targetStatus: "CANCELED" | "FAILED" = "CANCELED"
): Promise<{ wasPaid: boolean; status: string }> {
  return await prisma.$transaction(async (tx) => {
    const existingTx = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTx) {
      throw new Error(`TRANSACTION_NOT_FOUND:${transactionId}`);
    }

    const wasPaid = existingTx.status === "PAID" || existingTx.status === "COMPLETED";

    if (existingTx.status === "CANCELED" || existingTx.status === "FAILED") {
      return { wasPaid: false, status: existingTx.status };
    }

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: targetStatus },
    });

    if (wasPaid) {
      await tx.user.update({
        where: { id: existingTx.userId },
        data: {
          plan: SubscriptionTier.FREE,
          paymentStatus: targetStatus,
          subscriptionEndDate: new Date(),
        },
      });

      const orgUser = await tx.organizationUser.findFirst({
        where: { userId: existingTx.userId, role: "OWNER" },
      });

      if (orgUser) {
        await tx.subscription.updateMany({
          where: { organizationId: orgUser.organizationId, status: "active" },
          data: { status: "canceled", currentPeriodEnd: new Date() },
        });
      }
    }

    return { wasPaid, status: targetStatus };
  });
}

export function buildProviderPaymentUrl(params: {
  provider: "click" | "payme" | "payx";
  transactionId: string;
  amountUzs: number;
  returnUrl?: string;
  cardType?: "uzcard" | "humo";
}): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.docnova.uz").replace(/\/$/, "");
  const redirectUrl = params.returnUrl || `${appUrl}/dashboard?payment=success`;

  if (params.provider === "click") {
    const serviceId = (process.env.CLICK_SERVICE_ID || "").trim();
    const merchantId = (process.env.CLICK_MERCHANT_ID || "").trim();
    const merchantUserId = (process.env.CLICK_MERCHANT_USER_ID || "").trim();

    const query = new URLSearchParams({
      service_id: serviceId,
      merchant_id: merchantId,
      amount: Number(params.amountUzs).toFixed(2),
      transaction_param: params.transactionId,
      return_url: redirectUrl,
    });

    if (merchantUserId) {
      query.set("merchant_user_id", merchantUserId);
    }
    if (params.cardType) {
      query.set("card_type", params.cardType);
    }

    return `https://my.click.uz/services/pay?${query.toString()}`;
  }

  if (params.provider === "payme") {
    const merchantId = (process.env.PAYME_MERCHANT_ID || "").trim();
    const amountTiyin = Math.round(params.amountUzs * 100);
    const payload = `m=${merchantId};ac.transaction_id=${params.transactionId};a=${amountTiyin};c=${redirectUrl}`;
    const encoded = Buffer.from(payload, "utf-8").toString("base64");
    return `https://checkout.paycom.uz/${encoded}`;
  }

  return `${redirectUrl}&transaction_id=${encodeURIComponent(params.transactionId)}`;
}

/**
 * Direct Click Shop API Invoice fallback (sends invoice directly to user's phone number / Click app
 * when QR scan is unavailable or under maintenance).
 */
export async function createClickPhoneInvoice(params: {
  transactionId: string;
  amountUzs: number;
  phoneNumber: string;
}): Promise<{ ok: boolean; invoiceId?: number; errorNote?: string }> {
  const serviceId = Number(process.env.CLICK_SERVICE_ID);
  const merchantUserId = (process.env.CLICK_MERCHANT_USER_ID || "").trim();
  const secretKey = (process.env.CLICK_SECRET_KEY || "").trim();

  if (!serviceId || !merchantUserId || !secretKey) {
    return { ok: false, errorNote: "Click API credentials missing" };
  }

  const cleanPhone = params.phoneNumber.replace(/\D/g, "");
  const normalizedPhone = cleanPhone.startsWith("998") ? cleanPhone : `998${cleanPhone}`;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const digest = crypto.createHash("sha1").update(`${timestamp}${secretKey}`).digest("hex");

  const res = await fetch("https://api.click.uz/v2/merchant/invoice/create", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Auth: `${merchantUserId}:${digest}:${timestamp}`,
    },
    body: JSON.stringify({
      service_id: serviceId,
      amount: Number(params.amountUzs),
      phone_number: normalizedPhone,
      merchant_trans_id: params.transactionId,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok && data.error_code === 0) {
    return { ok: true, invoiceId: data.invoice_id };
  }
  return {
    ok: false,
    errorNote: data.error_note || `HTTP ${res.status}`,
  };
}

class DocNovaPaymentProvider implements PaymentProvider {
  async createCheckoutSession(options: CheckoutSessionOptions) {
    const normalizedPlan = options.planId.toLowerCase().includes("premium") ? "premium" : "pro";
    const isYearly = options.billingCycle === "yearly";
    const amount =
      normalizedPlan === "premium" ? (isYearly ? 662_000 : 69_000) : isYearly ? 374_000 : 39_000;
    const provider = options.provider || "click";

    const transaction = await prisma.transaction.create({
      data: {
        userId: options.userId,
        amount,
        provider: provider.toUpperCase(),
        status: "PENDING",
      },
    });

    const url = buildProviderPaymentUrl({
      provider,
      transactionId: transaction.id,
      amountUzs: transaction.amount,
      returnUrl: options.successUrl,
    });

    return {
      url,
      id: transaction.id,
      transactionId: transaction.id,
    };
  }

  async handleWebhook(rawBody: string, signature: string): Promise<boolean> {
    const secret =
      process.env.PAYX_WEBHOOK_SECRET ||
      process.env.CLICK_SECRET_KEY ||
      process.env.PAYME_PASSWORD ||
      "";
    if (!secret) return false;

    const expectedSig = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expectedSig && signature !== secret) {
      return false;
    }

    const parsed = JSON.parse(rawBody);
    const txId = parsed?.transactionId || parsed?.payer_reference || parsed?.merchant_trans_id;
    if (!txId) return false;

    await fulfillPaymentTransaction(txId);
    return true;
  }
}

export const paymentProvider = new DocNovaPaymentProvider();
