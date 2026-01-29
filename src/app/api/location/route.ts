/**
 * 位置监控 API
 * 管理阿尔茨海默患者的实时位置和地理围栏
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  locationRecords,
  geofences,
  geofenceAlerts,
  locationPermissions
} from '@/db/schema.memorybook';
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
      case 'geofences':
        // 获取围栏列表
        return await getGeofences(user.id, patientId);
      case 'alerts':
        // 获取报警列表
        return await getAlerts(user.id, pageSize, offset);
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

    // 检查是否触发围栏报警
    const alerts = await checkGeofenceAlerts(
      user.id,
      patientId,
      latitude,
      longitude,
      address
    );

    return NextResponse.json({
      code: 0,
      message: '上报成功',
      data: {
        record,
        alerts
      }
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

// 获取围栏列表
async function getGeofences(userId: number, patientId: string | null) {
  const conditions = [eq(geofences.userId, userId)];
  if (patientId) {
    conditions.push(eq(geofences.patientId, parseInt(patientId)));
  }

  const list = await db
    .select()
    .from(geofences)
    .where(and(...conditions))
    .orderBy(desc(geofences.createdAt));

  return NextResponse.json({
    code: 0,
    data: list
  });
}

// 获取报警列表
async function getAlerts(userId: number, limit: number, offset: number) {
  const list = await db
    .select()
    .from(geofenceAlerts)
    .where(eq(geofenceAlerts.userId, userId))
    .orderBy(desc(geofenceAlerts.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(geofenceAlerts)
    .where(eq(geofenceAlerts.userId, userId));

  // 获取未读数量
  const [{ unread }] = await db
    .select({ unread: sql<number>`count(*)` })
    .from(geofenceAlerts)
    .where(
      and(eq(geofenceAlerts.userId, userId), eq(geofenceAlerts.isRead, false))
    );

  return NextResponse.json({
    code: 0,
    data: {
      list,
      total: Number(count),
      unread: Number(unread)
    }
  });
}

// 检查围栏报警
async function checkGeofenceAlerts(
  userId: number,
  patientId: string | number | null,
  latitude: number,
  longitude: number,
  address?: string
) {
  const alerts: any[] = [];

  // 获取活跃的围栏
  const activeGeofences = await db
    .select()
    .from(geofences)
    .where(and(eq(geofences.userId, userId), eq(geofences.isActive, true)));

  for (const fence of activeGeofences) {
    // 计算距离
    const distance = calculateDistance(
      latitude,
      longitude,
      fence.centerLat,
      fence.centerLng
    );

    const isInside = distance <= fence.radius;

    // 检查是否需要报警
    if (!isInside && fence.alertOnExit) {
      // 离开围栏，触发报警
      const [alert] = await db
        .insert(geofenceAlerts)
        .values({
          userId,
          geofenceId: fence.id,
          patientId: patientId
            ? typeof patientId === 'string'
              ? parseInt(patientId)
              : patientId
            : null,
          alertType: 'exit',
          latitude,
          longitude,
          address
        })
        .returning();
      alerts.push(alert);
    } else if (isInside && fence.alertOnEnter) {
      // 进入围栏，触发报警
      const [alert] = await db
        .insert(geofenceAlerts)
        .values({
          userId,
          geofenceId: fence.id,
          patientId: patientId
            ? typeof patientId === 'string'
              ? parseInt(patientId)
              : patientId
            : null,
          alertType: 'enter',
          latitude,
          longitude,
          address
        })
        .returning();
      alerts.push(alert);
    }
  }

  return alerts;
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

// 计算两点之间的距离（米）
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // 地球半径（米）
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
