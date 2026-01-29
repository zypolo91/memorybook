import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryComments, users, notifications, memories } from '@/db/schema';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 获取评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const memoryId = parseInt(id);
    if (isNaN(memoryId)) {
      return NextResponse.json({ code: 1, message: '无效的记忆ID' });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 获取顶级评论
    const comments = await db
      .select({
        id: memoryComments.id,
        memoryId: memoryComments.memoryId,
        userId: memoryComments.userId,
        parentId: memoryComments.parentId,
        content: memoryComments.content,
        likeCount: memoryComments.likeCount,
        status: memoryComments.status,
        createdAt: memoryComments.createdAt,
        userName: users.username,
        userAvatar: users.avatar
      })
      .from(memoryComments)
      .leftJoin(users, eq(memoryComments.userId, users.id))
      .where(
        and(
          eq(memoryComments.memoryId, memoryId),
          eq(memoryComments.status, 'active'),
          isNull(memoryComments.parentId)
        )
      )
      .orderBy(desc(memoryComments.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 获取每个顶级评论的回复
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment: any) => {
        const replies = await db
          .select({
            id: memoryComments.id,
            memoryId: memoryComments.memoryId,
            userId: memoryComments.userId,
            parentId: memoryComments.parentId,
            content: memoryComments.content,
            likeCount: memoryComments.likeCount,
            status: memoryComments.status,
            createdAt: memoryComments.createdAt,
            userName: users.username,
            userAvatar: users.avatar
          })
          .from(memoryComments)
          .leftJoin(users, eq(memoryComments.userId, users.id))
          .where(
            and(
              eq(memoryComments.parentId, comment.id),
              eq(memoryComments.status, 'active')
            )
          )
          .orderBy(memoryComments.createdAt)
          .limit(10);

        // 为每个回复添加被回复者用户名（即父评论的用户名）
        const repliesWithReplyTo = replies.map(
          (reply: (typeof replies)[0]) => ({
            ...reply,
            replyToUserId: comment.userId,
            replyToUserName: comment.userName
          })
        );

        return {
          ...comment,
          replies: repliesWithReplyTo
        };
      })
    );

    return NextResponse.json({
      code: 0,
      data: commentsWithReplies,
      message: 'success'
    });
  } catch (error) {
    console.error('获取评论列表失败:', error);
    return NextResponse.json({ code: 1, message: '获取评论列表失败' });
  }
}

// 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user?.id) {
      return NextResponse.json({ code: 401, message: '请先登录' });
    }

    const { id } = await params;
    const memoryId = parseInt(id);
    if (isNaN(memoryId)) {
      return NextResponse.json({ code: 1, message: '无效的记忆ID' });
    }

    const body = await request.json();
    const { content, parentId, replyToUserId } = body;

    if (!content?.trim()) {
      return NextResponse.json({ code: 1, message: '评论内容不能为空' });
    }

    const userId = user.id;

    const [newComment] = await db
      .insert(memoryComments)
      .values({
        memoryId,
        userId,
        content: content.trim(),
        parentId: parentId || null
      })
      .returning();

    // 获取用户信息
    const [userInfo] = await db
      .select({ username: users.username, avatar: users.avatar })
      .from(users)
      .where(eq(users.id, userId));

    // 处理@提醒通知
    const mentionedUserIds = body.mentionedUserIds;
    if (
      mentionedUserIds &&
      Array.isArray(mentionedUserIds) &&
      mentionedUserIds.length > 0
    ) {
      // 获取记忆标题
      const [memory] = await db
        .select({ title: memories.title })
        .from(memories)
        .where(eq(memories.id, memoryId));

      // 为每个被@的用户创建通知
      for (const mentionedUserId of mentionedUserIds) {
        if (mentionedUserId !== userId) {
          await db.insert(notifications).values({
            userId: mentionedUserId,
            type: 'mention',
            title: `${userInfo?.username || '用户'}在评论中@了你`,
            content: content.trim().substring(0, 100),
            relatedId: memoryId,
            relatedType: 'memory',
            fromUserId: userId
          });
        }
      }
    }

    return NextResponse.json({
      code: 0,
      data: {
        ...newComment,
        userName: userInfo?.username,
        userAvatar: userInfo?.avatar,
        replies: []
      },
      message: '评论成功'
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    return NextResponse.json({ code: 1, message: '创建评论失败' });
  }
}
