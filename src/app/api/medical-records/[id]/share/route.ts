import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { medicalRecords, shareLinks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// 生成短随机ID
function generateShareCode(): string {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * 分享病例记录到家属圈
 * POST /api/medical-records/[id]/share
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);
    if (isNaN(recordId)) {
      return NextResponse.json(
        { code: 400, message: '无效的记录ID' },
        { status: 400 }
      );
    }

    // 获取病例记录
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, recordId))
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { code: 404, message: '病例记录不存在' },
        { status: 404 }
      );
    }

    // 验证用户是否有权限分享（只有创建者可以分享）
    if (record.userId !== user.id) {
      return NextResponse.json(
        { code: 403, message: '无权分享此病例记录' },
        { status: 403 }
      );
    }

    // 检查是否已经分享
    const existingShare = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.resourceType, 'medical_record'),
          eq(shareLinks.resourceId, recordId),
          eq(shareLinks.userId, user.id),
          eq(shareLinks.isActive, true)
        )
      )
      .limit(1);

    if (existingShare.length > 0) {
      return NextResponse.json({
        code: 0,
        message: '已分享到家属圈',
        data: { shareCode: existingShare[0].code }
      });
    }

    // 创建分享链接
    const shareCode = generateShareCode();
    await db.insert(shareLinks).values({
      code: shareCode,
      resourceType: 'medical_record',
      resourceId: recordId,
      userId: user.id,
      isActive: true
    });

    // 更新病例记录的分享状态
    await db
      .update(medicalRecords)
      .set({
        isShared: true,
        sharedAt: new Date()
      })
      .where(eq(medicalRecords.id, recordId));

    return NextResponse.json({
      code: 0,
      message: '分享成功',
      data: { shareCode }
    });
  } catch (error) {
    console.error('Share medical record error:', error);
    return NextResponse.json(
      { code: 500, message: '分享失败' },
      { status: 500 }
    );
  }
}

/**
 * 取消分享病例记录
 * DELETE /api/medical-records/[id]/share
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);
    if (isNaN(recordId)) {
      return NextResponse.json(
        { code: 400, message: '无效的记录ID' },
        { status: 400 }
      );
    }

    // 获取病例记录
    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, recordId))
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { code: 404, message: '病例记录不存在' },
        { status: 404 }
      );
    }

    // 验证用户是否有权限取消分享
    if (record.userId !== user.id) {
      return NextResponse.json(
        { code: 403, message: '无权操作此病例记录' },
        { status: 403 }
      );
    }

    // 删除分享链接
    await db
      .update(shareLinks)
      .set({ isActive: false })
      .where(
        and(
          eq(shareLinks.resourceType, 'medical_record'),
          eq(shareLinks.resourceId, recordId),
          eq(shareLinks.userId, user.id)
        )
      );

    // 更新病例记录的分享状态
    await db
      .update(medicalRecords)
      .set({
        isShared: false,
        sharedAt: null
      })
      .where(eq(medicalRecords.id, recordId));

    return NextResponse.json({
      code: 0,
      message: '已取消分享'
    });
  } catch (error) {
    console.error('Unshare medical record error:', error);
    return NextResponse.json(
      { code: 500, message: '取消分享失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取分享状态
 * GET /api/medical-records/[id]/share
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);
    if (isNaN(recordId)) {
      return NextResponse.json(
        { code: 400, message: '无效的记录ID' },
        { status: 400 }
      );
    }

    // 获取分享信息
    const [share] = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.resourceType, 'medical_record'),
          eq(shareLinks.resourceId, recordId),
          eq(shareLinks.isActive, true)
        )
      )
      .limit(1);

    return NextResponse.json({
      code: 0,
      data: {
        isShared: !!share,
        shareCode: share?.code,
        viewCount: share?.viewCount,
        createdAt: share?.createdAt
      }
    });
  } catch (error) {
    console.error('Get share status error:', error);
    return NextResponse.json(
      { code: 500, message: '获取分享状态失败' },
      { status: 500 }
    );
  }
}
