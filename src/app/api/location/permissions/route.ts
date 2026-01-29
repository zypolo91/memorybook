import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locationPermissions, users, familyMembers, familyCircles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/location/permissions - 获取位置共享权限列表
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'granted'; // granted: 我授权的, received: 我被授权的

    let permissions;
    if (type === 'granted') {
      // 我授权给别人的
      permissions = await db
        .select({
          id: locationPermissions.id,
          viewerId: locationPermissions.viewerId,
          viewerName: users.username,
          viewerAvatar: users.avatar,
          canViewRealtime: locationPermissions.canViewRealtime,
          canViewHistory: locationPermissions.canViewHistory,
          canReceiveAlerts: locationPermissions.canReceiveAlerts,
          isActive: locationPermissions.isActive,
          createdAt: locationPermissions.createdAt,
        })
        .from(locationPermissions)
        .innerJoin(users, eq(locationPermissions.viewerId, users.id))
        .where(eq(locationPermissions.ownerId, user.id));
    } else {
      // 别人授权给我的
      permissions = await db
        .select({
          id: locationPermissions.id,
          ownerId: locationPermissions.ownerId,
          ownerName: users.username,
          ownerAvatar: users.avatar,
          canViewRealtime: locationPermissions.canViewRealtime,
          canViewHistory: locationPermissions.canViewHistory,
          canReceiveAlerts: locationPermissions.canReceiveAlerts,
          isActive: locationPermissions.isActive,
          createdAt: locationPermissions.createdAt,
        })
        .from(locationPermissions)
        .innerJoin(users, eq(locationPermissions.ownerId, users.id))
        .where(and(
          eq(locationPermissions.viewerId, user.id),
          eq(locationPermissions.isActive, true)
        ));
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: permissions
    });
  } catch (error) {
    console.error('获取位置权限失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取位置权限失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/location/permissions - 创建位置共享权限
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      viewerId,
      circleId,
      canViewRealtime = true,
      canViewHistory = true,
      canReceiveAlerts = true,
    } = body;

    if (!viewerId) {
      return NextResponse.json(
        { code: -1, message: '请选择授权对象' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const [existing] = await db
      .select()
      .from(locationPermissions)
      .where(and(
        eq(locationPermissions.ownerId, user.id),
        eq(locationPermissions.viewerId, viewerId)
      ));

    if (existing) {
      // 更新现有权限
      const [updated] = await db
        .update(locationPermissions)
        .set({
          canViewRealtime,
          canViewHistory,
          canReceiveAlerts,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(locationPermissions.id, existing.id))
        .returning();

      return NextResponse.json({
        code: 0,
        message: '权限已更新',
        data: updated
      });
    }

    // 创建新权限
    const [newPermission] = await db
      .insert(locationPermissions)
      .values({
        ownerId: user.id,
        viewerId,
        circleId,
        canViewRealtime,
        canViewHistory,
        canReceiveAlerts,
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '授权成功',
      data: newPermission
    });
  } catch (error) {
    console.error('创建位置权限失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建位置权限失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/location/permissions - 更新位置共享权限
 */
export async function PUT(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      id,
      canViewRealtime,
      canViewHistory,
      canReceiveAlerts,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { code: -1, message: '缺少权限ID' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(locationPermissions)
      .set({
        ...(canViewRealtime !== undefined && { canViewRealtime }),
        ...(canViewHistory !== undefined && { canViewHistory }),
        ...(canReceiveAlerts !== undefined && { canReceiveAlerts }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(and(
        eq(locationPermissions.id, id),
        eq(locationPermissions.ownerId, user.id)
      ))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { code: -1, message: '权限不存在或无权操作' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: updated
    });
  } catch (error) {
    console.error('更新位置权限失败:', error);
    return NextResponse.json(
      { code: -1, message: '更新位置权限失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/location/permissions - 删除位置共享权限
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
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
        { code: -1, message: '缺少权限ID' },
        { status: 400 }
      );
    }

    await db
      .delete(locationPermissions)
      .where(and(
        eq(locationPermissions.id, parseInt(id)),
        eq(locationPermissions.ownerId, user.id)
      ));

    return NextResponse.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除位置权限失败:', error);
    return NextResponse.json(
      { code: -1, message: '删除位置权限失败' },
      { status: 500 }
    );
  }
}
