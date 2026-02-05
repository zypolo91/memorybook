/**
 * 数据访问权限控制
 *
 * 权限规则：
 * 1. 私有数据：只有创建者可以访问（相册、个人设置等）
 * 2. 家属圈共享数据：同一家属圈的成员可以访问（记忆、病例等）
 * 3. 公开数据：所有人可以访问（健康指南等）
 */

import { db } from '@/db';
import { familyMembers, familyCircles, patients, memories } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * 数据访问类型
 */
export enum DataAccessType {
  /** 私有 - 只有创建者可访问 */
  PRIVATE = 'private',
  /** 家属圈共享 - 同一家属圈成员可访问 */
  FAMILY_SHARED = 'family_shared',
  /** 公开 - 所有人可访问 */
  PUBLIC = 'public'
}

/**
 * 获取用户所属的所有家属圈ID
 */
export async function getUserFamilyCircleIds(
  userId: number
): Promise<number[]> {
  const memberRecords = await db
    .select({ circleId: familyMembers.circleId })
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId));

  return memberRecords.map((r: { circleId: number }) => r.circleId);
}

/**
 * 获取用户在家属圈中可访问的所有用户ID（包括自己）
 * 用于查询家属圈共享的记忆等数据
 */
export async function getFamilyAccessibleUserIds(
  userId: number
): Promise<number[]> {
  // 获取用户所属的家属圈
  const circleIds = await getUserFamilyCircleIds(userId);

  if (circleIds.length === 0) {
    return [userId]; // 没有家属圈，只能访问自己的数据
  }

  // 获取这些家属圈中的所有成员
  const members = await db
    .select({ userId: familyMembers.userId })
    .from(familyMembers)
    .where(inArray(familyMembers.circleId, circleIds));

  const userIds = new Set(members.map((m: { userId: number }) => m.userId));
  userIds.add(userId); // 确保包含自己

  return Array.from(userIds) as number[];
}

/**
 * 获取用户可访问的所有患者ID
 */
export async function getAccessiblePatientIds(
  userId: number
): Promise<number[]> {
  const circleIds = await getUserFamilyCircleIds(userId);

  if (circleIds.length === 0) {
    return [];
  }

  const patientList = await db
    .select({ id: patients.id })
    .from(patients)
    .where(inArray(patients.circleId, circleIds));

  return patientList.map((p: { id: number }) => p.id);
}

/**
 * 检查用户是否有权限访问指定的记忆
 *
 * 记忆访问规则：
 * 1. 创建者可以访问
 * 2. 同一家属圈的成员可以访问（如果记忆所有者也在该家属圈）
 */
export async function canAccessMemory(
  userId: number,
  memoryId: number
): Promise<boolean> {
  // 获取记忆信息
  const [memory] = await db
    .select({ userId: memories.userId, isPublic: memories.isPublic })
    .from(memories)
    .where(eq(memories.id, memoryId));

  if (!memory) return false;

  // 创建者可以访问
  if (memory.userId === userId) return true;

  // 公开记忆所有人可以访问
  if (memory.isPublic) return true;

  // 检查是否在同一家属圈
  const accessibleUserIds = await getFamilyAccessibleUserIds(userId);
  return accessibleUserIds.includes(memory.userId);
}

/**
 * 检查用户是否有权限访问指定的患者数据
 */
export async function canAccessPatient(
  userId: number,
  patientId: number
): Promise<boolean> {
  const accessiblePatientIds = await getAccessiblePatientIds(userId);
  return accessiblePatientIds.includes(patientId);
}

/**
 * 检查用户是否是家属圈成员
 */
export async function isFamilyCircleMember(
  userId: number,
  circleId: number
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.userId, userId),
        eq(familyMembers.circleId, circleId)
      )
    );

  return !!member;
}

/**
 * 检查用户是否是家属圈管理员
 */
export async function isFamilyCircleAdmin(
  userId: number,
  circleId: number
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.userId, userId),
        eq(familyMembers.circleId, circleId),
        eq(familyMembers.role, 'admin')
      )
    );

  return !!member;
}

/**
 * 获取数据访问上下文
 * 用于API中快速获取用户的访问权限信息
 */
export async function getDataAccessContext(userId: number) {
  const [circleIds, accessibleUserIds, accessiblePatientIds] =
    await Promise.all([
      getUserFamilyCircleIds(userId),
      getFamilyAccessibleUserIds(userId),
      getAccessiblePatientIds(userId)
    ]);

  return {
    userId,
    circleIds,
    accessibleUserIds,
    accessiblePatientIds,
    /** 检查是否可以访问指定用户的数据 */
    canAccessUser: (targetUserId: number) =>
      accessibleUserIds.includes(targetUserId),
    /** 检查是否可以访问指定患者的数据 */
    canAccessPatient: (targetPatientId: number) =>
      accessiblePatientIds.includes(targetPatientId)
  };
}
