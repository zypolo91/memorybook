import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (Number.isNaN(id)) {
      return NextResponse.json(
        { code: -1, message: '参数错误' },
        { status: 400 }
      );
    }

    const [deleted] = await db.delete(tags).where(eq(tags.id, id)).returning();

    if (!deleted) {
      return NextResponse.json(
        { code: 404, message: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: { id }
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { code: -1, message: '删除标签失败' },
      { status: 500 }
    );
  }
}
