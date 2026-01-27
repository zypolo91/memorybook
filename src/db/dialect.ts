export type DatabaseDialect = 'mysql' | 'postgres';

function normalizeDialect(value: string): DatabaseDialect | null {
  const v = value.trim().toLowerCase();
  if (v === 'mysql') return 'mysql';
  if (v === 'postgres' || v === 'postgresql' || v === 'pg') return 'postgres';
  return null;
}

export function getDatabaseDialect(): DatabaseDialect {
  const explicit = process.env.DATABASE_DIALECT;
  if (explicit) {
    const normalized = normalizeDialect(explicit);
    if (!normalized) {
      throw new Error(
        `Invalid DATABASE_DIALECT: "${explicit}". Expected "mysql" or "postgres".`
      );
    }
    return normalized;
  }

  const url = process.env.DATABASE_URL;
  if (url) {
    const lower = url.trim().toLowerCase();
    if (lower.startsWith('postgres://') || lower.startsWith('postgresql://')) {
      return 'postgres';
    }
    if (lower.startsWith('mysql://') || lower.startsWith('mariadb://')) {
      return 'mysql';
    }
  }

  return 'mysql';
}

