/**
 * 地理围栏 API
 * 管理安全区域的增删改查
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { geofences } from '@/db/schema.memorybook';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// POST - 创建围栏
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
      name,
      description,
      centerLat,
      centerLng,
      radius,
      address,
      patientId,
      alertOnExit = true,
      alertOnEnter = false
    } = body;

    if (!name || !centerLat || !centerLng || !radius) {
      return NextResponse.json(
        { code: 400, message: '名称、中心点和半径不能为空' },
        { status: 400 }
      );
    }

    const [fence] = await db
      .insert(geofences)
      .values({
        userId: user.id,
        name,
        description,
        centerLat,
        centerLng,
        radius,
        address,
        patientId: patientId ? parseInt(patientId) : null,
        alertOnExit,
        alertOnEnter
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: fence
    });
  } catch (error) {
    console.error('POST /api/location/geofence error:', error);
    return NextResponse.json(
      { code: 500, message: '创建围栏失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新围栏
export async function PUT(request: NextRequest) {
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
      id,
      name,
      description,
      centerLat,
      centerLng,
      radius,
      address,
      isActive,
      alertOnExit,
      alertOnEnter
    } = body;

    if (!id) {
      return NextResponse.json(
        { code: 400, message: '围栏ID不能为空' },
        { status: 400 }
      );
    }

    const [fence] = await db
      .update(geofences)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(centerLat !== undefined && { centerLat }),
        ...(centerLng !== undefined && { centerLng }),
        ...(radius !== undefined && { radius }),
        ...(address !== undefined && { address }),
        ...(isActive !== undefined && { isActive }),
        ...(alertOnExit !== undefined && { alertOnExit }),
        ...(alertOnEnter !== undefined && { alertOnEnter }),
        updatedAt: new Date()
      })
      .where(and(eq(geofences.id, id), eq(geofences.userId, user.id)))
      .returning();

    if (!fence) {
      return NextResponse.json(
        { code: 404, message: '围栏不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: fence
    });
  } catch (error) {
    console.error('PUT /api/location/geofence error:', error);
    return NextResponse.json(
      { code: 500, message: '更新围栏失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除围栏
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { code: 400, message: '围栏ID不能为空' },
        { status: 400 }
      );
    }

    await db
      .delete(geofences)
      .where(
        and(eq(geofences.id, parseInt(id)), eq(geofences.userId, user.id))
      );

    return NextResponse.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('DELETE /api/location/geofence error:', error);
    return NextResponse.json(
      { code: 500, message: '删除围栏失败' },
      { status: 500 }
    );
  }
}
