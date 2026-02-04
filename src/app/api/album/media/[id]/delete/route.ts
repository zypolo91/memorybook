import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryMedia } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/album/media/[id]/delete - 删除相册媒体
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const mediaId = parseInt(id);
    if (isNaN(mediaId)) {
      return NextResponse.json(
        { code: 400, message: '无效的媒体ID' },
        { status: 400 }
      );
    }

    // 删除媒体记录
    await db.delete(memoryMedia).where(eq(memoryMedia.id, mediaId));

    return NextResponse.json({
      code: 0,
      message: 'success'
    });
  } catch (error) {
    console.error('删除相册媒体失败:', error);
    return NextResponse.json(
      { code: -1, message: '删除相册媒体失败' },
      { status: 500 }
    );
  }
}
