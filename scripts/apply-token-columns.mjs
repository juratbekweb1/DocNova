import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log("Applying token columns to PostgreSQL...");
    await pool.query(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "academicTokens" INTEGER NOT NULL DEFAULT 3;
    `);
    await pool.query(`
      ALTER TABLE "Transaction"
      ADD COLUMN IF NOT EXISTS "itemType" TEXT DEFAULT 'SUBSCRIPTION';
    `);
    console.log("Columns applied successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
