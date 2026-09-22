import { prisma } from './src/lib/prisma.ts'; prisma.plan.findMany().then(console.log).catch(console.error);
