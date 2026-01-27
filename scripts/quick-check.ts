import { db } from '../src/db';
import { users, roles, permissions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function quickCheck() {
  try {
    // 检查用户
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@example.com'))
      .limit(1);

    console.log('用户:', adminUser.length > 0 ? '✓ 存在' : '✗ 不存在');
    if (adminUser.length > 0) {
      console.log('  isSuperAdmin:', adminUser[0].isSuperAdmin);
    }

    // 检查角色
    const superRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, '超级管理员'))
      .limit(1);

    console.log('角色:', superRole.length > 0 ? '✓ 存在' : '✗ 不存在');

    // 检查权限
    const allPerms = await db.select().from(permissions);
    console.log('权限数量:', allPerms.length);

    if (allPerms.length >= 19) {
      console.log('\n✅ 权限系统初始化成功！');
    } else {
      console.log('\n❌ 权限数量不足，期望19个，实际', allPerms.length);
    }

    process.exit(0);
  } catch (error) {
    console.error('检查失败:', error);
    process.exit(1);
  }
}

quickCheck();
