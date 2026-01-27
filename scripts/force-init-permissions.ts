import { db } from '../src/db';
import { roles, rolePermissions, permissions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

async function forceInitPermissions() {
  console.log('=== 强制重新初始化权限系统 ===\n');

  try {
    // 1. 查找超级管理员角色
    const superRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, '超级管理员'))
      .limit(1);

    if (!superRole.length) {
      console.error('❌ 未找到超级管理员角色，请先运行 init:admin');
      process.exit(1);
    }

    const roleId = superRole[0].id;
    console.log('✓ 找到超级管理员角色，ID:', roleId);

    // 2. 删除所有现有权限关联
    console.log('\n清理现有数据...');
    await db.delete(rolePermissions);
    console.log('✓ 已删除所有角色权限关联');

    // 3. 删除所有现有权限
    await db.delete(permissions);
    console.log('✓ 已删除所有权限');

    // 4. 插入完整的权限列表
    console.log('\n开始插入权限...');
    const permissionList = [
      // 账号管理
      {
        id: 1,
        name: '账号管理',
        code: 'account',
        description: '账号管理相关权限',
        parentId: null,
        sortOrder: 100
      },
      {
        id: 11,
        name: '用户管理',
        code: 'account.user',
        description: '用户管理权限',
        parentId: 1,
        sortOrder: 110
      },
      {
        id: 111,
        name: '查看用户',
        code: 'account.user.read',
        description: '查看用户列表和详情',
        parentId: 11,
        sortOrder: 111
      },
      {
        id: 112,
        name: '新增用户',
        code: 'account.user.create',
        description: '创建新用户',
        parentId: 11,
        sortOrder: 112
      },
      {
        id: 113,
        name: '编辑用户',
        code: 'account.user.update',
        description: '编辑用户信息',
        parentId: 11,
        sortOrder: 113
      },
      {
        id: 114,
        name: '删除用户',
        code: 'account.user.delete',
        description: '删除用户',
        parentId: 11,
        sortOrder: 114
      },
      {
        id: 12,
        name: '角色管理',
        code: 'account.role',
        description: '角色管理权限',
        parentId: 1,
        sortOrder: 120
      },
      {
        id: 121,
        name: '查看角色',
        code: 'account.role.read',
        description: '查看角色列表和详情',
        parentId: 12,
        sortOrder: 121
      },
      {
        id: 122,
        name: '新增角色',
        code: 'account.role.create',
        description: '创建新角色',
        parentId: 12,
        sortOrder: 122
      },
      {
        id: 123,
        name: '编辑角色',
        code: 'account.role.update',
        description: '编辑角色信息',
        parentId: 12,
        sortOrder: 123
      },
      {
        id: 124,
        name: '删除角色',
        code: 'account.role.delete',
        description: '删除角色',
        parentId: 12,
        sortOrder: 124
      },
      {
        id: 125,
        name: '分配权限',
        code: 'account.role.assign',
        description: '给角色分配权限',
        parentId: 12,
        sortOrder: 125
      },
      {
        id: 13,
        name: '权限管理',
        code: 'account.permission',
        description: '权限管理权限',
        parentId: 1,
        sortOrder: 130
      },
      {
        id: 131,
        name: '查看权限',
        code: 'account.permission.read',
        description: '查看权限列表和详情',
        parentId: 13,
        sortOrder: 131
      },
      {
        id: 132,
        name: '新增权限',
        code: 'account.permission.create',
        description: '创建新权限',
        parentId: 13,
        sortOrder: 132
      },
      {
        id: 133,
        name: '编辑权限',
        code: 'account.permission.update',
        description: '编辑权限信息',
        parentId: 13,
        sortOrder: 133
      },
      {
        id: 134,
        name: '删除权限',
        code: 'account.permission.delete',
        description: '删除权限',
        parentId: 13,
        sortOrder: 134
      },
      // 系统管理
      {
        id: 2,
        name: '系统管理',
        code: 'system',
        description: '系统管理权限',
        parentId: null,
        sortOrder: 200
      },
      {
        id: 21,
        name: '日志管理',
        code: 'system.log',
        description: '日志管理权限',
        parentId: 2,
        sortOrder: 210
      },
      {
        id: 211,
        name: '查看日志',
        code: 'system.log.read',
        description: '查看日志列表和详情',
        parentId: 21,
        sortOrder: 211
      },
      {
        id: 212,
        name: '新增日志',
        code: 'system.log.create',
        description: '创建新日志',
        parentId: 21,
        sortOrder: 212
      },
      {
        id: 213,
        name: '编辑日志',
        code: 'system.log.update',
        description: '编辑日志信息',
        parentId: 21,
        sortOrder: 213
      },
      {
        id: 214,
        name: '删除日志',
        code: 'system.log.delete',
        description: '删除日志',
        parentId: 21,
        sortOrder: 214
      }
    ];

    // 逐个插入权限
    const insertedPermissionIds = [];
    for (const permission of permissionList) {
      const [result] = await (dialect === 'postgres'
        ? db.insert(permissions).values(permission).returning({ id: permissions.id })
        : db.insert(permissions).values(permission).$returningId());
      insertedPermissionIds.push({ id: result.id });
      console.log(`  ✓ [${result.id}] ${permission.code}`);
    }

    console.log(`\n✓ 成功插入 ${insertedPermissionIds.length} 个权限`);

    // 5. 创建角色-权限关联
    console.log('\n创建角色权限关联...');
    await db.insert(rolePermissions).values(
      insertedPermissionIds.map((permission) => ({
        roleId: roleId,
        permissionId: permission.id
      }))
    );

    console.log(`✓ 成功创建 ${insertedPermissionIds.length} 个权限关联`);

    // 6. 验证结果
    console.log('\n验证结果...');
    const finalPerms = await db.select().from(permissions);
    const finalRolePerms = await db.select().from(rolePermissions);

    console.log(`✓ permissions 表: ${finalPerms.length} 条记录`);
    console.log(`✓ role_permissions 表: ${finalRolePerms.length} 条记录`);

    if (finalPerms.length === 19 && finalRolePerms.length === 19) {
      console.log('\n✅ 权限系统初始化成功！');
    } else {
      console.log('\n⚠️  数据数量不符合预期');
      console.log('   期望: permissions=19, role_permissions=19');
      console.log(`   实际: permissions=${finalPerms.length}, role_permissions=${finalRolePerms.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  }
}

forceInitPermissions();
