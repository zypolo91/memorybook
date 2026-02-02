import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryFavorites, memories, memoryMedia } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/favorites - 获取收藏列表
 * 目前只支持记忆类型，后续可扩展
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type'); // memory, case, article

    const offset = (page - 1) * pageSize;

    // 目前只支持记忆类型
    if (type && type !== 'memory') {
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: {
          list: [],
          total: 0,
          page,
          pageSize
        }
      });
    }

    // 查询收藏列表
    const favoriteList = await db
      .select({
        id: memoryFavorites.id,
        userId: memoryFavorites.userId,
        memoryId: memoryFavorites.memoryId,
        createdAt: memoryFavorites.createdAt,
        memory: memories
      })
      .from(memoryFavorites)
      .innerJoin(memories, eq(memoryFavorites.memoryId, memories.id))
      .where(eq(memoryFavorites.userId, user.id))
      .orderBy(desc(memoryFavorites.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memoryFavorites)
      .where(eq(memoryFavorites.userId, user.id));

    // 获取每个记忆的媒体文件
    const favoritesWithData = await Promise.all(
      favoriteList.map(async (fav: any) => {
        const media = await db
          .select()
          .from(memoryMedia)
          .where(eq(memoryMedia.memoryId, fav.memoryId))
          .orderBy(memoryMedia.sortOrder);

        // 获取封面图
        const coverMedia = media.find((m: any) => m.type === 'image');

        return {
          id: fav.id,
          userId: fav.userId,
          targetType: 'memory',
          targetId: fav.memoryId,
          createdAt: fav.createdAt,
          targetData: {
            id: fav.memory.id,
            title: fav.memory.title,
            content: fav.memory.content,
            coverUrl: coverMedia?.thumbnailUrl || coverMedia?.url || null,
            createdAt: fav.memory.createdAt
          }
        };
      })
    );

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: favoritesWithData,
        total: Number(count),
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    return NextResponse.json(
      { code: 500, message: '获取收藏列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites - 添加收藏
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json(
        { code: 400, message: '参数错误' },
        { status: 400 }
      );
    }

    // 目前只支持记忆类型
    if (targetType !== 'memory') {
      return NextResponse.json(
        { code: 400, message: '暂不支持该类型' },
        { status: 400 }
      );
    }

    // 检查是否已收藏
    const existing = await db
      .select()
      .from(memoryFavorites)
      .where(
        and(
          eq(memoryFavorites.userId, user.id),
          eq(memoryFavorites.memoryId, targetId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ code: 0, message: '已收藏' });
    }

    // 添加收藏
    await db.insert(memoryFavorites).values({
      userId: user.id,
      memoryId: targetId
    });

    return NextResponse.json({ code: 0, message: '收藏成功' });
  } catch (error) {
    console.error('添加收藏失败:', error);
    return NextResponse.json(
      { code: 500, message: '添加收藏失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites - 取消收藏
 */
export async function DELETE(request: NextRequest) {
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
      return NextResponse.json(
        { code: 400, message: '暂不支持该类型' },
        { status: 400 }
      );
    }

    // 删除收藏
    await db
      .delete(memoryFavorites)
      .where(
        and(
          eq(memoryFavorites.userId, user.id),
          eq(memoryFavorites.memoryId, parseInt(targetId))
        )
      );

    return NextResponse.json({ code: 0, message: '取消收藏成功' });
  } catch (error) {
    console.error('取消收藏失败:', error);
    return NextResponse.json(
      { code: 500, message: '取消收藏失败' },
      { status: 500 }
    );
  }
}
