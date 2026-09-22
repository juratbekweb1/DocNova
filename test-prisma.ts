import { prisma } from './src/lib/prisma'; prisma.plan.findMany().then(console.log).catch(e => { console.error('CAUGHT ERROR:', e); });
