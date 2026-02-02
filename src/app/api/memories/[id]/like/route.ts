import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryLikes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/memories/[id]/like - 点赞/取消点赞
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const memoryId = parseInt(id);

    if (isNaN(memoryId)) {
      return NextResponse.json(
        { code: 400, message: '参数错误' },
        { status: 400 }
      );
    }

    // 检查是否已点赞
    const existing = await db
      .select()
      .from(memoryLikes)
      .where(
        and(eq(memoryLikes.userId, user.id), eq(memoryLikes.memoryId, memoryId))
      )
      .limit(1);

    if (existing.length > 0) {
      // 已点赞，取消点赞
      await db
        .delete(memoryLikes)
        .where(
          and(
            eq(memoryLikes.userId, user.id),
            eq(memoryLikes.memoryId, memoryId)
          )
        );
      return NextResponse.json({
        code: 0,
        message: '取消点赞成功',
        data: { isLiked: false }
      });
    } else {
      // 未点赞，添加点赞
      await db.insert(memoryLikes).values({
        userId: user.id,
        memoryId: memoryId
      });
      return NextResponse.json({
        code: 0,
        message: '点赞成功',
        data: { isLiked: true }
      });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    return NextResponse.json(
      { code: 500, message: '操作失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/memories/[id]/like - 检查是否已点赞
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未登录' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const memoryId = parseInt(id);

    if (isNaN(memoryId)) {
      return NextResponse.json(
        { code: 400, message: '参数错误' },
        { status: 400 }
      );
    }

    // 检查是否已点赞
    const existing = await db
      .select()
      .from(memoryLikes)
      .where(
        and(eq(memoryLikes.userId, user.id), eq(memoryLikes.memoryId, memoryId))
      )
      .limit(1);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: { isLiked: existing.length > 0 }
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    return NextResponse.json(
      { code: 500, message: '检查失败' },
      { status: 500 }
    );
  }
}
