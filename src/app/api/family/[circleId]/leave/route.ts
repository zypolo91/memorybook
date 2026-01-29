import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyCircles, familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/family/[circleId]/leave - 退出家庭圈
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

    // 检查是否是创建者
    const [circle] = await db
      .select()
      .from(familyCircles)
      .where(eq(familyCircles.id, circleId));

    if (circle && circle.creatorId === user.id) {
      return NextResponse.json(
        { code: -1, message: '创建者不能退出家庭圈，请先转让管理员权限' },
        { status: 400 }
      );
    }

    // 删除成员记录
    await db
      .delete(familyMembers)
      .where(
        and(
          eq(familyMembers.circleId, circleId),
          eq(familyMembers.userId, user.id)
        )
      );

    // 更新成员数量
    if (circle) {
      await db
        .update(familyCircles)
        .set({ memberCount: Math.max(0, (circle.memberCount || 1) - 1) })
        .where(eq(familyCircles.id, circleId));
    }

    return NextResponse.json({
      code: 0,
      message: '已退出家庭圈'
    });
  } catch (error) {
    console.error('退出家庭圈失败:', error);
    return NextResponse.json(
      { code: -1, message: '退出家庭圈失败' },
      { status: 500 }
    );
  }
}
