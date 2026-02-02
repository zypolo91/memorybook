/**
 * AI分析 API
 * 基于病例记录进行智能分析
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicalRecords } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// POST - 执行AI分析
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
    const { patientId, analysisType = 'comprehensive' } = body;

    if (!patientId) {
      return NextResponse.json(
        { code: 400, message: '患者ID不能为空' },
        { status: 400 }
      );
    }

    // 获取患者所有病例记录
    const records = await db
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

    if (records.length === 0) {
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: {
          analysisType,
          analyzedAt: new Date().toISOString(),
          currentStage: '待评估',
          predictedStage: null,
          progressionRisk: null,
          monthsToProgression: null,
          confidence: 0,
          riskFactors: [],
          protectiveFactors: [],
          recommendations: ['请先添加病例记录以进行分析'],
          summary: '暂无足够数据进行分析，请添加更多病例记录。'
        }
      });
    }

    // 分析认知评估趋势
    const cognitiveRecords = records.filter(
      (r: any) => r.fileType === 'cognitive_assessment'
    );
    const cognitiveScores: { score: number; maxScore: number; date: Date }[] =
      [];

    for (const record of cognitiveRecords) {
      const indicators = (record.aiAnalysis as any) || {};
      const score = parseFloat(indicators.score);
      const maxScore = parseFloat(indicators.maxScore) || 30;
      if (!isNaN(score)) {
        cognitiveScores.push({
          score,
          maxScore,
          date: new Date(record.recordDate || new Date())
        });
      }
    }

    // 计算当前阶段
    let currentStage = '待评估';
    let latestPercentage = 0;
    if (cognitiveScores.length > 0) {
      const latest = cognitiveScores[0];
      latestPercentage = latest.score / latest.maxScore;
      if (latestPercentage >= 0.87) currentStage = '认知正常';
      else if (latestPercentage >= 0.73) currentStage = '轻度认知障碍';
      else if (latestPercentage >= 0.5) currentStage = '轻度阿尔茨海默症';
      else if (latestPercentage >= 0.33) currentStage = '中度阿尔茨海默症';
      else currentStage = '重度阿尔茨海默症';
    }

    // 分析趋势
    let trend = 'stable';
    let monthlyDecline = 0;
    if (cognitiveScores.length >= 2) {
      const first = cognitiveScores[cognitiveScores.length - 1];
      const last = cognitiveScores[0];
      const monthsDiff =
        (last.date.getTime() - first.date.getTime()) /
        (1000 * 60 * 60 * 24 * 30);

      if (monthsDiff > 0) {
        const firstPct = first.score / first.maxScore;
        const lastPct = last.score / last.maxScore;
        monthlyDecline = (firstPct - lastPct) / monthsDiff;

        if (monthlyDecline > 0.01) trend = 'declining';
        else if (monthlyDecline < -0.01) trend = 'improving';
      }
    }

    // 预测进展
    let predictedStage = null;
    let progressionRisk = 0;
    let monthsToProgression = null;

    if (trend === 'declining' && monthlyDecline > 0) {
      // 预测下一阶段
      const stageThresholds = [
        { threshold: 0.87, stage: '认知正常' },
        { threshold: 0.73, stage: '轻度认知障碍' },
        { threshold: 0.5, stage: '轻度阿尔茨海默症' },
        { threshold: 0.33, stage: '中度阿尔茨海默症' },
        { threshold: 0, stage: '重度阿尔茨海默症' }
      ];

      const currentThresholdIndex = stageThresholds.findIndex(
        (t) => latestPercentage >= t.threshold
      );
      if (currentThresholdIndex < stageThresholds.length - 1) {
        const nextThreshold = stageThresholds[currentThresholdIndex + 1];
        predictedStage = nextThreshold.stage;

        const pctToNext = latestPercentage - nextThreshold.threshold;
        monthsToProgression = Math.round(pctToNext / monthlyDecline);

        // 计算风险
        progressionRisk = Math.min(0.9, monthlyDecline * 10 + 0.2);
      }
    }

    // 分析风险因素
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];

    // 检查遗传因素
    const geneticRecords = records.filter((r: any) => r.fileType === 'genetic');
    for (const record of geneticRecords) {
      const indicators = (record.aiAnalysis as any) || {};
      if (indicators.genotype?.includes('ε4')) {
        riskFactors.push('APOE ε4基因携带者');
        progressionRisk = Math.min(0.9, progressionRisk + 0.15);
      }
    }

    // 检查生物标志物
    const biomarkerRecords = records.filter(
      (r: any) => r.fileType === 'biomarker' || r.fileType === 'blood_test'
    );
    for (const record of biomarkerRecords) {
      const indicators = (record.aiAnalysis as any) || {};
      const markerType = indicators.markerType || indicators.testItem || '';
      const value = parseFloat(indicators.value);

      if (markerType.includes('Aβ42') && value < 500) {
        riskFactors.push(`Aβ42水平偏低 (${value} pg/mL)`);
      }
      if (markerType.includes('p-Tau') && value > 20) {
        riskFactors.push(`p-Tau水平升高 (${value} pg/mL)`);
      }
    }

    // 检查影像学
    const imagingRecords = records.filter((r: any) => r.fileType === 'imaging');
    for (const record of imagingRecords) {
      const indicators = (record.aiAnalysis as any) || {};
      if (
        indicators.atrophyGrade === '中度' ||
        indicators.atrophyGrade === '重度'
      ) {
        riskFactors.push(`海马体${indicators.atrophyGrade}萎缩`);
      }
    }

    // 检查用药（保护因素）
    const medicationRecords = records.filter(
      (r: any) => r.fileType === 'medication'
    );
    if (medicationRecords.length > 0) {
      protectiveFactors.push('正在接受药物治疗');
    }

    // 趋势因素
    if (trend === 'declining') {
      riskFactors.push('认知评分呈下降趋势');
    } else if (trend === 'improving') {
      protectiveFactors.push('认知评分呈改善趋势');
    } else if (trend === 'stable') {
      protectiveFactors.push('认知评分保持稳定');
    }

    // 生成建议
    const recommendations: string[] = [];

    if (cognitiveScores.length < 3) {
      recommendations.push('建议增加认知评估频率，以便更准确地监测变化趋势');
    }

    if (trend === 'declining') {
      recommendations.push('认知功能呈下降趋势，建议咨询医生调整治疗方案');
      recommendations.push('增加认知训练活动，如阅读、下棋、拼图等');
    }

    if (medicationRecords.length === 0) {
      recommendations.push('建议咨询医生是否需要药物干预');
    }

    recommendations.push('保持规律作息，每晚保证7-8小时睡眠');
    recommendations.push('坚持适度运动，每周至少150分钟中等强度有氧运动');
    recommendations.push('保持社交活动，与家人朋友保持联系');

    if (imagingRecords.length === 0) {
      recommendations.push('建议进行脑部MRI检查，评估脑结构变化');
    }

    // 生成摘要
    let summary = `基于${records.length}条病例记录分析，患者目前处于${currentStage}阶段。`;

    if (cognitiveScores.length >= 2) {
      if (trend === 'declining') {
        summary += `认知评分近期呈下降趋势，平均每月下降${(monthlyDecline * 100).toFixed(1)}%。`;
      } else if (trend === 'improving') {
        summary += '认知评分近期呈改善趋势，治疗效果良好。';
      } else {
        summary += '认知评分保持相对稳定。';
      }
    }

    if (predictedStage) {
      summary += `预计${monthsToProgression}个月后可能进展至${predictedStage}。`;
    }

    if (riskFactors.length > 0) {
      summary += `存在${riskFactors.length}个风险因素需要关注。`;
    }

    // 计算置信度
    const confidence = Math.min(
      0.95,
      0.5 + records.length * 0.02 + cognitiveScores.length * 0.05
    );

    // 返回分析结果（不保存到数据库，直接返回）
    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        analysisType,
        analyzedAt: new Date().toISOString(),
        currentStage,
        predictedStage,
        progressionRisk,
        monthsToProgression,
        confidence,
        riskFactors,
        protectiveFactors,
        recommendations,
        summary
      }
    });
  } catch (error) {
    console.error('POST /api/medical-records/ai-analysis error:', error);
    return NextResponse.json(
      { code: 500, message: 'AI分析失败' },
      { status: 500 }
    );
  }
}
