/**
 * 认知训练 API
 * 管理认知训练游戏和训练记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cognitiveGames, gameSessions } from '@/db/schema';
import { eq, desc, and, sql, gte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取游戏列表或训练记录
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
    const type = searchParams.get('type') || 'games'; // games, sessions, stats
    const patientId = searchParams.get('patientId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (type) {
      case 'games':
        // 获取游戏列表
        const gamesConditions = [eq(cognitiveGames.isActive, true)];
        if (category) {
          gamesConditions.push(eq(cognitiveGames.category, category));
        }

        const games = await db
          .select()
          .from(cognitiveGames)
          .where(and(...gamesConditions))
          .orderBy(cognitiveGames.sortOrder);

        return NextResponse.json({ code: 0, data: games });

      case 'sessions':
        // 获取训练记录
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }

        const sessions = await db
          .select({
            session: gameSessions,
            game: cognitiveGames
          })
          .from(gameSessions)
          .leftJoin(cognitiveGames, eq(gameSessions.gameId, cognitiveGames.id))
          .where(eq(gameSessions.patientId, parseInt(patientId)))
          .orderBy(desc(gameSessions.playedAt))
          .limit(limit);

        return NextResponse.json({ code: 0, data: sessions });

      case 'stats':
        // 获取训练统计
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }

        const stats = await getTrainingStats(parseInt(patientId));
        return NextResponse.json({ code: 0, data: stats });

      default:
        return NextResponse.json(
          { code: 400, message: '无效的类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET /api/health/training error:', error);
    return NextResponse.json(
      { code: 500, message: '获取数据失败' },
      { status: 500 }
    );
  }
}

// POST - 提交训练记录
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
    const {
      patientId,
      gameId,
      level,
      score,
      maxScore,
      durationSeconds,
      accuracy,
      details
    } = body;

    if (!patientId || !gameId || level === undefined || score === undefined) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const [record] = await db
      .insert(gameSessions)
      .values({
        patientId: parseInt(patientId),
        gameId: parseInt(gameId),
        level,
        score,
        maxScore,
        durationSeconds,
        accuracy,
        details,
        playedAt: new Date()
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '训练记录已保存',
      data: record
    });
  } catch (error) {
    console.error('POST /api/health/training error:', error);
    return NextResponse.json(
      { code: 500, message: '保存记录失败' },
      { status: 500 }
    );
  }
}

// 获取训练统计
async function getTrainingStats(patientId: number) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 本周训练次数
  const [weeklyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.patientId, patientId),
        gte(gameSessions.playedAt, weekAgo)
      )
    );

  // 本周训练时长
  const [weeklyDuration] = await db
    .select({ total: sql<number>`coalesce(sum(duration_seconds), 0)` })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.patientId, patientId),
        gte(gameSessions.playedAt, weekAgo)
      )
    );

  // 本月平均正确率
  const [monthlyAccuracy] = await db
    .select({ avg: sql<number>`coalesce(avg(accuracy), 0)` })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.patientId, patientId),
        gte(gameSessions.playedAt, monthAgo)
      )
    );

  // 各类别训练次数
  const categoryStats = await db
    .select({
      category: cognitiveGames.category,
      count: sql<number>`count(*)`,
      avgScore: sql<number>`avg(${gameSessions.score})`
    })
    .from(gameSessions)
    .leftJoin(cognitiveGames, eq(gameSessions.gameId, cognitiveGames.id))
    .where(
      and(
        eq(gameSessions.patientId, patientId),
        gte(gameSessions.playedAt, monthAgo)
      )
    )
    .groupBy(cognitiveGames.category);

  return {
    weeklySessionCount: Number(weeklyCount?.count || 0),
    weeklyDurationMinutes: Math.round(Number(weeklyDuration?.total || 0) / 60),
    monthlyAverageAccuracy: Math.round(Number(monthlyAccuracy?.avg || 0)),
    categoryStats
  };
}
