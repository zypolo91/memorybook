import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyCircles, familyMembers, patients, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/family/[circleId] - 获取家庭圈详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { circleId: circleIdStr } = await params;
    const circleId = parseInt(circleIdStr);
    if (isNaN(circleId)) {
      return NextResponse.json(
        { code: -1, message: '无效的家庭圈ID' },
        { status: 400 }
      );
    }

    // 检查是否是成员
    const memberCheck = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.circleId, circleId),
          eq(familyMembers.userId, user.id)
        )
      );

    if (memberCheck.length === 0) {
      return NextResponse.json(
        { code: -1, message: '你不是该家庭圈的成员' },
        { status: 403 }
      );
    }

    // 获取家庭圈详情
    const [circle] = await db
      .select()
      .from(familyCircles)
      .where(eq(familyCircles.id, circleId));

    if (!circle) {
      return NextResponse.json(
        { code: -1, message: '家庭圈不存在' },
        { status: 404 }
      );
    }

    // 获取成员列表（包含用户名和头像）
    const members = await db
      .select({
        id: familyMembers.id,
        userId: familyMembers.userId,
        circleId: familyMembers.circleId,
        nickname: familyMembers.nickname,
        relationship: familyMembers.relationship,
        role: familyMembers.role,
        joinedAt: familyMembers.joinedAt,
        username: users.username,
        avatarUrl: users.avatar
      })
      .from(familyMembers)
      .leftJoin(users, eq(familyMembers.userId, users.id))
      .where(eq(familyMembers.circleId, circleId));

    // 获取患者列表
    const patientList = await db
      .select()
      .from(patients)
      .where(eq(patients.circleId, circleId));

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        ...circle,
        members,
        patients: patientList
      }
    });
  } catch (error) {
    console.error('获取家庭圈详情失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取家庭圈详情失败' },
      { status: 500 }
    );
  }
}
