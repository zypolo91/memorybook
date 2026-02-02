/**
 * 病例记录统计 API
 * 获取各分类的记录数量
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicalRecords } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取病例分类统计
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

    const { patientId } = await params;
    const pid = parseInt(patientId);

    // 使用Drizzle ORM查询统计
    const result = await db
      .select({
        fileType: medicalRecords.fileType,
        count: sql<number>`count(*)`
      })
      .from(medicalRecords)
      .where(
        and(
          pid
            ? eq(medicalRecords.patientId, pid)
            : eq(medicalRecords.userId, user.id),
          eq(medicalRecords.status, 'active')
        )
      )
      .groupBy(medicalRecords.fileType);

    // 转换为对象格式
    const stats: Record<string, number> = {};
    for (const row of result) {
      const category = row.fileType || 'other';
      stats[category] = Number(row.count);
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: stats
    });
  } catch (error) {
    console.error('GET /api/medical-records/stats/[patientId] error:', error);
    return NextResponse.json(
      { code: 500, message: '获取统计失败' },
      { status: 500 }
    );
  }
}
