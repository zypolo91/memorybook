import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memories, memoryMedia, memoryTags, tags } from '@/db/schema';
import { eq, desc, and, like, sql, ne, inArray, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { getFamilyAccessibleUserIds } from '@/lib/data-access';

/**
 * GET /api/memories - 获取记忆列表
 *
 * 权限规则：
 * 1. 默认只查看自己的记忆 (scope=mine)
 * 2. scope=family 时查看家属圈所有成员的记忆
 * 3. 相册数据(__album_uploads__)始终私有，不共享
 */
export async function GET(request: NextRequest) {
  try {
    // 强制验证用户身份
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权，请先登录' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword');
    const status = searchParams.get('status') || 'active';
    const scope = searchParams.get('scope') || 'mine'; // mine | family

    const offset = (page - 1) * pageSize;

    // 根据scope确定可访问的用户ID列表
    let accessibleUserIds: number[] = [user.id];
    if (scope === 'family') {
      // 获取家属圈中所有成员的ID
      accessibleUserIds = await getFamilyAccessibleUserIds(user.id);
    }

    // 构建查询条件
    const conditions = [
      eq(memories.status, status),
      // 排除相册上传的隐藏记忆（始终私有）
      ne(memories.title, '__album_uploads__'),
      // 只查询可访问用户的记忆
      inArray(memories.userId, accessibleUserIds)
    ];
    if (keyword) {
      // 增强模糊搜索 - 同时搜索标题和内容
      conditions.push(
        sql`(${memories.title} ILIKE ${'%' + keyword + '%'} OR ${memories.content} ILIKE ${'%' + keyword + '%'} OR ${memories.location} ILIKE ${'%' + keyword + '%'})`
      );
    }

    // 查询记忆列表
    const memoryList = await db
      .select()
      .from(memories)
      .where(and(...conditions))
      .orderBy(desc(memories.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memories)
      .where(and(...conditions));

    // 获取每个记忆的媒体文件
    const memoriesWithMedia = await Promise.all(
      memoryList.map(async (memory: any) => {
        const media = await db
          .select()
          .from(memoryMedia)
          .where(eq(memoryMedia.memoryId, memory.id))
          .orderBy(memoryMedia.sortOrder);

        const memoryTagList = await db
          .select({ tag: tags })
          .from(memoryTags)
          .innerJoin(tags, eq(memoryTags.tagId, tags.id))
          .where(eq(memoryTags.memoryId, memory.id));

        return {
          ...memory,
          media,
          tags: memoryTagList.map((t: any) => t.tag)
        };
      })
    );

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: memoriesWithMedia,
        total: Number(count),
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('获取记忆列表失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取记忆列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memories - 创建记忆
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      memoryDate,
      location,
      mood,
      isPublic = false,
      layoutType,
      mediaList = [],
      tagIds = [],
      clientRequestId // 客户端请求ID，用于防重复提交
    } = body;

    if (!title) {
      return NextResponse.json(
        { code: -1, message: '标题不能为空' },
        { status: 400 }
      );
    }

    console.log('[memories/POST] 收到创建请求:', {
      userId: user.id,
      title,
      mediaCount: mediaList.length,
      tagCount: tagIds.length,
      timestamp: new Date().toISOString()
    });

    // 防重复提交：检查最近5秒内是否有相同标题的记忆
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const [recentDuplicate] = await db
      .select()
      .from(memories)
      .where(
        and(
          eq(memories.userId, user.id),
          eq(memories.title, title),
          sql`${memories.createdAt} > ${fiveSecondsAgo}`
        )
      )
      .limit(1);

    if (recentDuplicate) {
      console.log(
        '[memories/POST] 检测到重复提交，返回已存在的记忆:',
        recentDuplicate.id
      );
      return NextResponse.json({
        code: 0,
        message: '创建成功',
        data: recentDuplicate
      });
    }

    // 创建记忆
    console.log('[memories/POST] 开始创建新记忆...');
    const [newMemory] = await db
      .insert(memories)
      .values({
        userId: user.id,
        title,
        content,
        memoryDate: memoryDate ? new Date(memoryDate) : null,
        location,
        mood,
        isPublic,
        layoutType
      })
      .returning();

    // 添加媒体文件
    if (mediaList.length > 0) {
      await db.insert(memoryMedia).values(
        mediaList.map((media: any, index: number) => ({
          memoryId: newMemory.id,
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

    // 添加标签
    if (tagIds.length > 0) {
      await db.insert(memoryTags).values(
        tagIds.map((tagId: number) => ({
          memoryId: newMemory.id,
          tagId
        }))
      );

      // 更新标签使用次数
      for (const tagId of tagIds) {
        await db
          .update(tags)
          .set({ usageCount: sql`${tags.usageCount} + 1` })
          .where(eq(tags.id, tagId));
      }
    }

    console.log('[memories/POST] 创建记忆成功:', {
      memoryId: newMemory.id,
      mediaCount: mediaList.length,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newMemory
    });
  } catch (error) {
    console.error('[memories/POST] 创建记忆失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建记忆失败' },
      { status: 500 }
    );
  }
}
