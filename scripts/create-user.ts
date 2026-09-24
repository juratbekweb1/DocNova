import { PGlite } from '@electric-sql/pglite';

async function main() {
  const client = new PGlite("./prisma/pglite");

  try {
    await client.query(`
      INSERT INTO "User" (id, email, "passwordHash", name, role, "aiUsageCount", "updatedAt")
      VALUES ('2', 'juratbekashirboyev295@gmail.com', '$2b$10$naSfOzdEzqz76TGF.Sb2M.X4sOiNsfQbSSe8Z3CL/Y4ceuWiixKEq', 'Juratbek Ashirboyev', 'SUPER_ADMIN', 0, NOW())
    `);
    console.log('Created SUPER_ADMIN user: juratbekashirboyev295@gmail.com');
  } catch (e: any) {
    if (e.message.includes('unique constraint')) {
      await client.query(`
        UPDATE "User"
        SET "passwordHash" = '$2b$10$naSfOzdEzqz76TGF.Sb2M.X4sOiNsfQbSSe8Z3CL/Y4ceuWiixKEq', role = 'SUPER_ADMIN'
        WHERE email = 'juratbekashirboyev295@gmail.com'
      `);
      console.log('Updated user to SUPER_ADMIN.');
    } else {
      console.error(e);
    }
  }

  await client.close();
}

main().catch(console.error);
