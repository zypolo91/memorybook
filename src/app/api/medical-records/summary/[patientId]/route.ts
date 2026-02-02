/**
 * 患者健康摘要 API
 * 生成患者健康摘要，用于与医生沟通
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicalRecords } from '@/db/schema';
import { eq, and, desc, asc, sql, or } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取患者健康摘要
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { patientId: patientIdStr } = await params;
    const patientId = parseInt(patientIdStr);

    // 获取所有病例记录
    const allRecords = await db
      .select()
      .from(medicalRecords)
      .where(
        and(
          patientId
            ? eq(medicalRecords.patientId, patientId)
            : eq(medicalRecords.userId, user.id),
          eq(medicalRecords.status, 'active')
        )
      )
      .orderBy(desc(medicalRecords.recordDate));

    // 按类型分类
    const cognitiveRecords = allRecords.filter(
      (r: any) => r.fileType === 'cognitive_assessment'
    );
    const medicationRecords = allRecords.filter(
      (r: any) => r.fileType === 'medication'
    );
    const symptomRecords = allRecords.filter(
      (r: any) => r.fileType === 'symptom'
    );
    const findingsRecords = allRecords.filter((r: any) =>
      ['biomarker', 'imaging', 'genetic', 'blood_test'].includes(
        r.fileType || ''
      )
    );

    // 生成认知评分摘要
    const cognitiveScores: any[] = [];
    const processedTypes = new Set<string>();

    for (const record of cognitiveRecords) {
      const indicators = (record.aiAnalysis as any) || {};
      const testType = indicators.testType || indicators.type || 'MoCA';
      if (processedTypes.has(testType)) continue;
      processedTypes.add(testType);

      const score = parseFloat(indicators.score);
      const maxScore = parseFloat(indicators.maxScore) || 30;

      if (!isNaN(score)) {
        const previousRecord = cognitiveRecords.find((r: any) => {
          if (r.id === record.id) return false;
          const ind = (r.aiAnalysis as any) || {};
          return ind.testType === testType || ind.type === testType;
        });

        let previousScore = null;
        let trend = 'stable';

        if (previousRecord) {
          const prevInd = (previousRecord.aiAnalysis as any) || {};
          previousScore = parseFloat(prevInd.score);
          if (!isNaN(previousScore)) {
            if (score > previousScore) trend = 'improving';
            else if (score < previousScore) trend = 'declining';
          }
        }

        cognitiveScores.push({
          testType,
          latestScore: score,
          maxScore,
          previousScore: isNaN(previousScore!) ? null : previousScore,
          testDate: record.recordDate,
          trend
        });
      }
    }

    // 生成用药列表
    const currentMedications = medicationRecords.slice(0, 10).map((r: any) => {
      const indicators = (r.aiAnalysis as any) || {};
      const name = indicators.medicationName || r.title;
      const dosage = indicators.dosage || '';
      const frequency = indicators.frequency || '';
      return `${name} ${dosage} ${frequency}`.trim();
    });

    // 生成症状列表
    const recentSymptoms = symptomRecords.slice(0, 5).map((r: any) => {
      const indicators = (r.aiAnalysis as any) || {};
      return indicators.symptomType || r.description || r.title;
    });

    // 生成重要发现
    const keyFindings = findingsRecords.slice(0, 5).map((r: any) => {
      const indicators = (r.aiAnalysis as any) || {};
      const value = indicators.value;
      const unit = indicators.unit || '';
      if (value) {
        return `${r.title}: ${value} ${unit}`.trim();
      }
      return r.description || r.title;
    });

    // 判断当前阶段
    let currentStage = '待评估';
    if (cognitiveScores.length > 0) {
      const latestScore = cognitiveScores[0];
      const percentage = latestScore.latestScore / latestScore.maxScore;
      if (percentage >= 0.87) currentStage = '认知正常';
      else if (percentage >= 0.73) currentStage = '轻度认知障碍';
      else if (percentage >= 0.5) currentStage = '轻度阿尔茨海默症';
      else if (percentage >= 0.33) currentStage = '中度阿尔茨海默症';
      else currentStage = '重度阿尔茨海默症';
    }

    // 计算病程
    const oldestRecord =
      allRecords.length > 0
        ? allRecords.reduce((a: any, b: any) =>
            a.recordDate && b.recordDate && a.recordDate < b.recordDate ? a : b
          )
        : null;
    const firstDate = oldestRecord?.recordDate;
    const diseaseDurationDays = firstDate
      ? Math.floor(
          (Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        patientId,
        patientName: '患者',
        age: 0,
        gender: '',
        currentStage,
        diagnosisDate: firstDate,
        diseaseDurationDays,
        cognitiveScores,
        currentMedications,
        recentSymptoms,
        keyFindings,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('GET /api/medical-records/summary/[patientId] error:', error);
    return NextResponse.json(
      { code: 500, message: '获取健康摘要失败' },
      { status: 500 }
    );
  }
}
