/**
 * 修复 Drizzle Snapshot
 * 从当前数据库状态生成新的 snapshot，避免误删表
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME
});

async function getTableInfo() {
  const result = await pool.query(`
    SELECT 
      table_name,
      column_name,
      data_type,
      character_maximum_length,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position
  `);

  const tables: Record<string, any[]> = {};
  for (const row of result.rows) {
    if (!tables[row.table_name]) {
      tables[row.table_name] = [];
    }
    tables[row.table_name].push(row);
  }

  return tables;
}

async function getIndexes() {
  const result = await pool.query(`
    SELECT 
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);

  return result.rows;
}

async function main() {
  console.log('🔍 分析当前数据库结构...\n');

  const tables = await getTableInfo();
  const indexes = await getIndexes();

  console.log(`📊 发现 ${Object.keys(tables).length} 个表:`);
  for (const tableName of Object.keys(tables)) {
    const rowCount = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    console.log(`   - ${tableName} (${rowCount.rows[0].count} 条记录)`);
  }

  console.log('\n💡 建议:');
  console.log('   1. 使用安全迁移脚本: pnpm db:safe-migrate');
  console.log('   2. 或者手动执行 SQL: psql -f drizzle/pg/add_new_tables.sql');
  console.log('   3. 如果必须使用 db:push，请先备份数据！\n');

  await pool.end();
}

main().catch(console.error);
