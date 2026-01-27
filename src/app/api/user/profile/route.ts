import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const [userData] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        avatar: users.avatar,
        mobile: users.mobile,
        roleId: users.roleId,
        status: users.status,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return errorResponse('用户不存在');
    }

    return successResponse({
      id: userData.id,
      email: userData.email,
      nickname: userData.username,
      username: userData.username,
      avatar: userData.avatar,
      mobile: userData.mobile,
      roleId: userData.roleId,
      status: userData.status,
      createdAt: userData.createdAt
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return errorResponse('获取用户信息失败');
  }
}

export async function PUT(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const contentType = request.headers.get('content-type') || '';

    let body: any;
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch {
        return errorResponse('请求数据格式错误');
      }
    } else if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      try {
        body = await request.json();
      } catch {
        body = null;
      }
    }

    if (!body || typeof body !== 'object')
      return errorResponse('请求数据格式错误');

    const { username, nickname, avatar, mobile } = body;

    const updateData: Record<string, any> = {};
    // 支持 nickname 和 username 两个字段名，优先使用 nickname
    const displayName = nickname ?? username;
    if (displayName !== undefined && displayName !== null && displayName !== '')
      updateData.username = displayName;
    if (avatar !== undefined && avatar !== null && avatar !== '')
      updateData.avatar = avatar;
    if (mobile !== undefined && mobile !== null) updateData.mobile = mobile;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('没有需要更新的数据');
    }

    await db.update(users).set(updateData).where(eq(users.id, user.id));

    const [updatedUser] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        avatar: users.avatar,
        mobile: users.mobile
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!updatedUser) {
      return errorResponse('用户不存在');
    }

    return successResponse({
      id: updatedUser.id,
      email: updatedUser.email,
      nickname: updatedUser.username,
      username: updatedUser.username,
      avatar: updatedUser.avatar,
      mobile: updatedUser.mobile
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return errorResponse('更新用户信息失败');
  }
}
