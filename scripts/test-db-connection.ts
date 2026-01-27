import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function testConnection() {
  console.log('测试数据库连接...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000
  });

  try {
    const client = await pool.connect();
    console.log('✓ 数据库连接成功！');

    // 测试查询
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log('✓ 用户表查询成功，用户数:', result.rows[0].count);

    const permsResult = await client.query('SELECT COUNT(*) FROM permissions');
    console.log('✓ 权限表查询成功，权限数:', permsResult.rows[0].count);

    const rolesResult = await client.query('SELECT COUNT(*) FROM roles');
    console.log('✓ 角色表查询成功，角色数:', rolesResult.rows[0].count);

    // 检查admin用户
    const adminResult = await client.query(
      "SELECT id, email, username, \"isSuperAdmin\" FROM users WHERE email = 'admin@example.com'"
    );
    
    if (adminResult.rows.length > 0) {
      console.log('\n✓ 超级管理员用户:');
      console.log('  ID:', adminResult.rows[0].id);
      console.log('  Email:', adminResult.rows[0].email);
      console.log('  Username:', adminResult.rows[0].username);
      console.log('  isSuperAdmin:', adminResult.rows[0].isSuperAdmin);
    } else {
      console.log('\n✗ 未找到admin@example.com用户');
    }

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ 数据库连接失败:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
