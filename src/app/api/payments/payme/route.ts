import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// In production, verify Payme Merchant Password from Basic Auth Header
const _PAYME_PASSWORD = process.env.PAYME_PASSWORD || "YOUR_PAYME_PASSWORD";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json({ error: { code: -32504, message: "Insufficient privileges." } });
    }

    const payload = await req.json();
    const { method, params, id } = payload;

    switch (method) {
      case "CheckPerformTransaction": {
        const transaction = await prisma.transaction.findUnique({
          where: { id: params.account.transaction_id },
        });

        if (!transaction) {
          return NextResponse.json({
            error: { code: -31050, message: "Transaction not found" },
            id,
          });
        }

        if (transaction.amount * 100 !== params.amount) {
          // Payme sends tiyins
          return NextResponse.json({ error: { code: -31001, message: "Incorrect amount" }, id });
        }

        return NextResponse.json({ result: { allow: true }, id });
      }

      case "CreateTransaction": {
        return NextResponse.json({
          result: {
            create_time: new Date().getTime(),
            transaction: params.id,
            state: 1,
          },
          id,
        });
      }

      case "PerformTransaction": {
        const transactionId = params.account?.transaction_id || params.id;

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
        const transactionId = params.account?.transaction_id || params.id;
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
    console.error("Payme Webhook Error:", error);
    return NextResponse.json({ error: { code: -32400, message: "System error" } });
  }
}
