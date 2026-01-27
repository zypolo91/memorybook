import { db } from '../src/db';
import { users, roles, rolePermissions, permissions } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { surperAdmin } from '../src/config/surper-admin';
import { getDatabaseDialect } from '../src/db/dialect';

dotenv.config({ path: '.env.local' });
dotenv.config();

const dialect = getDatabaseDialect();

async function initSuperAdminRole() {
  console.log('开始初始化超级管理员角色...');

  const roleExists = await db
    .select()
    .from(roles)
    .where(eq(roles.name, '超级管理员'));

  if (roleExists.length === 0) {
    const [superAdminRole] = await (dialect === 'postgres'
      ? db
          .insert(roles)
          .values({
            name: '超级管理员',
            description: '系统超级管理员，拥有所有权限',
            isSuper: true
          })
          .returning({ id: roles.id })
      : db
          .insert(roles)
          .values({
            name: '超级管理员',
            description: '系统超级管理员，拥有所有权限',
            isSuper: true
          })
          .$returningId());

    // 删除现有权限（如果存在）
    await db.delete(permissions);

    // 初始化基础权限
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

    // 逐个插入权限并收集ID
    const insertedPermissionIds = [];
    for (const permission of permissionList) {
      const [result] = await (dialect === 'postgres'
        ? db
            .insert(permissions)
            .values(permission)
            .returning({ id: permissions.id })
        : db.insert(permissions).values(permission).$returningId());
      insertedPermissionIds.push({ id: result.id });
    }

    // 创建角色-权限关联
    await db.insert(rolePermissions).values(
      insertedPermissionIds.map((permission) => ({
        roleId: superAdminRole.id,
        permissionId: permission.id
      }))
    );

    console.log('超级管理员角色创建成功！');
    return superAdminRole;
  } else {
    console.log('超级管理员角色已存在');
    return roleExists[0];
  }
}

async function initSuperAdminUser(roleId: number) {
  console.log('开始初始化超级管理员账号...');

  const adminPassword = surperAdmin.password;
  const saltRounds = Number(process.env.SALT_ROUNDS || 12);
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const adminExists = await db
    .select()
    .from(users)
    .where(eq(users.email, surperAdmin.email));

  if (adminExists.length > 0) {
    console.log('超级管理员账号已存在');
    return;
  }

  await db.insert(users).values({
    email: surperAdmin.email,
    username: surperAdmin.username,
    password: hashedPassword,
    avatar: '/avatars/admin.jpg',
    roleId,
    status: 'active',
    isSuperAdmin: true
  });

  console.log('超级管理员账号创建成功！');
  console.log('邮箱: ' + surperAdmin.email);
  console.log('用户名: ' + surperAdmin.username);
  console.log('请使用环境变量中配置的密码登录');
}

async function main() {
  try {
    console.log('开始初始化系统...');
    const superAdminRole = await initSuperAdminRole();
    await initSuperAdminUser(superAdminRole.id);
    console.log('系统初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

main();
