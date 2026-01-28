/**
 * 统一搜索 API
 * 支持记忆、标签、位置等多维度模糊搜索
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memories, memoryMedia, memoryTags, tags } from '@/db/schema';
import { eq, desc, and, or, sql, ilike } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/search - 统一搜索接口
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, memories, tags
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    if (!keyword.trim()) {
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: {
          memories: [],
          tags: [],
          total: 0,
          page,
          pageSize
        }
      });
    }

    const offset = (page - 1) * pageSize;
    const searchPattern = `%${keyword}%`;

    let memoriesResult: any[] = [];
    let tagsResult: any[] = [];
    let totalMemories = 0;

    // 搜索记忆
    if (type === 'all' || type === 'memories') {
      // 构建搜索条件 - 搜索标题、内容、位置
      const searchConditions = and(
        eq(memories.userId, user.id),
        eq(memories.status, 'active'),
        or(
          ilike(memories.title, searchPattern),
          ilike(memories.content, searchPattern),
          ilike(memories.location, searchPattern),
          ilike(memories.mood, searchPattern)
        )
      );

      // 查询记忆
      const memoryList = await db
        .select()
        .from(memories)
        .where(searchConditions)
        .orderBy(desc(memories.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 查询总数
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(memories)
        .where(searchConditions);

      totalMemories = Number(countResult.count);

      // 获取每个记忆的媒体和标签
      memoriesResult = await Promise.all(
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

          // 计算匹配度评分
          let score = 0;
          const lowerKeyword = keyword.toLowerCase();
          if (memory.title?.toLowerCase().includes(lowerKeyword)) score += 10;
          if (memory.content?.toLowerCase().includes(lowerKeyword)) score += 5;
          if (memory.location?.toLowerCase().includes(lowerKeyword)) score += 3;

          return {
            ...memory,
            media,
            tags: memoryTagList.map((t: any) => t.tag),
            _score: score
          };
        })
      );

      // 按匹配度排序
      memoriesResult.sort((a, b) => b._score - a._score);
    }

    // 搜索标签
    if (type === 'all' || type === 'tags') {
      tagsResult = await db
        .select()
        .from(tags)
        .where(ilike(tags.name, searchPattern))
        .orderBy(desc(tags.usageCount))
        .limit(10);
    }

    // 通过标签搜索记忆
    if (type === 'all' && keyword.length <= 10) {
      // 查找匹配的标签
      const matchedTags = await db
        .select()
        .from(tags)
        .where(ilike(tags.name, searchPattern))
        .limit(5);

      if (matchedTags.length > 0) {
        // 查找包含这些标签的记忆
        for (const tag of matchedTags) {
          const taggedMemories = await db
            .select({ memoryId: memoryTags.memoryId })
            .from(memoryTags)
            .where(eq(memoryTags.tagId, tag.id))
            .limit(5);

          for (const tm of taggedMemories) {
            // 检查是否已经在结果中
            if (!memoriesResult.some((m) => m.id === tm.memoryId)) {
              const [memory] = await db
                .select()
                .from(memories)
                .where(
                  and(
                    eq(memories.id, tm.memoryId),
                    eq(memories.userId, user.id),
                    eq(memories.status, 'active')
                  )
                );

              if (memory) {
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

                memoriesResult.push({
                  ...memory,
                  media,
                  tags: memoryTagList.map((t: any) => t.tag),
                  _score: 2, // 标签匹配的分数较低
                  _matchedByTag: tag.name
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        memories: memoriesResult,
        tags: tagsResult,
        total: totalMemories,
        page,
        pageSize,
        keyword
      }
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { code: -1, message: '搜索失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search/suggest - 搜索建议
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { keyword } = body;

    if (!keyword || keyword.length < 1) {
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: { suggestions: [] }
      });
    }

    const searchPattern = `%${keyword}%`;

    // 从标签获取建议
    const tagSuggestions = await db
      .select({ name: tags.name, type: sql<string>`'tag'` })
      .from(tags)
      .where(ilike(tags.name, searchPattern))
      .orderBy(desc(tags.usageCount))
      .limit(5);

    // 从记忆标题获取建议
    const titleSuggestions = await db
      .select({ name: memories.title, type: sql<string>`'memory'` })
      .from(memories)
      .where(
        and(
          eq(memories.userId, user.id),
          eq(memories.status, 'active'),
          ilike(memories.title, searchPattern)
        )
      )
      .orderBy(desc(memories.createdAt))
      .limit(5);

    // 从位置获取建议
    const locationSuggestions = await db
      .selectDistinct({
        name: memories.location,
        type: sql<string>`'location'`
      })
      .from(memories)
      .where(
        and(
          eq(memories.userId, user.id),
          eq(memories.status, 'active'),
          ilike(memories.location, searchPattern),
          sql`${memories.location} IS NOT NULL`
        )
      )
      .limit(3);

    const suggestions = [
      ...tagSuggestions,
      ...titleSuggestions,
      ...locationSuggestions
    ]
      .filter((s) => s.name)
      .slice(0, 10);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: { suggestions }
    });
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取搜索建议失败' },
      { status: 500 }
    );
  }
}
