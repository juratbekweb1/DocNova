import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const paymePassword = process.env.PAYME_PASSWORD;

    // 1. Fail-closed: If Payme merchant credentials are not configured, reject
    if (!paymePassword) {
      console.error("[PAYME_AUTH_ERROR] PAYME_PASSWORD is not configured on server.");
      return NextResponse.json(
        {
          error: {
            code: -32504,
            message: "Payme merchant credentials are not configured on server.",
          },
        },
        { status: 503 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { error: { code: -32504, message: "Insufficient privileges." } },
        { status: 401 }
      );
    }

    try {
      const credentials = Buffer.from(authHeader.replace("Basic ", "").trim(), "base64").toString(
        "utf-8"
      );
      const parts = credentials.split(":");
      const password = parts.length > 1 ? parts[1] : parts[0];
      if (password !== paymePassword) {
        return NextResponse.json(
          { error: { code: -32504, message: "Invalid credentials." } },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: { code: -32504, message: "Malformed credentials." } },
        { status: 400 }
      );
    }

    const payload = await req.json().catch(() => null);
    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: { code: -32700, message: "Parse error" } },
        { status: 400 }
      );
    }

    const { method, params, id } = payload;

    switch (method) {
      case "CheckPerformTransaction": {
        const transactionId = params?.account?.transaction_id;
        if (!transactionId) {
          return NextResponse.json(
            { error: { code: -31050, message: "Transaction ID not provided" }, id },
            { status: 400 }
          );
        }

        const transaction = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!transaction) {
          return NextResponse.json({
            error: { code: -31050, message: "Transaction not found" },
            id,
          });
        }

        // Payme sends amount in tiyin (1 UZS = 100 tiyins)
        if (transaction.amount * 100 !== params.amount) {
          return NextResponse.json({ error: { code: -31001, message: "Incorrect amount" }, id });
        }

        return NextResponse.json({ result: { allow: true }, id });
      }

      case "CreateTransaction": {
        return NextResponse.json({
          result: {
            create_time: new Date().getTime(),
            transaction: params?.id,
            state: 1,
          },
          id,
        });
      }

      case "PerformTransaction": {
        const transactionId = params?.account?.transaction_id || params?.id;

        const existing = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!existing) {
          return NextResponse.json({
            error: { code: -31050, message: "Transaction not found" },
            id,
          });
        }

        // Idempotency: if already paid, return state: 2 without repeating date updates
        if (existing.status === "PAID" || existing.status === "COMPLETED") {
          return NextResponse.json({
            result: {
              transaction: params.id,
              perform_time: existing.createdAt
                ? new Date(existing.createdAt).getTime()
                : new Date().getTime(),
              state: 2,
            },
            id,
          });
        }

        await prisma.$transaction(async (tx) => {
          const t = await tx.transaction.update({
            where: { id: transactionId },
            data: { status: "PAID" },
          });

          const planName = t.amount >= 60000 ? "PREMIUM" : "PRO";
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);

          await tx.user.update({
            where: { id: t.userId },
            data: {
              plan: planName,
              paymentStatus: "PAID",
              subscriptionEndDate: endDate,
            },
          });
        });

        return NextResponse.json({
          result: {
            transaction: params.id,
            perform_time: new Date().getTime(),
            state: 2,
          },
          id,
        });
      }

      case "CancelTransaction": {
        const transactionId = params?.account?.transaction_id || params?.id;
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { status: "CANCELED" },
        });

        return NextResponse.json({
          result: {
            transaction: params.id,
            cancel_time: new Date().getTime(),
            state: -2,
          },
          id,
        });
      }

      default:
        return NextResponse.json({ error: { code: -32601, message: "Method not found" }, id });
    }
  } catch (error) {
    console.error("[PAYME_WEBHOOK_ERR]", error);
    return NextResponse.json({ error: { code: -32400, message: "System error" } });
  }
}
