/**
 * 安全迁移脚本
 * 只创建新表，不删除现有表和数据
 */

import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
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

async function tableExists(tableName: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`,
    [tableName]
  );
  return result.rows[0].exists;
}

async function executeSafeMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始安全迁移...\n');

    // 新表列表
    const newTables = [
      'medical_categories',
      'medical_records',
      'medical_tags',
      'medical_record_tags',
      'location_records',
      'geofences',
      'geofence_alerts'
    ];

    // 检查哪些表已存在
    console.log('📋 检查现有表...');
    const existingTables: string[] = [];
    for (const table of newTables) {
      const exists = await tableExists(table);
      if (exists) {
        existingTables.push(table);
        console.log(`   ⚠️  ${table} 已存在，将跳过`);
      } else {
        console.log(`   ✅ ${table} 不存在，将创建`);
      }
    }

    if (existingTables.length === newTables.length) {
      console.log('\n✅ 所有新表都已存在，无需迁移');
      return;
    }

    // 读取 SQL 文件
    const sqlPath = join(process.cwd(), 'drizzle', 'pg', 'add_new_tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // 分割 SQL 语句
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(
        (s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('DO $$')
      );

    console.log('\n📝 执行迁移...');
    let created = 0;
    let skipped = 0;

    for (const statement of statements) {
      // 检查是否是 CREATE TABLE 语句
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        // 提取表名
        const match = statement.match(
          /CREATE TABLE (?:IF NOT EXISTS )?"?(\w+)"?/i
        );
        if (match) {
          const tableName = match[1];
          if (existingTables.includes(tableName)) {
            console.log(`   ⏭️  跳过 ${tableName} (已存在)`);
            skipped++;
            continue;
          }
        }
      }

      try {
        await client.query(statement);
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const match = statement.match(
            /CREATE TABLE (?:IF NOT EXISTS )?"?(\w+)"?/i
          );
          if (match) {
            console.log(`   ✅ 创建表: ${match[1]}`);
            created++;
          }
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          const match = statement.match(
            /CREATE INDEX (?:IF NOT EXISTS )?"?(\w+)"?/i
          );
          if (match) {
            console.log(`   ✅ 创建索引: ${match[1]}`);
          }
        }
      } catch (error: any) {
        // 忽略 "already exists" 错误
        if (
          error.message.includes('already exists') ||
          error.code === '42P07'
        ) {
          console.log(`   ⏭️  已存在，跳过`);
          skipped++;
        } else {
          console.error(`   ❌ 错误: ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`\n✅ 迁移完成！`);
    console.log(`   创建: ${created} 个表`);
    console.log(`   跳过: ${skipped} 个已存在的对象`);
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

executeSafeMigration()
  .then(() => {
    console.log('\n🎉 所有操作完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 发生错误:', error);
    process.exit(1);
  });
