import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: 保存认知评估详细记录
// 兼容现有 cognitive_assessments 表结构
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patient_id,
      assessment_type, // 前端传来的字段名
      total_score,
      max_score,
      dimension_scores,
      item_responses,
      duration_seconds,
      severity_level,
      assessor_id // 可选，默认为1
    } = body;

    // 验证必填字段
    if (
      !patient_id ||
      !assessment_type ||
      total_score === undefined ||
      !max_score
    ) {
      return NextResponse.json(
        { code: 1, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 生成解读和建议（存入 assessor_notes）
    const interpretation = generateInterpretation(
      assessment_type,
      total_score,
      max_score,
      severity_level
    );
    const recommendations = generateRecommendations(
      severity_level,
      dimension_scores
    );

    // 组合成备注
    const assessorNotes = JSON.stringify({
      interpretation,
      recommendations,
      item_responses,
      duration_seconds
    });

    // 插入数据库 - 使用现有表的字段名
    const { data, error } = await supabase
      .from('cognitive_assessments')
      .insert({
        patient_id,
        assessor_id: assessor_id || 1, // 默认评估者ID
        scale_type: assessment_type.toLowerCase(), // 转换为小写: MMSE -> mmse
        total_score,
        max_score,
        dimension_scores,
        severity: severity_level, // severity_level -> severity
        assessor_notes: assessorNotes,
        assessed_at: new Date().toISOString() // assessment_date -> assessed_at
      })
      .select()
      .single();

    if (error) {
      console.error('保存评估失败:', error);
      return NextResponse.json(
        { code: 1, message: '保存评估失败: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '保存成功',
      data
    });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      { code: 1, message: '服务器错误' },
      { status: 500 }
    );
  }
}

// GET: 获取认知评估历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patient_id');
    const assessmentType = searchParams.get('assessment_type');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!patientId) {
      return NextResponse.json(
        { code: 1, message: '缺少patient_id参数' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('cognitive_assessments')
      .select('*')
      .eq('patient_id', patientId)
      .order('assessed_at', { ascending: false }) // 使用现有表的字段名
      .limit(limit);

    if (assessmentType) {
      query = query.eq('scale_type', assessmentType.toLowerCase()); // 使用现有表的字段名
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取评估记录失败:', error);
      return NextResponse.json(
        { code: 1, message: '获取评估记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      code: 0,
      data
    });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      { code: 1, message: '服务器错误' },
      { status: 500 }
    );
  }
}

// 生成结果解读
function generateInterpretation(
  assessmentType: string,
  totalScore: number,
  maxScore: number,
  severityLevel: string
): string {
  const percentage = Math.round((totalScore / maxScore) * 100);

  if (assessmentType === 'MMSE') {
    if (totalScore >= 27) {
      return `MMSE评估得分${totalScore}分（满分30分），处于正常范围。患者的定向力、记忆力、注意力、语言能力等认知功能整体良好。建议继续保持健康的生活方式，包括规律运动、社交活动和认知训练，并定期（每6-12个月）进行认知评估以监测变化。`;
    } else if (totalScore >= 21) {
      return `MMSE评估得分${totalScore}分（满分30分），提示轻度认知障碍。患者在部分认知领域可能存在轻微下降。建议：1）进一步进行专业的神经心理学评估；2）排除可逆性原因（如甲状腺功能、维生素B12缺乏等）；3）开始认知训练和生活方式干预；4）3-6个月后复查评估。`;
    } else if (totalScore >= 10) {
      return `MMSE评估得分${totalScore}分（满分30分），提示中度认知障碍。患者的认知功能已有明显下降，可能影响日常生活能力。建议：1）尽快就医进行全面的认知功能评估和病因诊断；2）考虑开始药物治疗；3）评估日常生活能力和照护需求；4）制定安全防护措施。`;
    } else {
      return `MMSE评估得分${totalScore}分（满分30分），提示重度认知障碍。患者的认知功能严重受损，需要全面的生活照护支持。建议：1）立即就医进行专科诊治；2）评估并满足全面的照护需求；3）关注照护者的身心健康；4）考虑长期照护规划。`;
    }
  }

  return `评估得分${totalScore}/${maxScore}分（${percentage}%），严重程度：${severityLevel}。`;
}

// 生成建议
function generateRecommendations(
  severityLevel: string,
  dimensionScores?: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  // 基于严重程度的通用建议
  switch (severityLevel) {
    case 'normal':
      recommendations.push('保持规律的有氧运动，每周至少150分钟');
      recommendations.push('坚持社交活动，与家人朋友保持联系');
      recommendations.push('进行认知训练游戏，保持大脑活跃');
      recommendations.push('遵循MIND饮食，多吃蔬菜、浆果、坚果');
      recommendations.push('保证充足睡眠，每晚7-8小时');
      break;
    case 'mild':
      recommendations.push('建议3个月内进行专业神经心理学评估');
      recommendations.push('检查可逆性原因：甲状腺功能、维生素B12、叶酸');
      recommendations.push('开始系统的认知训练计划');
      recommendations.push('建立日常生活规律，使用提醒工具');
      recommendations.push('考虑参加认知障碍患者支持小组');
      break;
    case 'moderate':
      recommendations.push('尽快预约神经内科或记忆门诊就诊');
      recommendations.push('评估是否需要开始药物治疗');
      recommendations.push('进行日常生活能力评估');
      recommendations.push('制定安全防护措施（防走失、防跌倒）');
      recommendations.push('考虑照护者培训和支持');
      break;
    case 'severe':
      recommendations.push('立即就医进行专科诊治');
      recommendations.push('评估全面的照护需求');
      recommendations.push('考虑专业照护服务或机构');
      recommendations.push('关注照护者身心健康');
      recommendations.push('了解长期照护资源和政策');
      break;
  }

  // 基于维度得分的特定建议
  if (dimensionScores) {
    if (
      (dimensionScores['orientation_time'] || 0) +
        (dimensionScores['orientation_place'] || 0) <
      7
    ) {
      recommendations.push(
        '定向力下降：在家中放置日历、时钟，帮助患者保持时间和地点意识'
      );
    }
    if (
      (dimensionScores['registration'] || 0) +
        (dimensionScores['recall'] || 0) <
      4
    ) {
      recommendations.push(
        '记忆力下降：使用记事本、手机提醒等辅助工具，重要事项多次重复'
      );
    }
    if ((dimensionScores['attention'] || 0) < 3) {
      recommendations.push(
        '注意力下降：减少环境干扰，一次只做一件事，任务分解为小步骤'
      );
    }
    if ((dimensionScores['language'] || 0) < 6) {
      recommendations.push(
        '语言能力下降：说话时放慢语速，使用简单句子，给予充足反应时间'
      );
    }
  }

  return recommendations;
}
