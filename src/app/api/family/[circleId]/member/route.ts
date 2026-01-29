import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/family/[circleId]/member - 更新成员信息
 */
export async function POST(
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

    const body = await request.json();
    const { nickname, relationship } = body;

    // 更新成员信息
    const updateData: any = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (relationship !== undefined) updateData.relationship = relationship;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { code: -1, message: '没有需要更新的信息' },
        { status: 400 }
      );
    }

    await db
      .update(familyMembers)
      .set(updateData)
      .where(
        and(
          eq(familyMembers.circleId, circleId),
          eq(familyMembers.userId, user.id)
        )
      );

    return NextResponse.json({
      code: 0,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新成员信息失败:', error);
    return NextResponse.json(
      { code: -1, message: '更新成员信息失败' },
      { status: 500 }
    );
  }
}
