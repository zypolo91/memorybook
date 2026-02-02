import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { memoryComments, memories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

/**
 * DELETE /api/memories/[id]/comments/[commentId] - 删除评论
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未登录' },
        { status: 401 }
      );
    }

    const { id, commentId } = await params;
    const memoryId = parseInt(id);
    const cId = parseInt(commentId);

    if (isNaN(memoryId) || isNaN(cId)) {
      return NextResponse.json(
        { code: 400, message: '参数错误' },
        { status: 400 }
      );
    }

    // 获取评论信息
    const [comment] = await db
      .select()
      .from(memoryComments)
      .where(
        and(eq(memoryComments.id, cId), eq(memoryComments.memoryId, memoryId))
      )
      .limit(1);

    if (!comment) {
      return NextResponse.json(
        { code: 404, message: '评论不存在' },
        { status: 404 }
      );
    }

    // 获取记忆信息（检查是否是记忆作者）
    const [memory] = await db
      .select()
      .from(memories)
      .where(eq(memories.id, memoryId))
      .limit(1);

    // 检查权限：评论发布者或记忆作者可以删除
    const isCommentOwner = comment.userId === user.id;
    const isMemoryOwner = memory && memory.userId === user.id;

    if (!isCommentOwner && !isMemoryOwner) {
      return NextResponse.json(
        { code: 403, message: '无权删除此评论' },
        { status: 403 }
      );
    }

    // 软删除评论（将状态改为deleted）
    await db
      .update(memoryComments)
      .set({ status: 'deleted' })
      .where(eq(memoryComments.id, cId));

    // 同时删除该评论的所有回复
    await db
      .update(memoryComments)
      .set({ status: 'deleted' })
      .where(eq(memoryComments.parentId, cId));

    return NextResponse.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('删除评论失败:', error);
    return NextResponse.json(
      { code: 500, message: '删除失败' },
      { status: 500 }
    );
  }
}
