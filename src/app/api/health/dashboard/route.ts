/**
 * 健康仪表盘 API
 * 综合健康评分和数据汇总
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  cognitiveAssessments,
  gameSessions,
  dietRecords,
  exerciseRecords,
  healthScores,
  patients
} from '@/db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取健康仪表盘数据
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
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { code: 400, message: '缺少患者ID' },
        { status: 400 }
      );
    }

    const pid = parseInt(patientId);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 尝试获取患者信息
    let patient: any = null;
    try {
      const [p] = await db
        .select()
        .from(patients)
        .where(eq(patients.id, pid))
        .limit(1);
      patient = p;
    } catch (dbError) {
      console.error('Database error:', dbError);
      // 数据库错误，返回空数据而非 mock 数据
      return NextResponse.json({
        code: 0,
        data: {
          patient: null,
          scores: {
            overall: 0,
            cognitive: 0,
            training: 0,
            diet: 0,
            exercise: 0
          },
          latestAssessment: null,
          scoreTrend: [],
          alerts: [],
          todayTasks: [],
          isEmpty: true,
          message: '暂无健康数据，请先完成认知评估或记录健康数据'
        }
      });
    }

    if (!patient) {
      // 患者不存在，返回空数据而非 mock 数据
      return NextResponse.json({
        code: 0,
        data: {
          patient: null,
          scores: {
            overall: 0,
            cognitive: 0,
            training: 0,
            diet: 0,
            exercise: 0
          },
          latestAssessment: null,
          scoreTrend: [],
          alerts: [],
          todayTasks: [],
          isEmpty: true,
          message: '暂无健康数据，请先完成认知评估或记录健康数据'
        }
      });
    }

    // 获取最近认知评估
    const [latestAssessment] = await db
      .select()
      .from(cognitiveAssessments)
      .where(eq(cognitiveAssessments.patientId, pid))
      .orderBy(desc(cognitiveAssessments.assessedAt))
      .limit(1);

    // 计算各项评分
    const cognitiveScore = await calculateCognitiveScore(pid, latestAssessment);
    const trainingScore = await calculateTrainingScore(pid, weekAgo);
    const dietScore = await calculateDietScore(pid, weekAgo);
    const exerciseScore = await calculateExerciseScore(pid, weekAgo);

    // 检查是否所有数据都为空（所有评分都是0）
    const hasNoData =
      cognitiveScore === 0 &&
      trainingScore === 0 &&
      dietScore === 0 &&
      exerciseScore === 0;

    if (hasNoData) {
      return NextResponse.json({
        code: 0,
        data: {
          patient: {
            id: patient.id,
            name: patient.name,
            cognitiveStatus: patient.cognitiveStatus
          },
          scores: {
            overall: 0,
            cognitive: 0,
            training: 0,
            diet: 0,
            exercise: 0
          },
          latestAssessment: null,
          scoreTrend: [],
          alerts: [],
          todayTasks: [],
          isEmpty: true,
          message: '暂无健康数据，请先完成认知评估或记录健康数据'
        }
      });
    }

    // 计算综合评分
    const overallScore = Math.round(
      cognitiveScore * 0.4 +
        trainingScore * 0.2 +
        dietScore * 0.2 +
        exerciseScore * 0.2
    );

    // 保存今日评分
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db
      .insert(healthScores)
      .values({
        patientId: pid,
        scoreDate: today,
        cognitiveScore,
        trainingScore,
        dietScore,
        exerciseScore,
        overallScore,
        details: {
          latestAssessmentId: latestAssessment?.id,
          calculatedAt: new Date().toISOString()
        }
      })
      .onConflictDoUpdate({
        target: [healthScores.patientId, healthScores.scoreDate],
        set: {
          cognitiveScore,
          trainingScore,
          dietScore,
          exerciseScore,
          overallScore,
          details: {
            latestAssessmentId: latestAssessment?.id,
            calculatedAt: new Date().toISOString()
          }
        }
      });

    // 获取历史评分趋势
    const scoreTrend = await db
      .select()
      .from(healthScores)
      .where(
        and(
          eq(healthScores.patientId, pid),
          gte(healthScores.scoreDate, monthAgo)
        )
      )
      .orderBy(healthScores.scoreDate);

    // 生成风险预警
    const alerts = generateAlerts(
      cognitiveScore,
      trainingScore,
      dietScore,
      exerciseScore,
      latestAssessment
    );

    // 生成今日任务
    const todayTasks = generateTodayTasks(
      trainingScore,
      dietScore,
      exerciseScore
    );

    return NextResponse.json({
      code: 0,
      data: {
        patient: {
          id: patient.id,
          name: patient.name,
          cognitiveStatus: patient.cognitiveStatus,
          lastAssessmentDate: patient.lastAssessmentDate,
          lastAssessmentScore: patient.lastAssessmentScore
        },
        scores: {
          overall: overallScore,
          cognitive: cognitiveScore,
          training: trainingScore,
          diet: dietScore,
          exercise: exerciseScore
        },
        latestAssessment: latestAssessment
          ? {
              id: latestAssessment.id,
              scaleType: latestAssessment.scaleType,
              totalScore: latestAssessment.totalScore,
              maxScore: latestAssessment.maxScore,
              severity: latestAssessment.severity,
              assessedAt: latestAssessment.assessedAt
            }
          : null,
        scoreTrend,
        alerts,
        todayTasks
      }
    });
  } catch (error) {
    console.error('GET /api/health/dashboard error:', error);
    return NextResponse.json(
      { code: 500, message: '获取数据失败' },
      { status: 500 }
    );
  }
}

// 计算认知评分 (0-100)
async function calculateCognitiveScore(
  patientId: number,
  latestAssessment: any
): Promise<number> {
  if (!latestAssessment) return 0; // 无评估数据，返回0

  const { totalScore, maxScore, scaleType } = latestAssessment;
  const percentage = (totalScore / maxScore) * 100;

  // 根据量表类型调整
  switch (scaleType) {
    case 'mmse':
      // MMSE 27-30 = 90-100, 21-26 = 70-89, 10-20 = 40-69, 0-9 = 0-39
      if (totalScore >= 27) return 90 + ((totalScore - 27) / 3) * 10;
      if (totalScore >= 21) return 70 + ((totalScore - 21) / 6) * 20;
      if (totalScore >= 10) return 40 + ((totalScore - 10) / 11) * 30;
      return (totalScore / 10) * 40;

    case 'moca':
      // MoCA 26-30 = 90-100, 18-25 = 60-89, 10-17 = 30-59, 0-9 = 0-29
      if (totalScore >= 26) return 90 + ((totalScore - 26) / 4) * 10;
      if (totalScore >= 18) return 60 + ((totalScore - 18) / 8) * 30;
      if (totalScore >= 10) return 30 + ((totalScore - 10) / 8) * 30;
      return (totalScore / 10) * 30;

    default:
      return Math.round(percentage);
  }
}

// 计算训练评分 (0-100)
async function calculateTrainingScore(
  patientId: number,
  weekAgo: Date
): Promise<number> {
  const [result] = await db
    .select({
      count: sql<number>`count(*)`,
      totalMinutes: sql<number>`coalesce(sum(duration_seconds) / 60, 0)`
    })
    .from(gameSessions)
    .where(
      and(
        eq(gameSessions.patientId, patientId),
        gte(gameSessions.playedAt, weekAgo)
      )
    );

  const sessionCount = Number(result?.count || 0);
  const totalMinutes = Number(result?.totalMinutes || 0);

  // 目标：每周7次训练，每次10分钟 = 70分钟
  const targetSessions = 7;
  const targetMinutes = 70;

  const sessionScore = Math.min((sessionCount / targetSessions) * 50, 50);
  const minuteScore = Math.min((totalMinutes / targetMinutes) * 50, 50);

  return Math.round(sessionScore + minuteScore);
}

// 计算饮食评分 (0-100)
async function calculateDietScore(
  patientId: number,
  weekAgo: Date
): Promise<number> {
  const records = await db
    .select()
    .from(dietRecords)
    .where(
      and(
        eq(dietRecords.patientId, patientId),
        gte(dietRecords.recordDate, weekAgo)
      )
    );

  if (records.length === 0) return 0; // 无记录，返回0

  // 计算平均 MIND 评分
  let totalMindScore = 0;
  let count = 0;

  for (const record of records) {
    if (record.mindScore !== null) {
      totalMindScore += record.mindScore;
      count++;
    }
  }

  if (count === 0) return 0;

  const avgMindScore = totalMindScore / count;
  // MIND 评分 0-15 映射到 0-100
  return Math.round((avgMindScore / 15) * 100);
}

// 计算运动评分 (0-100)
async function calculateExerciseScore(
  patientId: number,
  weekAgo: Date
): Promise<number> {
  const [result] = await db
    .select({
      totalMinutes: sql<number>`coalesce(sum(duration_minutes), 0)`,
      count: sql<number>`count(*)`
    })
    .from(exerciseRecords)
    .where(
      and(
        eq(exerciseRecords.patientId, patientId),
        gte(exerciseRecords.exercisedAt, weekAgo)
      )
    );

  const totalMinutes = Number(result?.totalMinutes || 0);
  const sessionCount = Number(result?.count || 0);

  // 目标：每周150分钟中等强度运动，5次
  const targetMinutes = 150;
  const targetSessions = 5;

  const minuteScore = Math.min((totalMinutes / targetMinutes) * 70, 70);
  const sessionScore = Math.min((sessionCount / targetSessions) * 30, 30);

  return Math.round(minuteScore + sessionScore);
}

// 生成风险预警
function generateAlerts(
  cognitiveScore: number,
  trainingScore: number,
  dietScore: number,
  exerciseScore: number,
  latestAssessment: any
): Array<{ type: string; level: string; message: string }> {
  const alerts: Array<{ type: string; level: string; message: string }> = [];

  // 认知评分预警
  if (cognitiveScore < 50) {
    alerts.push({
      type: 'cognitive',
      level: 'high',
      message: '认知评分较低，建议尽快进行专业评估'
    });
  } else if (cognitiveScore < 70) {
    alerts.push({
      type: 'cognitive',
      level: 'medium',
      message: '认知功能有所下降，请关注日常表现'
    });
  }

  // 训练预警
  if (trainingScore < 30) {
    alerts.push({
      type: 'training',
      level: 'medium',
      message: '本周认知训练不足，建议每天进行10分钟训练'
    });
  }

  // 饮食预警
  if (dietScore < 40) {
    alerts.push({
      type: 'diet',
      level: 'medium',
      message: '饮食记录不足或MIND饮食评分偏低'
    });
  }

  // 运动预警
  if (exerciseScore < 30) {
    alerts.push({
      type: 'exercise',
      level: 'medium',
      message: '本周运动量不足，建议增加有氧运动'
    });
  }

  // 评估时间预警
  if (latestAssessment) {
    const daysSinceAssessment = Math.floor(
      (Date.now() - new Date(latestAssessment.assessedAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (daysSinceAssessment > 90) {
      alerts.push({
        type: 'assessment',
        level: 'low',
        message: `距离上次认知评估已${daysSinceAssessment}天，建议进行复评`
      });
    }
  } else {
    alerts.push({
      type: 'assessment',
      level: 'medium',
      message: '尚未进行认知评估，建议完成首次评估'
    });
  }

  return alerts;
}

// 生成今日任务
function generateTodayTasks(
  trainingScore: number,
  dietScore: number,
  exerciseScore: number
): Array<{ type: string; title: string; completed: boolean }> {
  const tasks: Array<{ type: string; title: string; completed: boolean }> = [];

  // 认知训练任务
  tasks.push({
    type: 'training',
    title: '完成1次认知训练游戏',
    completed: trainingScore >= 70
  });

  // 饮食任务
  tasks.push({
    type: 'diet',
    title: '记录今日三餐',
    completed: dietScore >= 60
  });

  tasks.push({
    type: 'diet',
    title: '吃1份绿叶蔬菜',
    completed: false // 需要具体检查
  });

  // 运动任务
  tasks.push({
    type: 'exercise',
    title: '完成30分钟运动',
    completed: exerciseScore >= 60
  });

  tasks.push({
    type: 'exercise',
    title: '做5分钟手指操',
    completed: false
  });

  return tasks;
}
