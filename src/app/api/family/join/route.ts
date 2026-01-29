import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyCircles, familyMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/family/join - 通过邀请码加入家庭圈
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
    const { inviteCode } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { code: -1, message: '请输入邀请码' },
        { status: 400 }
      );
    }

    // 查找家庭圈
    const [circle] = await db
      .select()
      .from(familyCircles)
      .where(eq(familyCircles.inviteCode, inviteCode.toUpperCase()));

    if (!circle) {
      return NextResponse.json(
        { code: -1, message: '邀请码无效' },
        { status: 404 }
      );
    }

    // 检查是否已经是成员
    const existingMember = await db
      .select()
      .from(familyMembers)
      .where(
        and(
          eq(familyMembers.circleId, circle.id),
          eq(familyMembers.userId, user.id)
        )
      );

    if (existingMember.length > 0) {
      return NextResponse.json(
        { code: -1, message: '你已经是该家庭圈的成员' },
        { status: 400 }
      );
    }

    // 加入家庭圈
    await db.insert(familyMembers).values({
      circleId: circle.id,
      userId: user.id,
      role: 'member'
    });

    // 更新成员数量
    await db
      .update(familyCircles)
      .set({ memberCount: (circle.memberCount || 1) + 1 })
      .where(eq(familyCircles.id, circle.id));

    // 获取更新后的家庭圈信息
    const members = await db
      .select()
      .from(familyMembers)
      .where(eq(familyMembers.circleId, circle.id));

    return NextResponse.json({
      code: 0,
      message: '加入成功',
      data: {
        ...circle,
        memberCount: (circle.memberCount || 1) + 1,
        members
      }
    });
  } catch (error) {
    console.error('加入家庭圈失败:', error);
    return NextResponse.json(
      { code: -1, message: '加入家庭圈失败' },
      { status: 500 }
    );
  }
}
