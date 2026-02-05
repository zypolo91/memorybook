import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { albums, albumMemories, memories } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/albums - 获取相册列表
 * 【安全】强制验证用户身份，只能查看自己的相册
 */
export async function GET(request: NextRequest) {
  try {
    // 【安全修复】强制验证用户身份
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权，请先登录' },
        { status: 401 }
      );
    }

    // 【安全修复】忽略传入的userId参数，强制使用当前登录用户ID
    const albumList = await db
      .select()
      .from(albums)
      .where(eq(albums.userId, user.id))
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
