import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fulfillPaymentTransaction, cancelPaymentTransaction } from "@/lib/billing/provider";

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
      const password = parts.length > 1 ? parts.slice(1).join(":") : parts[0];
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
            { status: 200 }
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

        if (transaction.status === "PAID" || transaction.status === "COMPLETED") {
          return NextResponse.json({
            error: { code: -31008, message: "Transaction already completed" },
            id,
          });
        }

        if (transaction.status === "CANCELED" || transaction.status === "FAILED") {
          return NextResponse.json({
            error: { code: -31008, message: "Transaction is cancelled" },
            id,
          });
        }

        // Payme sends amount in tiyin (1 UZS = 100 tiyins)
        if (Math.round(transaction.amount * 100) !== Number(params?.amount)) {
          return NextResponse.json({ error: { code: -31001, message: "Incorrect amount" }, id });
        }

        return NextResponse.json({ result: { allow: true }, id });
      }

      case "CreateTransaction": {
        const transactionId = params?.account?.transaction_id || params?.id;
        if (!transactionId) {
          return NextResponse.json({
            error: { code: -31050, message: "Transaction ID not provided" },
            id,
          });
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

        if (
          params?.amount !== undefined &&
          Math.round(transaction.amount * 100) !== Number(params.amount)
        ) {
          return NextResponse.json({ error: { code: -31001, message: "Incorrect amount" }, id });
        }

        if (transaction.status === "CANCELED" || transaction.status === "FAILED") {
          return NextResponse.json({
            error: { code: -31008, message: "Cannot perform operation" },
            id,
          });
        }

        const createTime = transaction.createdAt
          ? new Date(transaction.createdAt).getTime()
          : Date.now();

        return NextResponse.json({
          result: {
            create_time: createTime,
            transaction: transaction.id,
            state: transaction.status === "PAID" || transaction.status === "COMPLETED" ? 2 : 1,
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

        if (existing.status === "CANCELED" || existing.status === "FAILED") {
          return NextResponse.json({
            error: { code: -31008, message: "Transaction was cancelled" },
            id,
          });
        }

        // Idempotency: if already paid, return state: 2 without repeating date updates
        if (existing.status === "PAID" || existing.status === "COMPLETED") {
          return NextResponse.json({
            result: {
              transaction: params?.id || existing.id,
              perform_time: existing.createdAt
                ? new Date(existing.createdAt).getTime()
                : Date.now(),
              state: 2,
            },
            id,
          });
        }

        await fulfillPaymentTransaction(existing.id, "PAYME");

        return NextResponse.json({
          result: {
            transaction: params?.id || existing.id,
            perform_time: Date.now(),
            state: 2,
          },
          id,
        });
      }

      case "CancelTransaction": {
        const transactionId = params?.account?.transaction_id || params?.id;
        const existing = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!existing) {
          return NextResponse.json({
            error: { code: -31003, message: "Transaction not found" },
            id,
          });
        }

        const { wasPaid } = await cancelPaymentTransaction(existing.id, "CANCELED");

        return NextResponse.json({
          result: {
            transaction: params?.id || existing.id,
            cancel_time: Date.now(),
            state: wasPaid ? -2 : -1,
          },
          id,
        });
      }

      case "CheckTransaction": {
        const transactionId = params?.account?.transaction_id || params?.id;
        const existing = await prisma.transaction.findUnique({
          where: { id: transactionId },
        });

        if (!existing) {
          return NextResponse.json({
            error: { code: -31003, message: "Transaction not found" },
            id,
          });
        }

        const createdMs = existing.createdAt ? new Date(existing.createdAt).getTime() : Date.now();
        const isPaid = existing.status === "PAID" || existing.status === "COMPLETED";
        const isCanceled = existing.status === "CANCELED" || existing.status === "FAILED";

        return NextResponse.json({
          result: {
            create_time: createdMs,
            perform_time: isPaid ? createdMs : 0,
            cancel_time: isCanceled ? createdMs : 0,
            transaction: existing.id,
            state: isPaid ? 2 : isCanceled ? -2 : 1,
            reason: isCanceled ? 5 : null,
          },
          id,
        });
      }

      case "GetStatement": {
        const fromMs = Number(params?.from || 0);
        const toMs = Number(params?.to || Date.now());
        const list = await prisma.transaction.findMany({
          where: {
            provider: "PAYME",
            createdAt: {
              gte: new Date(fromMs),
              lte: new Date(toMs),
            },
          },
          orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({
          result: {
            transactions: list.map((t) => {
              const tMs = new Date(t.createdAt).getTime();
              const isPaid = t.status === "PAID" || t.status === "COMPLETED";
              const isCanceled = t.status === "CANCELED" || t.status === "FAILED";
              return {
                id: t.id,
                time: tMs,
                amount: Math.round(t.amount * 100),
                account: { transaction_id: t.id },
                create_time: tMs,
                perform_time: isPaid ? tMs : 0,
                cancel_time: isCanceled ? tMs : 0,
                transaction: t.id,
                state: isPaid ? 2 : isCanceled ? -2 : 1,
                reason: isCanceled ? 5 : null,
              };
            }),
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
