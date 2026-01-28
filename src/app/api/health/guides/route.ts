import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { healthGuides } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

/**
 * GET /api/health/guides - 获取健康指南列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isPublished = searchParams.get('isPublished') !== 'false'; // 默认只查已发布的

    let conditions = [];

    if (category) {
      conditions.push(eq(healthGuides.category, category));
    }

    if (isPublished) {
      conditions.push(eq(healthGuides.isPublished, true));
    }

    const guides = await db
      .select()
      .from(healthGuides)
      .where(and(...conditions))
      .orderBy(asc(healthGuides.sortOrder), asc(healthGuides.createdAt));

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: guides
    });
  } catch (error) {
    console.error('获取健康指南失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取健康指南失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/guides - 创建健康指南 (仅管理员或测试用)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, category, content, coverUrl, icon, color, sortOrder } = body;

    if (!title || !category) {
      return NextResponse.json(
        { code: -1, message: '标题和分类不能为空' },
        { status: 400 }
      );
    }

    const [newGuide] = await db
      .insert(healthGuides)
      .values({
        title,
        subtitle,
        category,
        content,
        coverUrl,
        icon,
        color,
        sortOrder: sortOrder || 0,
        isPublished: true,
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newGuide
    });
  } catch (error) {
    console.error('创建健康指南失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建健康指南失败' },
      { status: 500 }
    );
  }
}
