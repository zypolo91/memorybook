import { db } from '../src/db';
import { users, roles, permissions, rolePermissions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function verifyPermissions() {
  console.log('=== 验证权限数据 ===\n');

  // 检查超级管理员用户
  const adminUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@example.com'))
    .limit(1);

  console.log('1. 超级管理员用户:');
  if (adminUser.length > 0) {
    console.log('   ✓ 用户ID:', adminUser[0].id);
    console.log('   ✓ 邮箱:', adminUser[0].email);
    console.log('   ✓ 用户名:', adminUser[0].username);
    console.log('   ✓ 角色ID:', adminUser[0].roleId);
    console.log('   ✓ isSuperAdmin:', adminUser[0].isSuperAdmin);
  } else {
    console.log('   ✗ 未找到超级管理员用户');
    process.exit(1);
  }

  // 检查超级管理员角色
  const superRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, '超级管理员'))
    .limit(1);

  console.log('\n2. 超级管理员角色:');
  if (superRole.length > 0) {
    console.log('   ✓ 角色ID:', superRole[0].id);
    console.log('   ✓ 角色名:', superRole[0].name);
    console.log('   ✓ isSuper:', superRole[0].isSuper);
  } else {
    console.log('   ✗ 未找到超级管理员角色');
    process.exit(1);
  }

  // 检查权限总数
  const allPermissions = await db.select().from(permissions);
  console.log('\n3. 权限统计:');
  console.log('   总权限数:', allPermissions.length);

  // 按code分组统计
  const accountPerms = allPermissions.filter((p: any) =>
    p.code.startsWith('account')
  );
  const systemPerms = allPermissions.filter((p: any) =>
    p.code.startsWith('system')
  );

  console.log('   - 账号管理权限:', accountPerms.length);
  console.log('   - 系统管理权限:', systemPerms.length);

  // 列出所有权限
  console.log('\n4. 权限列表:');
  console.log('\n   账号管理 (account):');
  accountPerms.forEach((perm: any) => {
    const indent = '      '.repeat((perm.code.match(/\./g) || []).length);
    console.log(`   ${indent}- [${perm.id}] ${perm.code}: ${perm.name}`);
  });

  console.log('\n   系统管理 (system):');
  systemPerms.forEach((perm: any) => {
    const indent = '      '.repeat((perm.code.match(/\./g) || []).length);
    console.log(`   ${indent}- [${perm.id}] ${perm.code}: ${perm.name}`);
  });

  // 检查角色权限关联
  if (superRole.length > 0) {
    const rolePerms = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, superRole[0].id));

    console.log('\n5. 超级管理员角色的权限关联:');
    console.log('   已分配权限数:', rolePerms.length);

    if (rolePerms.length !== allPermissions.length) {
      console.log(
        '   ⚠ 警告: 权限关联数量与权限总数不匹配!'
      );
      console.log('   权限总数:', allPermissions.length);
      console.log('   关联数量:', rolePerms.length);
    } else {
      console.log('   ✓ 所有权限已正确关联');
    }
  }

  console.log('\n=== 验证完成 ===');
  process.exit(0);
}

verifyPermissions();
