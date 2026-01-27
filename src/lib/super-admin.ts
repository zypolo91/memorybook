import { db } from '@/db';
import { users, roles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function isSuperAdmin(userId: number) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return (user.length && user[0]?.isSuperAdmin) ?? false;
}

export async function preventSuperAdminModification(userId: number) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user.length && user[0]?.isSuperAdmin) {
    throw new Error('超级管理员不能被修改或删除');
  }
}

export async function preventSuperAdminDisable(
  userId: number,
  newStatus: string
) {
  if (newStatus === 'disabled') {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (user.length && user[0]?.isSuperAdmin) {
      throw new Error('超级管理员不能被禁用');
    }
  }
}

export async function preventSuperRoleModification(roleId: number) {
  const role = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);
  if (role.length && role[0]?.isSuper) {
    throw new Error('超级管理员角色不能被修改或删除');
  }
}
