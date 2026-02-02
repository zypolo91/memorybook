import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryFavorites } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/favorites/check - 检查是否已收藏
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未登录' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json(
        { code: 400, message: '参数错误' },
        { status: 400 }
      );
    }

    // 目前只支持记忆类型
    if (targetType !== 'memory') {
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: { isFavorited: false }
      });
    }

    // 检查是否已收藏
    const existing = await db
      .select()
      .from(memoryFavorites)
      .where(
        and(
          eq(memoryFavorites.userId, user.id),
          eq(memoryFavorites.memoryId, parseInt(targetId))
        )
      )
      .limit(1);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: { isFavorited: existing.length > 0 }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return NextResponse.json(
      { code: 500, message: '检查收藏状态失败' },
      { status: 500 }
    );
  }
}
