import { PGlite } from '@electric-sql/pglite';
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
  if (fs.existsSync('./prisma/pglite')) {
    fs.rmSync('./prisma/pglite', { recursive: true, force: true });
    console.log('Deleted old PGlite DB');
  }

  console.log('Generating schema SQL using Prisma...');
  const sqlContentBuffer = execSync('npx prisma migrate diff --from-empty --to-schema ./prisma/schema.prisma --script');
  
  // Clean up the output to make it valid SQL (remove the prisma output headers)
  let sqlContent = sqlContentBuffer.toString('utf8');
  sqlContent = sqlContent.replace(/^.*injected env.*\n/gm, '');
  sqlContent = sqlContent.replace(/^.*Loaded Prisma config.*\n/gm, '');

  const client = new PGlite("./prisma/pglite");

  console.log('Applying schema to new DB...');
  
  try {
    await client.exec(sqlContent);
    console.log('Database schema created successfully.');
  } catch (e: any) {
    console.error('Failed to execute schema sql:', e.message);
  }

  // Create a dummy user
  await client.query(`
    INSERT INTO "User" (id, email, name, role, plan, "dailyAiCount", "mockTestCount", "resumeCount", "updatedAt")
    VALUES ('1', 'admin@docnova.uz', 'Juratbek Ashirboyev', 'SUPER_ADMIN', 'PREMIUM', 0, 0, 0, NOW())
  `);
  console.log('Created SUPER_ADMIN user: admin@docnova.uz');

  await client.close();
}

main().catch(console.error);
