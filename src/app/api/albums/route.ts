import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { albums, albumMemories, memories } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/albums - 获取相册列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { code: -1, message: '缺少用户ID' },
        { status: 400 }
      );
    }

    const albumList = await db
      .select()
      .from(albums)
      .where(eq(albums.userId, parseInt(userId)))
      .orderBy(desc(albums.isDefault), albums.sortOrder);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: albumList
    });
  } catch (error) {
    console.error('获取相册列表失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取相册列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/albums - 创建相册
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
    const { name, description, coverUrl } = body;

    if (!name) {
      return NextResponse.json(
        { code: -1, message: '相册名称不能为空' },
        { status: 400 }
      );
    }

    const [newAlbum] = await db
      .insert(albums)
      .values({
        userId: user.id,
        name,
        description,
        coverUrl
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newAlbum
    });
  } catch (error) {
    console.error('创建相册失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建相册失败' },
      { status: 500 }
    );
  }
}
