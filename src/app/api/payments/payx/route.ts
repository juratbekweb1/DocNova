import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillPaymentTransaction, cancelPaymentTransaction } from "@/lib/billing/provider";

export async function POST(req: Request) {
  try {
    // 1. Fail-closed: Ensure provider credentials are configured
    const configuredSecret = process.env.PAYX_WEBHOOK_SECRET || process.env.PAYX_API_KEY;
    if (!configuredSecret) {
      console.error("[PAYX_WEBHOOK_ERR] PAYX_WEBHOOK_SECRET / PAYX_API_KEY is not configured.");
      return NextResponse.json(
        {
          error: "Payment provider webhook authentication is not configured on server.",
          code: "PAYX_UNCONFIGURED",
        },
        { status: 503 }
      );
    }

    // 2. Authenticate webhook caller via Bearer token or custom secret header
    const authHeader =
      req.headers.get("authorization") ||
      req.headers.get("x-payx-secret") ||
      req.headers.get("x-secret-key");
    const providedToken = authHeader?.replace(/^Bearer\s+/i, "").trim();

    if (!providedToken || providedToken !== configuredSecret) {
      return NextResponse.json(
        { error: "Invalid webhook credentials or signature", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const reference = body.payer_reference || body.reference || body.order_id;
    const status = (body.status || "").toString().toLowerCase();
    const amount = body.amount !== undefined ? parseFloat(body.amount) : undefined;

    if (!reference || typeof reference !== "string") {
      return NextResponse.json(
        { error: "No valid transaction reference provided" },
        { status: 400 }
      );
    }

    // 3. Find transaction in database
    const transaction = await prisma.transaction.findUnique({
      where: { id: reference },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 4. Idempotency: if transaction is already completed/paid, return success without duplicate grants
    if (transaction.status === "COMPLETED" || transaction.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "Transaction already processed and completed",
      });
    }

    // 5. Amount integrity check
    if (amount !== undefined && !isNaN(amount)) {
      if (Math.abs(amount - transaction.amount) > 0.01) {
        console.error(
          `[PAYX_AMOUNT_MISMATCH] Transaction ${transaction.id}: Expected ${transaction.amount}, received ${amount}`
        );
        return NextResponse.json(
          { error: "Amount mismatch between webhook and recorded transaction" },
          { status: 400 }
        );
      }
    }

    // 6. Process payment status idempotently
    const isSuccess = ["paid", "completed", "success", "approved"].includes(status);

    if (isSuccess) {
      await fulfillPaymentTransaction(transaction.id, "PAYX");
      return NextResponse.json({ success: true, message: "Payment processed successfully" });
    } else if (["failed", "cancelled", "canceled", "rejected"].includes(status)) {
      await cancelPaymentTransaction(transaction.id, "FAILED");
      return NextResponse.json({ success: true, message: "Transaction marked as failed" });
    }

    return NextResponse.json({ error: "Unhandled transaction status" }, { status: 400 });
  } catch (error) {
    console.error("[PAYX_WEBHOOK_ERR]", error);
    return NextResponse.json({ error: "Internal webhook processing error" }, { status: 500 });
  }
}
