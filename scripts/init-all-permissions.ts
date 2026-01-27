import { db } from '../src/db';
import { roles, rolePermissions, permissions } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

async function upsertPermissionByCode(input: {
  code: string;
  name: string;
  description: string;
  parentId: number | null;
  sortOrder: number;
}): Promise<number> {
  const existing = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.code, input.code))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(permissions).values({
      name: input.name,
      code: input.code,
      description: input.description,
      parentId: input.parentId,
      sortOrder: input.sortOrder
    });
  } else {
    await db
      .update(permissions)
      .set({
        name: input.name,
        description: input.description,
        parentId: input.parentId,
        sortOrder: input.sortOrder
      })
      .where(eq(permissions.id, existing[0].id));
  }

  const row = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.code, input.code))
    .limit(1);

  return row[0].id as number;
}

async function initAllPermissions() {
  console.log('开始初始化所有权限...');

  const permissionIds: number[] = [];

  // 账户管理权限组
  const accountId = await upsertPermissionByCode({
    code: 'account',
    name: '账户管理',
    description: '账户管理权限',
    parentId: null,
    sortOrder: 100
  });

  // 用户管理权限
  const userGroupId = await upsertPermissionByCode({
    code: 'account.user',
    name: '用户管理',
    description: '用户管理权限',
    parentId: accountId,
    sortOrder: 110
  });

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.user.read',
      name: '查看用户',
      description: '查看用户列表和详情',
      parentId: userGroupId,
      sortOrder: 111
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.user.create',
      name: '创建用户',
      description: '创建新用户',
      parentId: userGroupId,
      sortOrder: 112
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.user.update',
      name: '编辑用户',
      description: '编辑用户信息',
      parentId: userGroupId,
      sortOrder: 113
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.user.delete',
      name: '删除用户',
      description: '删除用户',
      parentId: userGroupId,
      sortOrder: 114
    })
  );

  // 角色管理权限
  const roleGroupId = await upsertPermissionByCode({
    code: 'account.role',
    name: '角色管理',
    description: '角色管理权限',
    parentId: accountId,
    sortOrder: 120
  });

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.role.read',
      name: '查看角色',
      description: '查看角色列表和详情',
      parentId: roleGroupId,
      sortOrder: 121
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.role.create',
      name: '创建角色',
      description: '创建新角色',
      parentId: roleGroupId,
      sortOrder: 122
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.role.update',
      name: '编辑角色',
      description: '编辑角色信息',
      parentId: roleGroupId,
      sortOrder: 123
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.role.delete',
      name: '删除角色',
      description: '删除角色',
      parentId: roleGroupId,
      sortOrder: 124
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.role.assign',
      name: '分配角色',
      description: '为用户分配角色',
      parentId: roleGroupId,
      sortOrder: 125
    })
  );

  // 权限管理权限
  const permissionGroupId = await upsertPermissionByCode({
    code: 'account.permission',
    name: '权限管理',
    description: '权限管理权限',
    parentId: accountId,
    sortOrder: 130
  });

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.permission.read',
      name: '查看权限',
      description: '查看权限列表和详情',
      parentId: permissionGroupId,
      sortOrder: 131
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.permission.create',
      name: '创建权限',
      description: '创建新权限',
      parentId: permissionGroupId,
      sortOrder: 132
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.permission.update',
      name: '编辑权限',
      description: '编辑权限信息',
      parentId: permissionGroupId,
      sortOrder: 133
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'account.permission.delete',
      name: '删除权限',
      description: '删除权限',
      parentId: permissionGroupId,
      sortOrder: 134
    })
  );

  // 系统管理权限组
  const systemId = await upsertPermissionByCode({
    code: 'system',
    name: '系统管理',
    description: '系统管理权限',
    parentId: null,
    sortOrder: 200
  });

  // 日志管理权限
  const logGroupId = await upsertPermissionByCode({
    code: 'system.log',
    name: '日志管理',
    description: '日志管理权限',
    parentId: systemId,
    sortOrder: 210
  });

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.log.read',
      name: '查看日志',
      description: '查看系统日志',
      parentId: logGroupId,
      sortOrder: 211
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.log.delete',
      name: '删除日志',
      description: '删除系统日志',
      parentId: logGroupId,
      sortOrder: 212
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.log.export',
      name: '导出日志',
      description: '导出系统日志',
      parentId: logGroupId,
      sortOrder: 213
    })
  );

  // 文件管理权限
  const fileGroupId = await upsertPermissionByCode({
    code: 'system.file',
    name: '文件管理',
    description: '文件管理权限',
    parentId: systemId,
    sortOrder: 220
  });

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.read',
      name: '查看文件',
      description: '查看文件列表和详情',
      parentId: fileGroupId,
      sortOrder: 221
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.upload',
      name: '上传文件',
      description: '上传文件',
      parentId: fileGroupId,
      sortOrder: 222
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.delete',
      name: '删除文件',
      description: '删除文件',
      parentId: fileGroupId,
      sortOrder: 223
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.folder.create',
      name: '创建文件夹',
      description: '创建文件夹',
      parentId: fileGroupId,
      sortOrder: 224
    })
  );

  permissionIds.push(
    await upsertPermissionByCode({
      code: 'system.file.folder.delete',
      name: '删除文件夹',
      description: '删除文件夹',
      parentId: fileGroupId,
      sortOrder: 225
    })
  );

  // 修正 PG 序列
  if (dialect === 'postgres') {
    await db.execute(
      sql`select setval(pg_get_serial_sequence('permissions', 'id'), (select max(id) from permissions))`
    );
  }

  console.log('权限初始化完成');
  return permissionIds;
}

async function assignPermissionsToSuperAdmin(permissionIds: number[]) {
  console.log('为超级管理员角色分配权限...');

  const superAdminRole = await db
    .select()
    .from(roles)
    .where(eq(roles.name, '超级管理员'))
    .limit(1);

  if (!superAdminRole.length) {
    console.error('未找到超级管理员角色');
    return;
  }

  const roleId = superAdminRole[0].id;

  const existingRolePerms = await db
    .select({ permissionId: rolePermissions.permissionId })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, roleId));

  const existingSet = new Set(
    (existingRolePerms || []).map((r: any) => r.permissionId as number)
  );

  const toInsert = permissionIds
    .filter((id) => !existingSet.has(id))
    .map((permissionId) => ({ roleId, permissionId }));

  if (toInsert.length > 0) {
    await db.insert(rolePermissions).values(toInsert as any);
    console.log(`已分配 ${toInsert.length} 个权限`);
  } else {
    console.log('所有权限已分配');
  }
}

async function main() {
  try {
    console.log('开始初始化完整权限系统...');
    const permissionIds = await initAllPermissions();
    await assignPermissionsToSuperAdmin(permissionIds);
    console.log('权限系统初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

main();
