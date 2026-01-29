import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/notifications - 获取通知列表
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const offset = (page - 1) * pageSize;

    const conditions = [eq(notifications.userId, user.id)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const notificationList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    const [{ unreadCount }] = await db
      .select({ unreadCount: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: notificationList,
        total: Number(count),
        unreadCount: Number(unreadCount),
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取通知列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications - 创建通知
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      type,
      title,
      content,
      relatedId,
      relatedType,
      fromUserId
    } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { code: -1, message: '参数不完整' },
        { status: 400 }
      );
    }

    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        content,
        relatedId,
        relatedType,
        fromUserId
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newNotification
    });
  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建通知失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications - 标记通知已读
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
    const { id, markAll } = body;

    if (markAll) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
    } else if (id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
    }

    return NextResponse.json({
      code: 0,
      message: '操作成功'
    });
  } catch (error) {
    console.error('更新通知失败:', error);
    return NextResponse.json(
      { code: -1, message: '更新通知失败' },
      { status: 500 }
    );
  }
}
