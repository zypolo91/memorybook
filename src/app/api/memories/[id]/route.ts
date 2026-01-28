import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  memories,
  memoryMedia,
  memoryTags,
  tags,
  memoryLikes,
  memoryFavorites
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/memories/[id] - 获取记忆详情
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const memoryId = parseInt(id);

    const [memory] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, memoryId));

    if (!memory) {
      return NextResponse.json(
        { code: 404, message: '记忆不存在' },
        { status: 404 }
      );
    }

    // 增加浏览次数
    await db
      .update(memories)
      .set({ viewCount: sql`${memories.viewCount} + 1` })
      .where(eq(memories.id, memoryId));

    // 获取媒体文件
    const media = await db
      .select()
      .from(memoryMedia)
      .where(eq(memoryMedia.memoryId, memoryId))
      .orderBy(memoryMedia.sortOrder);

    // 获取标签
    const memoryTagList = await db
      .select({ tag: tags })
      .from(memoryTags)
      .innerJoin(tags, eq(memoryTags.tagId, tags.id))
      .where(eq(memoryTags.memoryId, memoryId));

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        ...memory,
        viewCount: (memory.viewCount || 0) + 1,
        media,
        tags: memoryTagList.map((t: any) => t.tag)
      }
    });
  } catch (error) {
    console.error('获取记忆详情失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取记忆详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/memories/[id] - 更新记忆
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const memoryId = parseInt(id);
    const body = await request.json();

    // 检查记忆是否存在且属于当前用户
    const [existingMemory] = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, memoryId), eq(memories.userId, user.id)));

    if (!existingMemory) {
      return NextResponse.json(
        { code: 404, message: '记忆不存在或无权限' },
        { status: 404 }
      );
    }

    const {
      title,
      content,
      memoryDate,
      location,
      mood,
      isPublic,
      mediaList,
      tagIds
    } = body;

    // 更新记忆
    const [updatedMemory] = await db
      .update(memories)
      .set({
        title: title ?? existingMemory.title,
        content: content ?? existingMemory.content,
        memoryDate: memoryDate
          ? new Date(memoryDate)
          : existingMemory.memoryDate,
        location: location ?? existingMemory.location,
        mood: mood ?? existingMemory.mood,
        isPublic: isPublic ?? existingMemory.isPublic,
        updatedAt: new Date()
      })
      .where(eq(memories.id, memoryId))
      .returning();

    // 更新媒体文件
    if (mediaList) {
      await db.delete(memoryMedia).where(eq(memoryMedia.memoryId, memoryId));
      if (mediaList.length > 0) {
        await db.insert(memoryMedia).values(
          mediaList.map((media: any, index: number) => ({
            memoryId,
            type: media.type,
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            fileName: media.fileName,
            fileSize: media.fileSize,
            mimeType: media.mimeType,
            width: media.width,
            height: media.height,
            duration: media.duration,
            sortOrder: index
          }))
        );
      }
    }

    // 更新标签
    if (tagIds) {
      await db.delete(memoryTags).where(eq(memoryTags.memoryId, memoryId));
      if (tagIds.length > 0) {
        await db.insert(memoryTags).values(
          tagIds.map((tagId: number) => ({
            memoryId,
            tagId
          }))
        );
      }
    }

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: updatedMemory
    });
  } catch (error) {
    console.error('更新记忆失败:', error);
    return NextResponse.json(
      { code: -1, message: '更新记忆失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memories/[id] - 删除记忆
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const memoryId = parseInt(id);

    // 检查记忆是否存在且属于当前用户
    const [existingMemory] = await db
      .select()
      .from(memories)
      .where(and(eq(memories.id, memoryId), eq(memories.userId, user.id)));

    if (!existingMemory) {
      return NextResponse.json(
        { code: 404, message: '记忆不存在或无权限' },
        { status: 404 }
      );
    }

    // 软删除
    await db
      .update(memories)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(memories.id, memoryId));

    return NextResponse.json({
      code: 0,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除记忆失败:', error);
    return NextResponse.json(
      { code: -1, message: '删除记忆失败' },
      { status: 500 }
    );
  }
}
