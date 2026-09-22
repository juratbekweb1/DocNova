import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting database seeding...");

  // Seed default plans
  const freePlan = await prisma.plan.upsert({
    where: { slug: "free" },
    update: {},
    create: {
      name: "Free",
      slug: "free",
      features: ["1 Resume", "Basic Templates", "PDF Export"],
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      name: "Pro",
      slug: "pro",
      features: ["Unlimited Resumes", "All Templates", "AI Rewrite", "Cover Letters"],
      stripePriceIdMonthly: "price_mock_monthly",
      stripePriceIdYearly: "price_mock_yearly",
    },
  });

  // Seed default templates
  const modernTemplate = await prisma.template.upsert({
    where: { slug: "modern" },
    update: {},
    create: {
      name: "Modern",
      slug: "modern",
      category: "Professional",
      isPremium: false,
    },
  });

  const executiveTemplate = await prisma.template.upsert({
    where: { slug: "executive" },
    update: {},
    create: {
      name: "Executive",
      slug: "executive",
      category: "Corporate",
      isPremium: true,
    },
  });

  console.log("Seeding finished.");
  console.log({ freePlan, proPlan, modernTemplate, executiveTemplate });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
