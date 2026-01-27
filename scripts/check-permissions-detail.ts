import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function checkPermissionsDetail() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // 获取所有权限
    const result = await client.query(`
      SELECT id, code, name, "parentId", "sortOrder"
      FROM permissions
      ORDER BY id
    `);
    
    console.log('=== 数据库中的所有权限 ===\n');
    console.log('总数:', result.rows.length);
    console.log('\n权限列表:');
    
    result.rows.forEach((row: any) => {
      const indent = '  '.repeat((row.code.match(/\./g) || []).length);
      console.log(`${indent}[${row.id}] ${row.code} - ${row.name}`);
    });
    
    // 检查核心权限
    console.log('\n=== 核心权限检查 ===');
    const requiredPerms = [
      'account.user.read',
      'account.role.read',
      'account.permission.read',
      'system.log.read'
    ];
    
    let allPresent = true;
    for (const perm of requiredPerms) {
      const found = result.rows.find((r: any) => r.code === perm);
      if (found) {
        console.log(`✓ ${perm}`);
      } else {
        console.log(`✗ ${perm} - 缺失！`);
        allPresent = false;
      }
    }
    
    if (allPresent) {
      console.log('\n✅ 所有核心权限都存在，系统应该可以正常工作');
      console.log('\n下一步：');
      console.log('1. 清除浏览器缓存');
      console.log('2. 使用 admin@example.com / Admin@123456 登录');
      console.log('3. 检查是否能看到"账户管理"和"系统管理"菜单');
    } else {
      console.log('\n❌ 缺少核心权限，需要重新初始化');
    }
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    await pool.end();
    process.exit(1);
  }
}

checkPermissionsDetail();
