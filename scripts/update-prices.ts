import { PrismaClient } from "@prisma/client";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";

async function main() {
  const client = new PGlite("./prisma/pglite");
  const adapter = new PrismaPGlite(client);
  const prisma = new PrismaClient({ adapter });

  await prisma.plan.update({
    where: { slug: 'pro' },
    data: { priceMonthly: 29990, priceYearly: 287900 }
  });

  await prisma.plan.update({
    where: { slug: 'premium' },
    data: { priceMonthly: 49990, priceYearly: 479900 }
  });

  console.log("Prices updated successfully via Prisma!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
