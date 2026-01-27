import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function verifyFinal() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // 检查权限数量
    const permsResult = await client.query('SELECT COUNT(*) FROM permissions');
    const permsCount = parseInt(permsResult.rows[0].count);
    
    // 检查角色权限关联数量
    const rolePermsResult = await client.query('SELECT COUNT(*) FROM role_permissions');
    const rolePermsCount = parseInt(rolePermsResult.rows[0].count);
    
    console.log('权限数量:', permsCount);
    console.log('角色权限关联数量:', rolePermsCount);
    
    if (permsCount === 19 && rolePermsCount === 19) {
      console.log('\n✅ 权限系统初始化成功！');
      console.log('\n请执行以下步骤：');
      console.log('1. 清除浏览器缓存');
      console.log('2. 使用 admin@example.com / Admin@123456 登录');
      console.log('3. 检查侧边栏是否显示"账户管理"和"系统管理"菜单');
    } else {
      console.log('\n❌ 权限数据不完整');
      console.log('期望: permissions=19, role_permissions=19');
      console.log(`实际: permissions=${permsCount}, role_permissions=${rolePermsCount}`);
      console.log('\n请重新运行: pnpm exec tsx scripts/force-init-permissions.ts');
    }
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('验证失败:', error);
    await pool.end();
    process.exit(1);
  }
}

verifyFinal();
