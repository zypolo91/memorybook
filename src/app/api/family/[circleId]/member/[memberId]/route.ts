import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyCircles, familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * DELETE /api/family/[circleId]/member/[memberId] - 剔除成员（仅管理员）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ circleId: string; memberId: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { circleId: circleIdStr, memberId: memberIdStr } = await params;
    const circleId = parseInt(circleIdStr);
    const memberId = parseInt(memberIdStr);

    if (isNaN(circleId) || isNaN(memberId)) {
      return NextResponse.json(
        { code: -1, message: '无效的参数' },
        { status: 400 }
      );
    }

    // 检查是否是管理员
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

    if (circle.creatorId !== user.id) {
      return NextResponse.json(
        { code: -1, message: '只有管理员可以剔除成员' },
        { status: 403 }
      );
    }

    // 不能剔除自己
    const [targetMember] = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.id, memberId));

    if (!targetMember) {
      return NextResponse.json(
        { code: -1, message: '成员不存在' },
        { status: 404 }
      );
    }

    if (targetMember.userId === user.id) {
      return NextResponse.json(
        { code: -1, message: '不能剔除自己' },
        { status: 400 }
      );
    }

    // 删除成员
    await db
      .delete(familyMembers)
      .where(eq(familyMembers.id, memberId));

    // 更新成员数量
    await db
      .update(familyCircles)
      .set({ memberCount: Math.max(0, (circle.memberCount || 1) - 1) })
      .where(eq(familyCircles.id, circleId));

    return NextResponse.json({
      code: 0,
      message: '已剔除成员'
    });
  } catch (error) {
    console.error('剔除成员失败:', error);
    return NextResponse.json(
      { code: -1, message: '剔除成员失败' },
      { status: 500 }
    );
  }
}
