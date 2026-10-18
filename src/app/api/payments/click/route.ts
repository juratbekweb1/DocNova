import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const clickSecretKey = process.env.CLICK_SECRET_KEY;

    // 1. Fail-closed: Ensure Click secret is configured and not default dummy value
    if (!clickSecretKey || clickSecretKey === "YOUR_CLICK_SECRET") {
      console.error("[CLICK_AUTH_ERROR] CLICK_SECRET_KEY is not configured on server.");
      return NextResponse.json(
        { error: "-8", error_note: "Click merchant secret is not configured on server" },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const body = Object.fromEntries(formData.entries());

    const clickTransId = body.click_trans_id as string;
    const serviceId = body.service_id as string;
    const _clickPaydocId = body.click_paydoc_id as string;
    const merchantTransId = body.merchant_trans_id as string; // transaction.id in our DB
    const amount = body.amount as string;
    const action = body.action as string; // 0 = Prepare, 1 = Complete
    const error = body.error as string;
    const errorNote = body.error_note as string;
    const signTime = body.sign_time as string;
    const signString = body.sign_string as string;

    // 2. Validate Click Service ID if configured
    const configuredServiceId = process.env.CLICK_SERVICE_ID;
    if (configuredServiceId && serviceId !== configuredServiceId) {
      return NextResponse.json({ error: "-3", error_note: "Service ID does not match" });
    }

    // 3. Validate Digital Signature (MD5 hash according to Click specification)
    const mySignString = `${clickTransId}${serviceId}${clickSecretKey}${merchantTransId}${amount}${action}${signTime}`;
    const generatedSign = crypto.createHash("md5").update(mySignString).digest("hex");

    if (generatedSign !== signString) {
      return NextResponse.json({ error: "-1", error_note: "SIGN CHECK FAILED" });
    }

    // 4. Find Transaction in Database
    const transaction = await prisma.transaction.findUnique({
      where: { id: merchantTransId },
      include: { user: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "-5", error_note: "Transaction does not exist" });
    }

    // 5. Amount check
    if (parseFloat(amount) !== transaction.amount) {
      return NextResponse.json({ error: "-2", error_note: "Incorrect amount" });
    }

    if (action === "0") {
      // PREPARE
      return NextResponse.json({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: transaction.id,
        error: 0,
        error_note: "Success",
      });
    } else if (action === "1") {
      // COMPLETE
      // Idempotency: if already paid or completed, return success immediately without re-granting
      if (transaction.status === "PAID" || transaction.status === "COMPLETED") {
        return NextResponse.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: transaction.id,
          error: 0,
          error_note: "Already paid",
        });
      }

      if (error === "0") {
        // Successful payment
        await prisma.$transaction(async (tx) => {
          await tx.transaction.update({
            where: { id: merchantTransId },
            data: { status: "PAID" },
          });

          const planName = transaction.amount >= 60000 ? "PREMIUM" : "PRO";
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // Add 30 days

          await tx.user.update({
            where: { id: transaction.userId },
            data: {
              plan: planName,
              paymentStatus: "PAID",
              subscriptionEndDate: endDate,
            },
          });
        });

        return NextResponse.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: transaction.id,
          error: 0,
          error_note: "Success",
        });
      } else {
        // Payment failed
        await prisma.transaction.update({
          where: { id: merchantTransId },
          data: { status: "FAILED" },
        });
        return NextResponse.json({ error: "-9", error_note: errorNote });
      }
    }

    return NextResponse.json({ error: "-3", error_note: "Action not found" });
  } catch (err) {
    console.error("[CLICK_WEBHOOK_ERR]", err);
    return NextResponse.json(
      { error: "-8", error_note: "Error in request from click" },
      { status: 500 }
    );
  }
}
