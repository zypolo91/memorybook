/**
 * 单个提醒操作 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryReminders } from '@/db/schema.memorybook';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取单个提醒
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reminderId = parseInt(id);

    const [reminder] = await db
      .select()
      .from(memoryReminders)
      .where(
        and(
          eq(memoryReminders.id, reminderId),
          eq(memoryReminders.userId, user.id)
        )
      );

    if (!reminder) {
      return NextResponse.json(
        { code: 404, message: '提醒不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: reminder
    });
  } catch (error) {
    console.error('GET /api/reminders/[id] error:', error);
    return NextResponse.json(
      { code: 500, message: '获取提醒失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新提醒
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reminderId = parseInt(id);
    const body = await request.json();

    // 检查提醒是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(memoryReminders)
      .where(
        and(
          eq(memoryReminders.id, reminderId),
          eq(memoryReminders.userId, user.id)
        )
      );

    if (!existing) {
      return NextResponse.json(
        { code: 404, message: '提醒不存在' },
        { status: 404 }
      );
    }

    // 更新提醒
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.reminderTime !== undefined)
      updateData.reminderTime = new Date(body.reminderTime);
    if (body.repeatType !== undefined) updateData.repeatType = body.repeatType;
    if (body.isCompleted !== undefined)
      updateData.isCompleted = body.isCompleted;

    const [updated] = await db
      .update(memoryReminders)
      .set(updateData)
      .where(eq(memoryReminders.id, reminderId))
      .returning();

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: updated
    });
  } catch (error) {
    console.error('PUT /api/reminders/[id] error:', error);
    return NextResponse.json(
      { code: 500, message: '更新提醒失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除提醒
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reminderId = parseInt(id);

    // 检查提醒是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(memoryReminders)
      .where(
        and(
          eq(memoryReminders.id, reminderId),
          eq(memoryReminders.userId, user.id)
        )
      );

    if (!existing) {
      return NextResponse.json(
        { code: 404, message: '提醒不存在' },
        { status: 404 }
      );
    }

    await db.delete(memoryReminders).where(eq(memoryReminders.id, reminderId));

    return NextResponse.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('DELETE /api/reminders/[id] error:', error);
    return NextResponse.json(
      { code: 500, message: '删除提醒失败' },
      { status: 500 }
    );
  }
}
