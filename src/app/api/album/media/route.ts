import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryMedia, memories, albums } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/album/media - 保存媒体到相册
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
    const { url, thumbnailUrl, type, name, size, category } = body;

    if (!url || !type) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 查找或创建一个默认的相册记忆来存储独立上传的媒体
    const [existingMemory] = await db
      .select()
      .from(memories)
      .where(
        and(
          eq(memories.userId, user.id),
          eq(memories.title, '__album_uploads__')
        )
      )
      .limit(1);

    let defaultMemory = existingMemory;

    if (!defaultMemory) {
      const [newMemory] = await db
        .insert(memories)
        .values({
          userId: user.id,
          title: '__album_uploads__',
          content: '相册上传的媒体文件',
          memoryDate: new Date(),
          isPublic: false
        })
        .returning();
      defaultMemory = newMemory;
    }

    // 插入媒体记录
    const [newMedia] = await db
      .insert(memoryMedia)
      .values({
        memoryId: defaultMemory.id,
        url,
        thumbnailUrl: thumbnailUrl || url,
        type
        // name 和 size 字段如果schema支持的话
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        id: newMedia.id,
        url: newMedia.url,
        thumbnailUrl: newMedia.thumbnailUrl,
        type: newMedia.type,
        createdAt: newMedia.createdAt
      }
    });
  } catch (error) {
    console.error('保存相册媒体失败:', error);
    return NextResponse.json(
      { code: -1, message: '保存相册媒体失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/album/media - 获取所有媒体文件（相册流模式）
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const offset = (page - 1) * pageSize;
    const type = searchParams.get('type'); // 'image', 'video', etc.

    let conditions = [
      eq(memories.userId, user.id)
      // 可以添加更多过滤条件，比如是否公开等
    ];

    if (type) {
      conditions.push(eq(memoryMedia.type, type));
    }

    // 联表查询：Media -> Memory
    const mediaList = await db
      .select({
        id: memoryMedia.id,
        url: memoryMedia.url,
        thumbnailUrl: memoryMedia.thumbnailUrl,
        type: memoryMedia.type,
        width: memoryMedia.width,
        height: memoryMedia.height,
        duration: memoryMedia.duration,
        createdAt: memoryMedia.createdAt,
        memoryId: memories.id,
        memoryTitle: memories.title,
        memoryDate: memories.memoryDate
      })
      .from(memoryMedia)
      .innerJoin(memories, eq(memoryMedia.memoryId, memories.id))
      .where(and(...conditions))
      .orderBy(desc(memories.memoryDate), desc(memoryMedia.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: mediaList
    });
  } catch (error) {
    console.error('获取相册媒体失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取相册媒体失败' },
      { status: 500 }
    );
  }
}
