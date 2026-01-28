import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { healthRecords, patients, familyMembers } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/health/records - 获取健康记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // 如果未指定患者ID，则获取用户有权限访问的所有患者的记录
    // 暂时简化：如果没指定 patientId，就返回用户创建的记录
    // 理想情况：查询用户所在的 familyCircles -> patients -> records

    let conditions = [];
    
    if (patientId) {
      // 检查权限：用户是否在患者所在的家庭圈中
      const pid = parseInt(patientId);
      const [patient] = await db.select().from(patients).where(eq(patients.id, pid));
      
      if (!patient) {
        return NextResponse.json({ code: 404, message: '患者不存在' }, { status: 404 });
      }

      const [membership] = await db.select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.circleId, patient.circleId),
          eq(familyMembers.userId, user.id)
        ));

      if (!membership) {
        return NextResponse.json({ code: 403, message: '无权访问此患者数据' }, { status: 403 });
      }

      conditions.push(eq(healthRecords.patientId, pid));
    } else {
      // 如果没有指定 patientId，默认只查自己创建的？或者查所有关联患者的？
      // 为了简化，暂时查 creatorId = user.id
      conditions.push(eq(healthRecords.creatorId, user.id));
    }

    if (type) {
      conditions.push(eq(healthRecords.type, type));
    }

    const records = await db
      .select()
      .from(healthRecords)
      .where(and(...conditions))
      .orderBy(desc(healthRecords.recordedAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: records
    });
  } catch (error) {
    console.error('获取健康记录失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取健康记录失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/health/records - 创建健康记录
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { patientId, type, value, unit, data, notes, recordedAt } = body;

    if (!type || !value) {
      return NextResponse.json(
        { code: -1, message: '类型和数值不能为空' },
        { status: 400 }
      );
    }

    // 检查权限
    if (patientId) {
      const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));
      if (!patient) {
        return NextResponse.json({ code: 404, message: '患者不存在' }, { status: 404 });
      }
      
      const [membership] = await db.select()
        .from(familyMembers)
        .where(and(
          eq(familyMembers.circleId, patient.circleId),
          eq(familyMembers.userId, user.id)
        ));

      if (!membership) {
        return NextResponse.json({ code: 403, message: '无权操作此患者数据' }, { status: 403 });
      }
    }

    const [newRecord] = await db
      .insert(healthRecords)
      .values({
        patientId: patientId || null,
        creatorId: user.id,
        type,
        value,
        unit,
        data,
        notes,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '记录成功',
      data: newRecord
    });
  } catch (error) {
    console.error('创建健康记录失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建健康记录失败' },
      { status: 500 }
    );
  }
}
