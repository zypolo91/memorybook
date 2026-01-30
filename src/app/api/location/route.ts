/**
 * 位置监控 API
 * 管理用户的实时位置
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locationRecords, locationPermissions } from '@/db/schema.memorybook';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取位置记录列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'latest'; // latest, history, geofences, alerts
    const patientId = searchParams.get('patientId');
    const targetUserId = searchParams.get('targetUserId'); // 查看其他用户的位置
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const offset = (page - 1) * pageSize;

    // 如果要查看其他用户的位置，需要验证权限
    let queryUserId = user.id;
    if (targetUserId && parseInt(targetUserId) !== user.id) {
      const hasPermission = await checkViewPermission(
        user.id,
        parseInt(targetUserId)
      );
      if (!hasPermission) {
        return NextResponse.json(
          { code: 403, message: '没有查看该用户位置的权限' },
          { status: 403 }
        );
      }
      queryUserId = parseInt(targetUserId);
    }

    switch (type) {
      case 'latest':
        // 获取最新位置
        return await getLatestLocation(queryUserId, patientId);
      case 'history':
        // 获取历史轨迹
        return await getLocationHistory(
          queryUserId,
          patientId,
          startDate,
          endDate,
          pageSize,
          offset
        );
      default:
        return NextResponse.json(
          { code: 400, message: '无效的类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET /api/location error:', error);
    return NextResponse.json(
      { code: 500, message: '获取位置信息失败' },
      { status: 500 }
    );
  }
}

// POST - 上报位置
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      address,
      patientId,
      deviceInfo
    } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { code: 400, message: '经纬度不能为空' },
        { status: 400 }
      );
    }

    // 保存位置记录
    const [record] = await db
      .insert(locationRecords)
      .values({
        userId: user.id,
        patientId: patientId ? parseInt(patientId) : null,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        address,
        recordedAt: new Date(),
        deviceInfo
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '上报成功',
      data: record
    });
  } catch (error) {
    console.error('POST /api/location error:', error);
    return NextResponse.json(
      { code: 500, message: '上报位置失败' },
      { status: 500 }
    );
  }
}

// 获取最新位置
async function getLatestLocation(userId: number, patientId: string | null) {
  const conditions = [eq(locationRecords.userId, userId)];
  if (patientId) {
    conditions.push(eq(locationRecords.patientId, parseInt(patientId)));
  }

  const [latest] = await db
    .select()
    .from(locationRecords)
    .where(and(...conditions))
    .orderBy(desc(locationRecords.recordedAt))
    .limit(1);

  return NextResponse.json({
    code: 0,
    data: latest || null
  });
}

// 获取历史轨迹
async function getLocationHistory(
  userId: number,
  patientId: string | null,
  startDate: string | null,
  endDate: string | null,
  limit: number,
  offset: number
) {
  const conditions = [eq(locationRecords.userId, userId)];
  if (patientId) {
    conditions.push(eq(locationRecords.patientId, parseInt(patientId)));
  }
  if (startDate) {
    conditions.push(gte(locationRecords.recordedAt, new Date(startDate)));
  }
  if (endDate) {
    conditions.push(lte(locationRecords.recordedAt, new Date(endDate)));
  }

  const records = await db
    .select()
    .from(locationRecords)
    .where(and(...conditions))
    .orderBy(desc(locationRecords.recordedAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(locationRecords)
    .where(and(...conditions));

  return NextResponse.json({
    code: 0,
    data: {
      list: records,
      total: Number(count)
    }
  });
}

// 检查是否有查看权限
async function checkViewPermission(
  viewerId: number,
  ownerId: number
): Promise<boolean> {
  const [permission] = await db
    .select()
    .from(locationPermissions)
    .where(
      and(
        eq(locationPermissions.ownerId, ownerId),
        eq(locationPermissions.viewerId, viewerId),
        eq(locationPermissions.isActive, true),
        eq(locationPermissions.canViewRealtime, true)
      )
    )
    .limit(1);

  return !!permission;
}
