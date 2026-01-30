/**
 * 生物标志物 API
 * 管理 CSF/血液/影像学检查记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { biomarkerRecords } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取生物标志物记录
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
    const category = searchParams.get('category');
    const biomarkerType = searchParams.get('biomarkerType');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!patientId) {
      return NextResponse.json(
        { code: 400, message: '缺少患者ID' },
        { status: 400 }
      );
    }

    const conditions = [eq(biomarkerRecords.patientId, parseInt(patientId))];
    if (category) {
      conditions.push(eq(biomarkerRecords.category, category));
    }
    if (biomarkerType) {
      conditions.push(eq(biomarkerRecords.biomarkerType, biomarkerType));
    }

    const list = await db
      .select()
      .from(biomarkerRecords)
      .where(and(...conditions))
      .orderBy(desc(biomarkerRecords.testedAt))
      .limit(limit);

    return NextResponse.json({ code: 0, data: list });
  } catch (error) {
    console.error('GET /api/health/biomarker error:', error);
    return NextResponse.json(
      { code: 500, message: '获取记录失败' },
      { status: 500 }
    );
  }
}

// POST - 添加生物标志物记录
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
      category,
      biomarkerType,
      value,
      unit,
      referenceRange,
      hospitalName,
      doctorName,
      reportImageUrl,
      testedAt,
      notes
    } = body;

    if (!patientId || !category || !biomarkerType || value === undefined) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 自动判断解读结果
    const interpretation = interpretBiomarker(category, biomarkerType, value);

    const [record] = await db
      .insert(biomarkerRecords)
      .values({
        patientId: parseInt(patientId),
        creatorId: user.id,
        category,
        biomarkerType,
        value: parseFloat(value),
        unit,
        referenceRange:
          referenceRange || getDefaultReferenceRange(biomarkerType),
        interpretation,
        hospitalName,
        doctorName,
        reportImageUrl,
        testedAt: testedAt ? new Date(testedAt) : new Date(),
        notes
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '记录添加成功',
      data: record
    });
  } catch (error) {
    console.error('POST /api/health/biomarker error:', error);
    return NextResponse.json(
      { code: 500, message: '添加记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除生物标志物记录
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

    if (!id) {
      return NextResponse.json(
        { code: 400, message: '缺少记录ID' },
        { status: 400 }
      );
    }

    await db
      .delete(biomarkerRecords)
      .where(eq(biomarkerRecords.id, parseInt(id)));

    return NextResponse.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('DELETE /api/health/biomarker error:', error);
    return NextResponse.json(
      { code: 500, message: '删除失败' },
      { status: 500 }
    );
  }
}

// 解读生物标志物结果
function interpretBiomarker(
  category: string,
  type: string,
  value: number
): string {
  // CSF 生物标志物
  if (category === 'csf') {
    switch (type) {
      case 'ab42':
        // Aβ42: >500 pg/mL 正常, <500 异常
        return value > 500 ? 'normal' : 'abnormal';
      case 'ttau':
        // T-tau: <300 pg/mL 正常
        return value < 300 ? 'normal' : 'abnormal';
      case 'ptau181':
        // P-tau181: <60 pg/mL 正常
        return value < 60 ? 'normal' : 'abnormal';
      case 'ab42_ab40_ratio':
        // Aβ42/Aβ40: >0.089 正常
        return value > 0.089 ? 'normal' : 'abnormal';
    }
  }

  // 影像学指标
  if (category === 'imaging') {
    switch (type) {
      case 'mta_score':
        // MTA评分: 0-1正常, 2边界, 3-4异常
        if (value <= 1) return 'normal';
        if (value === 2) return 'borderline';
        return 'abnormal';
      case 'hippocampal_volume':
        // 海马体积需要根据年龄和性别判断，这里简化处理
        return 'normal';
    }
  }

  return 'normal';
}

// 获取默认参考范围
function getDefaultReferenceRange(type: string): string {
  const ranges: Record<string, string> = {
    ab42: '>500 pg/mL',
    ttau: '<300 pg/mL',
    ptau181: '<60 pg/mL',
    ab42_ab40_ratio: '>0.089',
    nfl: '<20 pg/mL',
    mta_score: '0-1',
    gfap: '<100 pg/mL'
  };
  return ranges[type] || '';
}
