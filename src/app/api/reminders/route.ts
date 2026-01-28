/**
 * 提醒管理 API
 * 用于管理阿尔茨海默患者的用药、检查、活动等提醒
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryReminders } from '@/db/schema.memorybook';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取提醒列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isCompleted = searchParams.get('isCompleted');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // 构建查询条件
    const conditions = [eq(memoryReminders.userId, user.id)];

    if (startDate) {
      conditions.push(gte(memoryReminders.reminderTime, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(memoryReminders.reminderTime, new Date(endDate)));
    }
    if (isCompleted !== null && isCompleted !== undefined) {
      conditions.push(eq(memoryReminders.isCompleted, isCompleted === 'true'));
    }

    // 查询数据
    const reminders = await db
      .select()
      .from(memoryReminders)
      .where(and(...conditions))
      .orderBy(desc(memoryReminders.reminderTime))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 获取总数
    const [countResult] = await db
      .select({ count: memoryReminders.id })
      .from(memoryReminders)
      .where(and(...conditions));

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: reminders,
        total: countResult?.count || 0,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('GET /api/reminders error:', error);
    return NextResponse.json(
      { code: 500, message: '获取提醒列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建提醒
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
      title,
      content,
      reminderTime,
      repeatType = 'none',
      memoryId
    } = body;

    if (!title || !reminderTime) {
      return NextResponse.json(
        { code: 400, message: '标题和提醒时间为必填项' },
        { status: 400 }
      );
    }

    const [newReminder] = await db
      .insert(memoryReminders)
      .values({
        userId: user.id,
        title,
        content,
        reminderTime: new Date(reminderTime),
        repeatType,
        memoryId: memoryId || null,
        isCompleted: false
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newReminder
    });
  } catch (error) {
    console.error('POST /api/reminders error:', error);
    return NextResponse.json(
      { code: 500, message: '创建提醒失败' },
      { status: 500 }
    );
  }
}
