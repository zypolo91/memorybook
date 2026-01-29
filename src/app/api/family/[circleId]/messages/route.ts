import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { familyMessages, familyMembers, users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/family/[circleId]/messages - 获取消息列表
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const offset = (page - 1) * pageSize;

    // 获取消息列表
    const messages = await db
      .select({
        id: familyMessages.id,
        circleId: familyMessages.circleId,
        userId: familyMessages.userId,
        type: familyMessages.type,
        content: familyMessages.content,
        replyToId: familyMessages.replyToId,
        isDeleted: familyMessages.isDeleted,
        createdAt: familyMessages.createdAt,
        userNickname: familyMembers.nickname,
        userName: users.username,
        userAvatar: users.avatar
      })
      .from(familyMessages)
      .leftJoin(
        familyMembers,
        and(
          eq(familyMessages.circleId, familyMembers.circleId),
          eq(familyMessages.userId, familyMembers.userId)
        )
      )
      .leftJoin(users, eq(familyMessages.userId, users.id))
      .where(eq(familyMessages.circleId, circleId))
      .orderBy(desc(familyMessages.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 处理回复信息
    const messagesWithReply = await Promise.all(
      messages.map(async (msg: any) => {
        let replyToContent = null;
        let replyToUser = null;

        if (msg.replyToId) {
          const [replyMsg] = await db
            .select({
              content: familyMessages.content,
              userId: familyMessages.userId
            })
            .from(familyMessages)
            .where(eq(familyMessages.id, msg.replyToId));

          if (replyMsg) {
            replyToContent = replyMsg.content;
            const [replyUser] = await db
              .select({
                nickname: familyMembers.nickname,
                username: users.username
              })
              .from(familyMembers)
              .leftJoin(users, eq(familyMembers.userId, users.id))
              .where(
                and(
                  eq(familyMembers.circleId, circleId),
                  eq(familyMembers.userId, replyMsg.userId)
                )
              );
            replyToUser = replyUser?.nickname || replyUser?.username || '成员';
          }
        }

        return {
          ...msg,
          userNickname: msg.userNickname || msg.userName || '成员',
          replyToContent,
          replyToUser
        };
      })
    );

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: messagesWithReply
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return NextResponse.json(
      { code: -1, message: '获取消息列表失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/family/[circleId]/messages - 发送消息
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

    const body = await request.json();
    const { type, content, replyToId } = body;

    if (!content) {
      return NextResponse.json(
        { code: -1, message: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 插入消息
    const [newMessage] = await db
      .insert(familyMessages)
      .values({
        circleId,
        userId: user.id,
        type: type || 'text',
        content,
        replyToId: replyToId || null
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '发送成功',
      data: newMessage
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      { code: -1, message: '发送消息失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/family/[circleId]/messages - 删除消息
 */
export async function DELETE(
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
    const { messageId, action } = body; // action: 'delete' | 'recall'

    if (!messageId) {
      return NextResponse.json(
        { code: -1, message: '消息ID不能为空' },
        { status: 400 }
      );
    }

    // 获取消息
    const [message] = await db
      .select()
      .from(familyMessages)
      .where(
        and(
          eq(familyMessages.id, messageId),
          eq(familyMessages.circleId, circleId)
        )
      );

    if (!message) {
      return NextResponse.json(
        { code: -1, message: '消息不存在' },
        { status: 404 }
      );
    }

    // 撤回只能撤回自己的消息，且在2分钟内
    if (action === 'recall') {
      if (message.userId !== user.id) {
        return NextResponse.json(
          { code: -1, message: '只能撤回自己的消息' },
          { status: 403 }
        );
      }
      const createdAt = new Date(message.createdAt!);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / 1000 / 60;
      if (diffMinutes > 2) {
        return NextResponse.json(
          { code: -1, message: '消息发送超过2分钟，无法撤回' },
          { status: 400 }
        );
      }
    }

    // 更新消息状态
    await db
      .update(familyMessages)
      .set({
        isDeleted: true,
        content: action === 'recall' ? '[消息已撤回]' : '[消息已删除]'
      })
      .where(eq(familyMessages.id, messageId));

    return NextResponse.json({
      code: 0,
      message: action === 'recall' ? '撤回成功' : '删除成功'
    });
  } catch (error) {
    console.error('删除消息失败:', error);
    return NextResponse.json(
      { code: -1, message: '操作失败' },
      { status: 500 }
    );
  }
}
