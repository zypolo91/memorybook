/**
 * 分享链接 API
 * 用于生成和验证分享链接
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shareLinks, medicalRecords, memories } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

/**
 * POST /api/share - 创建分享链接
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
    const { resourceType, resourceId, password, maxViews, expiresInHours } =
      body;

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证资源所有权
    const isOwner = await verifyResourceOwnership(
      resourceType,
      resourceId,
      user.id
    );
    if (!isOwner) {
      return NextResponse.json(
        { code: 403, message: '无权分享此资源' },
        { status: 403 }
      );
    }

    // 生成分享码
    const code = crypto.randomBytes(16).toString('hex');

    // 计算过期时间
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    // 创建分享链接
    const [shareLink] = await db
      .insert(shareLinks)
      .values({
        code,
        resourceType,
        resourceId,
        userId: user.id,
        password: password || null,
        maxViews: maxViews || null,
        expiresAt
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '分享链接创建成功',
      data: {
        code: shareLink.code,
        url: `/share/${shareLink.code}`,
        hasPassword: !!password,
        maxViews: maxViews || null,
        expiresAt: expiresAt?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('Create share link error:', error);
    return NextResponse.json(
      { code: 500, message: '创建分享链接失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/share?code=xxx - 获取分享内容
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const password = searchParams.get('password');

    if (!code) {
      return NextResponse.json(
        { code: 400, message: '缺少分享码' },
        { status: 400 }
      );
    }

    // 查找分享链接
    const [shareLink] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.code, code));

    if (!shareLink) {
      return NextResponse.json(
        { code: 404, message: '分享链接不存在' },
        { status: 404 }
      );
    }

    // 检查是否已停用
    if (!shareLink.isActive) {
      return NextResponse.json(
        { code: 410, message: '分享链接已失效' },
        { status: 410 }
      );
    }

    // 检查是否过期
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      return NextResponse.json(
        { code: 410, message: '分享链接已过期' },
        { status: 410 }
      );
    }

    // 检查查看次数
    if (
      shareLink.maxViews &&
      (shareLink.viewCount || 0) >= shareLink.maxViews
    ) {
      return NextResponse.json(
        { code: 410, message: '分享链接已达到最大查看次数' },
        { status: 410 }
      );
    }

    // 检查密码
    if (shareLink.password) {
      if (!password) {
        return NextResponse.json({
          code: 0,
          data: {
            requirePassword: true,
            resourceType: shareLink.resourceType
          }
        });
      }
      if (password !== shareLink.password) {
        return NextResponse.json(
          { code: 403, message: '密码错误' },
          { status: 403 }
        );
      }
    }

    // 获取资源内容
    const resource = await getSharedResource(
      shareLink.resourceType,
      shareLink.resourceId
    );
    if (!resource) {
      return NextResponse.json(
        { code: 404, message: '资源不存在' },
        { status: 404 }
      );
    }

    // 增加查看次数
    await db
      .update(shareLinks)
      .set({ viewCount: sql`${shareLinks.viewCount} + 1` })
      .where(eq(shareLinks.id, shareLink.id));

    return NextResponse.json({
      code: 0,
      data: {
        resourceType: shareLink.resourceType,
        resource,
        viewCount: (shareLink.viewCount || 0) + 1,
        maxViews: shareLink.maxViews
      }
    });
  } catch (error) {
    console.error('Get share content error:', error);
    return NextResponse.json(
      { code: 500, message: '获取分享内容失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/share?code=xxx - 删除分享链接
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { code: 400, message: '缺少分享码' },
        { status: 400 }
      );
    }

    // 验证所有权并删除
    const result = await db
      .delete(shareLinks)
      .where(and(eq(shareLinks.code, code), eq(shareLinks.userId, user.id)));

    return NextResponse.json({
      code: 0,
      message: '分享链接已删除'
    });
  } catch (error) {
    console.error('Delete share link error:', error);
    return NextResponse.json(
      { code: 500, message: '删除分享链接失败' },
      { status: 500 }
    );
  }
}

/**
 * 验证资源所有权
 */
async function verifyResourceOwnership(
  resourceType: string,
  resourceId: number,
  userId: number
): Promise<boolean> {
  switch (resourceType) {
    case 'medical_record': {
      const [record] = await db
        .select({ userId: medicalRecords.userId })
        .from(medicalRecords)
        .where(eq(medicalRecords.id, resourceId));
      return record?.userId === userId;
    }
    case 'memory': {
      const [memory] = await db
        .select({ userId: memories.userId })
        .from(memories)
        .where(eq(memories.id, resourceId));
      return memory?.userId === userId;
    }
    default:
      return false;
  }
}

/**
 * 获取分享的资源内容
 */
async function getSharedResource(
  resourceType: string,
  resourceId: number
): Promise<any> {
  switch (resourceType) {
    case 'medical_record': {
      const [record] = await db
        .select()
        .from(medicalRecords)
        .where(eq(medicalRecords.id, resourceId));
      return record;
    }
    case 'memory': {
      const [memory] = await db
        .select()
        .from(memories)
        .where(eq(memories.id, resourceId));
      return memory;
    }
    default:
      return null;
  }
}
