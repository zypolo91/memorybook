/**
 * 表结构恢复脚本
 * 恢复所有被删除的表结构（包括原有表和新表）
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

async function restoreTables() {
  const client = await pool.connect();

  try {
    console.log('🚀 开始恢复表结构...\n');

    // 读取 SQL 文件
    const sqlPath = join(
      process.cwd(),
      'drizzle',
      'pg',
      'restore_all_tables.sql'
    );
    const sql = readFileSync(sqlPath, 'utf-8');

    // 执行 SQL
    console.log('📝 执行 SQL 脚本...\n');
    await client.query(sql);

    // 验证表是否创建成功
    console.log('\n🔍 验证表结构...\n');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = result.rows.map((r: any) => r.table_name);

    console.log(`✅ 成功创建 ${tables.length} 个表:\n`);
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = countResult.rows[0].count;
      console.log(`   - ${table} (${count} 条记录)`);
    }

    // 检查关键表
    const requiredTables = [
      'memories',
      'memory_media',
      'tags',
      'memory_tags',
      'albums',
      'album_memories',
      'family_circles',
      'family_members',
      'patients',
      'memory_comments',
      'memory_likes',
      'memory_favorites',
      'memory_reminders',
      'health_records',
      'health_guides',
      'medical_categories',
      'medical_records',
      'medical_tags',
      'medical_record_tags',
      'location_records',
      'geofences',
      'geofence_alerts'
    ];

    console.log('\n📋 检查必需的表...\n');
    const missing = requiredTables.filter((t) => !tables.includes(t));
    if (missing.length > 0) {
      console.log('   ⚠️  缺失的表:');
      missing.forEach((t) => console.log(`      - ${t}`));
    } else {
      console.log('   ✅ 所有必需的表都已创建！');
    }

    console.log('\n✅ 表结构恢复完成！');
    console.log('\n💡 提示:');
    console.log('   如果有数据备份，可以使用以下命令恢复数据:');
    console.log('   psql -U postgres -d memorybook < backup_file.sql');
  } catch (error: any) {
    console.error('\n❌ 恢复失败:', error.message);
    if (error.message.includes('already exists')) {
      console.error('   💡 提示: 某些表可能已存在，这是正常的');
    }
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

restoreTables()
  .then(() => {
    console.log('\n🎉 所有操作完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 发生错误:', error);
    process.exit(1);
  });
