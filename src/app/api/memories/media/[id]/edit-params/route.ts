/**
 * 媒体编辑参数 API
 * PATCH /api/memories/media/[id]/edit-params - 更新媒体编辑参数
 * GET /api/memories/media/[id]/edit-params - 获取媒体编辑参数
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryMedia, memories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/memories/media/[id]/edit-params - 获取媒体编辑参数
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { code: 400, message: '无效的媒体ID' },
        { status: 400 }
      );
    }

    // 获取媒体及其所属记忆
    const [media] = await db
      .select({
        id: memoryMedia.id,
        editParams: memoryMedia.editParams,
        memoryId: memoryMedia.memoryId
      })
      .from(memoryMedia)
      .where(eq(memoryMedia.id, mediaId));

    if (!media) {
      return NextResponse.json(
        { code: 404, message: '媒体不存在' },
        { status: 404 }
      );
    }

    // 验证用户权限
    const [memory] = await db
      .select({ userId: memories.userId })
      .from(memories)
      .where(eq(memories.id, media.memoryId));

    if (!memory || memory.userId !== user.id) {
      return NextResponse.json(
        { code: 403, message: '无权访问' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        id: media.id,
        editParams: media.editParams || null
      }
    });
  } catch (error) {
    console.error('Get edit params error:', error);
    return NextResponse.json(
      { code: 500, message: '获取编辑参数失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/memories/media/[id]/edit-params - 更新媒体编辑参数
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { code: 400, message: '无效的媒体ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { editParams } = body;

    // 验证编辑参数结构
    if (editParams && typeof editParams !== 'object') {
      return NextResponse.json(
        { code: 400, message: '无效的编辑参数格式' },
        { status: 400 }
      );
    }

    // 获取媒体及其所属记忆
    const [media] = await db
      .select({
        id: memoryMedia.id,
        memoryId: memoryMedia.memoryId
      })
      .from(memoryMedia)
      .where(eq(memoryMedia.id, mediaId));

    if (!media) {
      return NextResponse.json(
        { code: 404, message: '媒体不存在' },
        { status: 404 }
      );
    }

    // 验证用户权限
    const [memory] = await db
      .select({ userId: memories.userId })
      .from(memories)
      .where(eq(memories.id, media.memoryId));

    if (!memory || memory.userId !== user.id) {
      return NextResponse.json(
        { code: 403, message: '无权修改' },
        { status: 403 }
      );
    }

    // 更新编辑参数
    const [updated] = await db
      .update(memoryMedia)
      .set({ editParams: editParams || null })
      .where(eq(memoryMedia.id, mediaId))
      .returning();

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        id: updated.id,
        editParams: updated.editParams
      }
    });
  } catch (error) {
    console.error('Update edit params error:', error);
    return NextResponse.json(
      { code: 500, message: '更新编辑参数失败' },
      { status: 500 }
    );
  }
}
