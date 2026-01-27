import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyCircles, familyMembers, patients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/family - 获取用户的家庭圈列表
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

    // 获取用户加入的所有家庭圈
    const memberRecords = await db
      .select({ circleId: familyMembers.circleId })
      .from(familyMembers)
      .where(eq(familyMembers.userId, user.id));

    const circleIds = memberRecords.map((r: any) => r.circleId);

    if (circleIds.length === 0) {
      return NextResponse.json({
        code: 0,
        message: 'success',
        data: []
      });
    }

    // 获取家庭圈详情
    const circles = await Promise.all(
      circleIds.map(async (circleId: number) => {
        const [circle] = await db
          .select()
          .from(familyCircles)
          .where(eq(familyCircles.id, circleId));

        const members = await db
          .select()
          .from(familyMembers)
          .where(eq(familyMembers.circleId, circleId));

        const patientList = await db
          .select()
          .from(patients)
          .where(eq(patients.circleId, circleId));

        return {
          ...circle,
          members,
          patients: patientList
        };
      })
    );

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: circles
    });
  } catch (error) {
    console.error('获取家庭圈列表失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取家庭圈列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family - 创建家庭圈
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
    const { name, description, avatarUrl } = body;

    if (!name) {
      return NextResponse.json(
        { code: -1, message: '家庭圈名称不能为空' },
        { status: 400 }
      );
    }

    // 生成邀请码
    const inviteCode = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase();

    // 创建家庭圈
    const [newCircle] = await db
      .insert(familyCircles)
      .values({
        name,
        description,
        avatarUrl,
        inviteCode,
        creatorId: user.id
      })
      .returning();

    // 创建者自动成为管理员
    await db.insert(familyMembers).values({
      circleId: newCircle.id,
      userId: user.id,
      role: 'admin'
    });

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newCircle
    });
  } catch (error) {
    console.error('创建家庭圈失败:', error);
    return NextResponse.json(
      { code: -1, message: '创建家庭圈失败' },
      { status: 500 }
    );
  }
}
