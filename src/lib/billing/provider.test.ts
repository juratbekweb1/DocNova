import { describe, expect, it } from "vitest";
import { resolvePlanFromAmount, buildProviderPaymentUrl } from "./provider";
import { SubscriptionTier } from "@prisma/client";

describe("Billing Provider Engine", () => {
  it("correctly resolves Pro and Premium plans based on payment amount", () => {
    // Monthly Pro (39,000 UZS)
    const proMonthly = resolvePlanFromAmount(39_000);
    expect(proMonthly.planSlug).toBe("pro");
    expect(proMonthly.planTier).toBe(SubscriptionTier.PRO);
    expect(proMonthly.durationDays).toBe(30);

    // Monthly Premium (69,000 UZS)
    const premiumMonthly = resolvePlanFromAmount(69_000);
    expect(premiumMonthly.planSlug).toBe("premium");
    expect(premiumMonthly.planTier).toBe(SubscriptionTier.PREMIUM);
    expect(premiumMonthly.durationDays).toBe(30);

    // Yearly Pro (374,000 UZS)
    const proYearly = resolvePlanFromAmount(374_000);
    expect(proYearly.planSlug).toBe("pro");
    expect(proYearly.durationDays).toBe(365);

    // Yearly Premium (662,000 UZS)
    const premiumYearly = resolvePlanFromAmount(662_000);
    expect(premiumYearly.planSlug).toBe("premium");
    expect(premiumYearly.durationDays).toBe(365);
  });

  describe("buildProviderPaymentUrl", () => {
    it("generates Click payment URL with cardType and proper query params", () => {
      const url = buildProviderPaymentUrl({
        provider: "click",
        transactionId: "tx_12345",
        amountUzs: 39_000,
        cardType: "uzcard",
      });

      expect(url).toContain("https://my.click.uz/services/pay?");
      expect(url).toContain("transaction_param=tx_12345");
      expect(url).toContain("card_type=uzcard");
      expect(url).toContain("amount=39000.00");
    });

    it("generates Payme payment URL with base64 encoded parameters", () => {
      const url = buildProviderPaymentUrl({
        provider: "payme",
        transactionId: "tx_998877",
        amountUzs: 69_000,
      });

      expect(url).toContain("https://checkout.paycom.uz/");
      const base64Part = url.replace("https://checkout.paycom.uz/", "");
      const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
      expect(decoded).toContain("ac.transaction_id=tx_998877");
      expect(decoded).toContain("a=6900000"); // 69,000 * 100 tiyins
    });

    it("correctly handles URL query parameter separator for PayX / generic returnUrl", () => {
      // Case 1: returnUrl has NO existing query params
      const urlWithoutQuery = buildProviderPaymentUrl({
        provider: "payx",
        transactionId: "tx_clean_1",
        amountUzs: 39_000,
        returnUrl: "https://www.docnova.uz/dashboard/billing",
      });

      expect(urlWithoutQuery).toBe(
        "https://www.docnova.uz/dashboard/billing?transaction_id=tx_clean_1"
      );

      // Case 2: returnUrl ALREADY has query params
      const urlWithQuery = buildProviderPaymentUrl({
        provider: "payx",
        transactionId: "tx_clean_2",
        amountUzs: 39_000,
        returnUrl: "https://www.docnova.uz/dashboard?payment=success",
      });

      expect(urlWithQuery).toBe(
        "https://www.docnova.uz/dashboard?payment=success&transaction_id=tx_clean_2"
      );
    });
  });
});
