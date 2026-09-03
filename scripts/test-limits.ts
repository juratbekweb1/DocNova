import {
  checkApiLimit,
  increaseApiLimit,
  checkCvLimit,
  increaseCvLimit,
} from "../src/lib/ai-limit";
import { prisma } from "../src/lib/prisma";

async function main() {
  // Create dummy user
  const user = await prisma.user.create({
    data: {
      email: "testpro@example.com",
      role: "USER",
    },
  });

  const org = await prisma.organization.create({
    data: { name: "Test Org", slug: "test-org" },
  });

  await prisma.organizationUser.create({
    data: { userId: user.id, organizationId: org.id, role: "OWNER" },
  });

  // Ensure 'pro' plan exists
  let proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });
  if (!proPlan) {
    proPlan = await prisma.plan.create({
      data: { name: "Pro", slug: "pro", features: {} },
    });
  }
  let premiumPlan = await prisma.plan.findUnique({ where: { slug: "premium" } });
  if (!premiumPlan) {
    premiumPlan = await prisma.plan.create({
      data: { name: "Premium", slug: "premium", features: {} },
    });
  }

  // Assign Pro subscription
  await prisma.subscription.create({
    data: {
      organizationId: org.id,
      planId: proPlan.id,
      status: "active",
    },
  });

  console.log("=== Testing Pro AI Generation Limits ===");
  // Simulate 24 uses
  for (let i = 0; i < 24; i++) {
    await increaseApiLimit(user.id);
  }
  const check24 = await checkApiLimit(user.id);
  console.log("After 24 uses:", check24);

  // 25th use
  await increaseApiLimit(user.id);
  const check25 = await checkApiLimit(user.id);
  console.log("After 25 uses:", check25);

  console.log("=== Testing Pro CV Analyzer Limits ===");
  // Simulate 9 uses
  for (let i = 0; i < 9; i++) {
    await increaseCvLimit(user.id);
  }
  const cvCheck9 = await checkCvLimit(user.id);
  console.log("After 9 CV uses:", cvCheck9);

  // 10th use
  await increaseCvLimit(user.id);
  const cvCheck10 = await checkCvLimit(user.id);
  console.log("After 10 CV uses:", cvCheck10);

  console.log("=== Test Complete ===");

  // Cleanup
  await prisma.subscription.deleteMany({ where: { organizationId: org.id } });
  await prisma.organizationUser.deleteMany({ where: { organizationId: org.id } });
  await prisma.organization.delete({ where: { id: org.id } });
  await prisma.userApiLimit.delete({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
