import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function main() {
  const { getDatabaseDialect } = await import('../src/db/dialect');
  const { db } = await import('../src/db');
  const { users } = await import('../src/db/schema');

  const dialect = getDatabaseDialect();
  console.log(`[verify-db] DATABASE_DIALECT=${dialect}`);

  // Build a query without executing it (no DB connection needed).
  const query = (db as any)
    .select({ id: (users as any).id })
    .from(users as any)
    .limit(1);

  if (typeof (query as any).toSQL === 'function') {
    const compiled = (query as any).toSQL();
    console.log('[verify-db] toSQL.sql:', compiled.sql);
  } else {
    console.log('[verify-db] query:', query);
  }
}

main().catch((err) => {
  console.error('[verify-db] failed:', err);
  process.exit(1);
});

