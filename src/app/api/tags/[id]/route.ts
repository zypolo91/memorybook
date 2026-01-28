import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    const body = await request.json();
    const { name, color, icon } = body ?? {};

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { code: -1, message: '参数错误' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name);
    if (color !== undefined) updateData.color = color === null ? null : String(color);
    if (icon !== undefined) updateData.icon = icon === null ? null : String(icon);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { code: -1, message: '缺少更新字段' },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(tags)
      .set(updateData)
      .where(eq(tags.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { code: 404, message: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: updated
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { code: -1, message: '更新标签失败' },
      { status: 500 }
    );
  }
}
