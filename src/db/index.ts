import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import mysql from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import * as dotenv from 'dotenv';
import { getDatabaseDialect } from './dialect';
import * as pgSchema from './schema.pg';
import * as mysqlSchema from './schema.mysql';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

function createDb() {
  if (dialect === 'postgres') {
    const pgPool = new PgPool(
      process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
          }
        : {
            host: process.env.DATABASE_HOST || '127.0.0.1',
            port: Number(process.env.DATABASE_PORT) || 5432,
            user: process.env.DATABASE_USERNAME || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'n_admin',
            ssl:
              process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : undefined,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
          }
    );
    return drizzlePg(pgPool as any, { schema: pgSchema });
  } else {
    const mysqlPool = process.env.DATABASE_URL
      ? mysql.createPool(process.env.DATABASE_URL)
      : mysql.createPool({
          host: process.env.DATABASE_HOST || '127.0.0.1',
          port: Number(process.env.DATABASE_PORT) || 3306,
          user: process.env.DATABASE_USERNAME || 'root',
          password: process.env.DATABASE_PASSWORD || 'root',
          database: process.env.DATABASE_NAME || 'n_admin',
          ssl:
            process.env.NODE_ENV === 'production'
              ? { rejectUnauthorized: false }
              : undefined,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
    return drizzleMysql(mysqlPool as any, {
      schema: mysqlSchema,
      mode: 'default'
    });
  }
}

export const db: any = createDb();
