import { db } from '../src/db';
import { users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPermissions } from '../src/lib/server-permissions';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function testPermissionsAPI() {
  console.log('=== 测试权限API ===\n');

  // 查找admin用户
  const adminUser = await db
    .select()
    .from(users)
    .where(eq(users.email, 'admin@example.com'))
    .limit(1);

  if (!adminUser.length) {
    console.error('❌ 未找到admin@example.com用户');
    process.exit(1);
  }

  const user = adminUser[0];
  console.log('1. 用户信息:');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Username:', user.username);
  console.log('   RoleId:', user.roleId);
  console.log('   isSuperAdmin:', user.isSuperAdmin);

  // 获取用户权限
  console.log('\n2. 获取用户权限:');
  const permissions = await getUserPermissions(user.id);
  
  console.log('   权限总数:', permissions.length);
  
  if (permissions.length === 0) {
    console.error('   ❌ 权限列表为空！');
    process.exit(1);
  }

  console.log('\n3. 权限列表:');
  
  // 按类别分组
  const accountPerms = permissions.filter(p => p.startsWith('account'));
  const systemPerms = permissions.filter(p => p.startsWith('system'));
  
  console.log('\n   账号管理权限 (' + accountPerms.length + '):');
  accountPerms.forEach(p => console.log('      -', p));
  
  console.log('\n   系统管理权限 (' + systemPerms.length + '):');
  systemPerms.forEach(p => console.log('      -', p));

  // 检查关键权限
  console.log('\n4. 关键权限检查:');
  const requiredPerms = [
    'account.user.read',
    'account.role.read',
    'account.permission.read',
    'system.log.read'
  ];

  let allPresent = true;
  requiredPerms.forEach(perm => {
    const present = permissions.includes(perm);
    console.log(`   ${present ? '✓' : '✗'} ${perm}`);
    if (!present) allPresent = false;
  });

  if (allPresent) {
    console.log('\n✅ 所有关键权限都存在！');
  } else {
    console.log('\n❌ 缺少某些关键权限！');
    process.exit(1);
  }

  console.log('\n=== 测试完成 ===');
  process.exit(0);
}

testPermissionsAPI();
