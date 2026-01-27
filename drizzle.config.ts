import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { getDatabaseDialect } from './src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

const kitDialect = dialect === 'postgres' ? 'postgresql' : 'mysql';
const schema =
  dialect === 'postgres' ? './src/db/schema.pg.ts' : './src/db/schema.mysql.ts';
const out = dialect === 'postgres' ? './drizzle/pg' : './drizzle';

const dbCredentials =
  process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0
    ? { url: process.env.DATABASE_URL }
    : dialect === 'postgres'
      ? {
          host: process.env.DATABASE_HOST!,
          port: Number(process.env.DATABASE_PORT) || 5432,
          user: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME!
        }
      : {
          host: process.env.DATABASE_HOST!,
          port: Number(process.env.DATABASE_PORT) || 3306,
          user: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME!
        };

export default defineConfig({
  dialect: kitDialect,
  schema,
  out,
  dbCredentials,
  tablesFilter: ['!_*'],
  verbose: true,
  strict: false
});
