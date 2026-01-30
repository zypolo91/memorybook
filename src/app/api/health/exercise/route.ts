/**
 * 运动管理 API
 * 管理运动记录、运动计划和运动视频
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { exerciseRecords, exercisePlans, exerciseVideos } from '@/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取运动记录/计划/视频
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
    const type = searchParams.get('type') || 'records'; // records, plans, videos, stats
    const patientId = searchParams.get('patientId');
    const exerciseType = searchParams.get('exerciseType');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (type) {
      case 'records':
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }

        const conditions = [eq(exerciseRecords.patientId, parseInt(patientId))];
        if (exerciseType) {
          conditions.push(eq(exerciseRecords.exerciseType, exerciseType));
        }

        const records = await db
          .select()
          .from(exerciseRecords)
          .where(and(...conditions))
          .orderBy(desc(exerciseRecords.exercisedAt))
          .limit(limit);

        return NextResponse.json({ code: 0, data: records });

      case 'plans':
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }

        const plans = await db
          .select()
          .from(exercisePlans)
          .where(eq(exercisePlans.patientId, parseInt(patientId)))
          .orderBy(desc(exercisePlans.createdAt));

        return NextResponse.json({ code: 0, data: plans });

      case 'videos':
        const videoConditions = [eq(exerciseVideos.isActive, true)];
        if (exerciseType) {
          videoConditions.push(eq(exerciseVideos.exerciseType, exerciseType));
        }

        const videos = await db
          .select()
          .from(exerciseVideos)
          .where(and(...videoConditions))
          .orderBy(exerciseVideos.sortOrder);

        return NextResponse.json({ code: 0, data: videos });

      case 'stats':
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }
        const stats = await getExerciseStats(parseInt(patientId));
        return NextResponse.json({ code: 0, data: stats });

      default:
        return NextResponse.json(
          { code: 400, message: '无效的类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET /api/health/exercise error:', error);
    return NextResponse.json(
      { code: 500, message: '获取数据失败' },
      { status: 500 }
    );
  }
}

// POST - 添加运动记录或计划
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
    const recordType = body.recordType || 'record'; // record, plan

    if (recordType === 'plan') {
      // 创建运动计划
      const {
        patientId,
        name,
        description,
        exercises,
        weeklyGoalMinutes,
        startDate,
        endDate
      } = body;

      if (!patientId || !name || !exercises) {
        return NextResponse.json(
          { code: 400, message: '缺少必要参数' },
          { status: 400 }
        );
      }

      // 停用之前的计划
      await db
        .update(exercisePlans)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(exercisePlans.patientId, parseInt(patientId)));

      const [plan] = await db
        .insert(exercisePlans)
        .values({
          patientId: parseInt(patientId),
          creatorId: user.id,
          name,
          description,
          exercises,
          weeklyGoalMinutes: weeklyGoalMinutes || 150,
          isActive: true,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null
        })
        .returning();

      return NextResponse.json({
        code: 0,
        message: '运动计划已创建',
        data: plan
      });
    } else {
      // 添加运动记录
      const {
        patientId,
        exerciseType,
        exerciseName,
        durationMinutes,
        intensity,
        heartRateAvg,
        heartRateMax,
        caloriesBurned,
        steps,
        distanceMeters,
        notes,
        exercisedAt
      } = body;

      if (!patientId || !exerciseType || !exerciseName || !durationMinutes) {
        return NextResponse.json(
          { code: 400, message: '缺少必要参数' },
          { status: 400 }
        );
      }

      const [record] = await db
        .insert(exerciseRecords)
        .values({
          patientId: parseInt(patientId),
          creatorId: user.id,
          exerciseType,
          exerciseName,
          durationMinutes,
          intensity,
          heartRateAvg,
          heartRateMax,
          caloriesBurned,
          steps,
          distanceMeters,
          notes,
          exercisedAt: exercisedAt ? new Date(exercisedAt) : new Date()
        })
        .returning();

      return NextResponse.json({
        code: 0,
        message: '运动记录已保存',
        data: record
      });
    }
  } catch (error) {
    console.error('POST /api/health/exercise error:', error);
    return NextResponse.json(
      { code: 500, message: '保存失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除运动记录
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'record';

    if (!id) {
      return NextResponse.json(
        { code: 400, message: '缺少ID' },
        { status: 400 }
      );
    }

    if (type === 'plan') {
      await db.delete(exercisePlans).where(eq(exercisePlans.id, parseInt(id)));
    } else {
      await db
        .delete(exerciseRecords)
        .where(eq(exerciseRecords.id, parseInt(id)));
    }

    return NextResponse.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('DELETE /api/health/exercise error:', error);
    return NextResponse.json(
      { code: 500, message: '删除失败' },
      { status: 500 }
    );
  }
}

// 获取运动统计
async function getExerciseStats(patientId: number) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 本周运动时长
  const [weeklyDuration] = await db
    .select({ total: sql<number>`coalesce(sum(duration_minutes), 0)` })
    .from(exerciseRecords)
    .where(
      and(
        eq(exerciseRecords.patientId, patientId),
        gte(exerciseRecords.exercisedAt, weekAgo)
      )
    );

  // 本周运动次数
  const [weeklyCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(exerciseRecords)
    .where(
      and(
        eq(exerciseRecords.patientId, patientId),
        gte(exerciseRecords.exercisedAt, weekAgo)
      )
    );

  // 本周消耗卡路里
  const [weeklyCalories] = await db
    .select({ total: sql<number>`coalesce(sum(calories_burned), 0)` })
    .from(exerciseRecords)
    .where(
      and(
        eq(exerciseRecords.patientId, patientId),
        gte(exerciseRecords.exercisedAt, weekAgo)
      )
    );

  // 各类型运动统计
  const typeStats = await db
    .select({
      exerciseType: exerciseRecords.exerciseType,
      count: sql<number>`count(*)`,
      totalMinutes: sql<number>`sum(duration_minutes)`
    })
    .from(exerciseRecords)
    .where(
      and(
        eq(exerciseRecords.patientId, patientId),
        gte(exerciseRecords.exercisedAt, monthAgo)
      )
    )
    .groupBy(exerciseRecords.exerciseType);

  // 获取当前活跃计划
  const [activePlan] = await db
    .select()
    .from(exercisePlans)
    .where(
      and(
        eq(exercisePlans.patientId, patientId),
        eq(exercisePlans.isActive, true)
      )
    )
    .limit(1);

  const weeklyGoal = activePlan?.weeklyGoalMinutes || 150;
  const weeklyTotal = Number(weeklyDuration?.total || 0);
  const completionRate = Math.min(
    Math.round((weeklyTotal / weeklyGoal) * 100),
    100
  );

  return {
    weeklyDurationMinutes: weeklyTotal,
    weeklySessionCount: Number(weeklyCount?.count || 0),
    weeklyCaloriesBurned: Number(weeklyCalories?.total || 0),
    weeklyGoalMinutes: weeklyGoal,
    completionRate,
    typeStats,
    activePlan
  };
}
