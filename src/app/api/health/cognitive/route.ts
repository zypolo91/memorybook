/**
 * 认知评估 API
 * 管理 MMSE/MoCA/ACE-R 量表评估
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cognitiveAssessments, patients } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取认知评估列表
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
    const scaleType = searchParams.get('scaleType');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!patientId) {
      return NextResponse.json(
        { code: 400, message: '缺少患者ID' },
        { status: 400 }
      );
    }

    const conditions = [
      eq(cognitiveAssessments.patientId, parseInt(patientId))
    ];
    if (scaleType) {
      conditions.push(eq(cognitiveAssessments.scaleType, scaleType));
    }

    const list = await db
      .select()
      .from(cognitiveAssessments)
      .where(and(...conditions))
      .orderBy(desc(cognitiveAssessments.assessedAt))
      .limit(limit);

    return NextResponse.json({ code: 0, data: list });
  } catch (error) {
    console.error('GET /api/health/cognitive error:', error);
    return NextResponse.json(
      { code: 500, message: '获取评估记录失败' },
      { status: 500 }
    );
  }
}

// POST - 提交认知评估结果
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
      scaleType,
      totalScore,
      maxScore,
      dimensionScores,
      assessorNotes,
      assessedAt
    } = body;

    if (!patientId || !scaleType || totalScore === undefined || !maxScore) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 计算严重程度
    const severity = calculateSeverity(scaleType, totalScore, maxScore);

    const [record] = await db
      .insert(cognitiveAssessments)
      .values({
        patientId: parseInt(patientId),
        assessorId: user.id,
        scaleType,
        totalScore,
        maxScore,
        dimensionScores,
        severity,
        assessorNotes,
        assessedAt: assessedAt ? new Date(assessedAt) : new Date()
      })
      .returning();

    // 更新患者的最后评估信息
    await db
      .update(patients)
      .set({
        lastAssessmentDate: record.assessedAt,
        lastAssessmentScore: totalScore,
        cognitiveStatus: mapSeverityToStatus(severity),
        updatedAt: new Date()
      })
      .where(eq(patients.id, parseInt(patientId)));

    return NextResponse.json({
      code: 0,
      message: '评估提交成功',
      data: record
    });
  } catch (error) {
    console.error('POST /api/health/cognitive error:', error);
    return NextResponse.json(
      { code: 500, message: '提交评估失败' },
      { status: 500 }
    );
  }
}

// 计算认知障碍严重程度
function calculateSeverity(
  scaleType: string,
  score: number,
  maxScore: number
): string {
  switch (scaleType) {
    case 'mmse':
      // MMSE: 27-30正常, 21-26轻度, 10-20中度, 0-9重度
      if (score >= 27) return 'normal';
      if (score >= 21) return 'mild';
      if (score >= 10) return 'moderate';
      return 'severe';

    case 'moca':
      // MoCA: ≥26正常, 18-25轻度, 10-17中度, <10重度
      if (score >= 26) return 'normal';
      if (score >= 18) return 'mild';
      if (score >= 10) return 'moderate';
      return 'severe';

    case 'acer':
      // ACE-R: ≥88正常, 83-87边界, ≤82异常
      if (score >= 88) return 'normal';
      if (score >= 83) return 'mild';
      if (score >= 70) return 'moderate';
      return 'severe';

    default:
      const percentage = (score / maxScore) * 100;
      if (percentage >= 90) return 'normal';
      if (percentage >= 70) return 'mild';
      if (percentage >= 50) return 'moderate';
      return 'severe';
  }
}

// 映射严重程度到认知状态
function mapSeverityToStatus(severity: string): string {
  switch (severity) {
    case 'normal':
      return 'normal';
    case 'mild':
      return 'mci';
    case 'moderate':
      return 'moderate_ad';
    case 'severe':
      return 'severe_ad';
    default:
      return 'mci';
  }
}
