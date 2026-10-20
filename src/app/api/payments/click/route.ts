import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillPaymentTransaction, cancelPaymentTransaction } from "@/lib/billing/provider";
import crypto from "crypto";

function toNumericPrepareId(clickTransId: string, transactionId: string): number {
  const parsedClickId = parseInt(clickTransId, 10);
  if (!Number.isNaN(parsedClickId) && parsedClickId > 0) {
    return parsedClickId;
  }
  let hash = 0;
  for (let i = 0; i < transactionId.length; i++) {
    hash = (hash * 31 + transactionId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

async function parseClickBody(req: Request): Promise<Record<string, string>> {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const json = await req.json().catch(() => ({}));
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(json || {})) {
      if (v !== undefined && v !== null) result[k] = String(v);
    }
    return result;
  }
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const result: Record<string, string> = {};
    for (const [k, v] of formData.entries()) {
      result[k] = String(v);
    }
    return result;
  }
  // Default: application/x-www-form-urlencoded or fallback text/formData
  try {
    const rawText = await req.text();
    const params = new URLSearchParams(rawText);
    const result: Record<string, string> = {};
    for (const [k, v] of params.entries()) {
      result[k] = v;
    }
    if (Object.keys(result).length > 0) {
      return result;
    }
  } catch {
    // ignore
  }
  return {};
}

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

    const body = await parseClickBody(req);

    const clickTransId = body.click_trans_id || "";
    const serviceId = body.service_id || "";
    const merchantTransId = body.merchant_trans_id || "";
    const merchantPrepareId = body.merchant_prepare_id || "";
    const amount = body.amount || "";
    const action = body.action || ""; // 0 = Prepare, 1 = Complete
    const error = body.error || "0";
    const errorNote = body.error_note || "";
    const signTime = body.sign_time || "";
    const signString = (body.sign_string || "").toLowerCase();

    // 2. Validate Click Service ID if configured
    const configuredServiceId = process.env.CLICK_SERVICE_ID;
    if (configuredServiceId && serviceId !== configuredServiceId) {
      return NextResponse.json({ error: "-3", error_note: "Service ID does not match" });
    }

    // 3. Validate Digital Signature (MD5 hash according to Click specification)
    // Click Prepare (action=0): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    // Click Complete (action=1): md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
    const signWithoutPrepare = crypto
      .createHash("md5")
      .update(
        `${clickTransId}${serviceId}${clickSecretKey}${merchantTransId}${amount}${action}${signTime}`
      )
      .digest("hex")
      .toLowerCase();

    const signWithPrepare = crypto
      .createHash("md5")
      .update(
        `${clickTransId}${serviceId}${clickSecretKey}${merchantTransId}${merchantPrepareId}${amount}${action}${signTime}`
      )
      .digest("hex")
      .toLowerCase();

    if (signString !== signWithoutPrepare && signString !== signWithPrepare) {
      return NextResponse.json({ error: "-1", error_note: "SIGN CHECK FAILED" });
    }

    // 4. Find Transaction in Database
    const transaction = await prisma.transaction.findUnique({
      where: { id: merchantTransId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "-5", error_note: "Transaction does not exist" });
    }

    // 5. Amount check
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || Math.abs(numericAmount - transaction.amount) > 0.01) {
      return NextResponse.json({ error: "-2", error_note: "Incorrect parameter amount" });
    }

    const numericPrepareId = toNumericPrepareId(clickTransId, transaction.id);

    if (action === "0") {
      // PREPARE
      if (transaction.status === "PAID" || transaction.status === "COMPLETED") {
        return NextResponse.json({ error: "-4", error_note: "Already paid" });
      }
      if (transaction.status === "CANCELED" || transaction.status === "FAILED") {
        return NextResponse.json({ error: "-9", error_note: "Transaction cancelled" });
      }

      return NextResponse.json({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_prepare_id: numericPrepareId,
        error: 0,
        error_note: "Success",
      });
    } else if (action === "1") {
      // COMPLETE
      if (parseInt(error, 10) < 0 || error !== "0") {
        await cancelPaymentTransaction(transaction.id, "FAILED");
        return NextResponse.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: numericPrepareId,
          error: -9,
          error_note: errorNote || "Transaction cancelled",
        });
      }

      // Idempotency: if already paid or completed, return success immediately without re-granting
      if (transaction.status === "PAID" || transaction.status === "COMPLETED") {
        return NextResponse.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: numericPrepareId,
          error: 0,
          error_note: "Already paid",
        });
      }

      if (transaction.status === "CANCELED") {
        return NextResponse.json({
          click_trans_id: clickTransId,
          merchant_trans_id: merchantTransId,
          merchant_confirm_id: numericPrepareId,
          error: -9,
          error_note: "Transaction cancelled",
        });
      }

      await fulfillPaymentTransaction(transaction.id, "CLICK");

      return NextResponse.json({
        click_trans_id: clickTransId,
        merchant_trans_id: merchantTransId,
        merchant_confirm_id: numericPrepareId,
        error: 0,
        error_note: "Success",
      });
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
