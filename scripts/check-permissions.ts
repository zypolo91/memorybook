import { db } from '../src/db';
import { users, roles, permissions, rolePermissions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function checkPermissions() {
  console.log('检查权限数据...\n');

  // 检查超级管理员用户
  const adminUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@example.com'))
    .limit(1);

  console.log('=== 超级管理员用户 ===');
  if (adminUser.length > 0) {
    console.log('用户ID:', adminUser[0].id);
    console.log('邮箱:', adminUser[0].email);
    console.log('用户名:', adminUser[0].username);
    console.log('角色ID:', adminUser[0].roleId);
    console.log('isSuperAdmin:', adminUser[0].isSuperAdmin);
  } else {
    console.log('❌ 未找到超级管理员用户');
  }

  // 检查超级管理员角色
  const superRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, '超级管理员'))
    .limit(1);

  console.log('\n=== 超级管理员角色 ===');
  if (superRole.length > 0) {
    console.log('角色ID:', superRole[0].id);
    console.log('角色名:', superRole[0].name);
    console.log('isSuper:', superRole[0].isSuper);
  } else {
    console.log('❌ 未找到超级管理员角色');
  }

  // 检查权限总数
  const allPermissions = await db.select().from(permissions);
  console.log('\n=== 权限统计 ===');
  console.log('总权限数:', allPermissions.length);

  // 列出所有权限
  console.log('\n=== 权限列表 ===');
  allPermissions.forEach((perm: any) => {
    console.log(`- ${perm.code}: ${perm.name}`);
  });

  // 检查角色权限关联
  if (superRole.length > 0) {
    const rolePerms = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, superRole[0].id));

    console.log('\n=== 超级管理员角色的权限 ===');
    console.log('已分配权限数:', rolePerms.length);
  }

  process.exit(0);
}

checkPermissions();
