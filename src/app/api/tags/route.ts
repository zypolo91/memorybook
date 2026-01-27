import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { desc, like } from 'drizzle-orm';

/**
 * GET /api/tags - 获取标签列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db.select().from(tags);

    if (keyword) {
      query = query.where(like(tags.name, `%${keyword}%`)) as typeof query;
    }

    const tagList = await query
      .orderBy(desc(tags.usageCount))
      .limit(limit);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: tagList,
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取标签列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tags - 创建标签
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon } = body;

    if (!name) {
      return NextResponse.json(
        { code: -1, message: '标签名称不能为空' },
        { status: 400 }
      );
    }

    const [newTag] = await db
      .insert(tags)
      .values({ name, color, icon })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newTag,
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建标签失败' },
      { status: 500 }
    );
  }
}
