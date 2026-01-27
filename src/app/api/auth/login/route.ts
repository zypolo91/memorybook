import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { logger } from '@/lib/logger';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user.length) {
      await logger.warn('用户认证', '用户登录', '登录失败：用户不存在', {
        reason: '用户不存在',
        email,
        timestamp: new Date().toISOString()
      });

      return unauthorizedResponse('邮箱或密码错误');
    }

    if (user[0].status === 'disabled') {
      await logger.warn(
        '用户认证',
        '用户登录',
        '登录失败：用户已被禁用',
        {
          reason: '用户已被禁用',
          email,
          userId: user[0].id,
          username: user[0].username,
          timestamp: new Date().toISOString()
        },
        user[0].id
      );

      return unauthorizedResponse('该账号已被禁用，请联系管理员');
    }

    const isValid = await bcrypt.compare(password, user[0].password);
    if (!isValid) {
      await logger.warn(
        '用户认证',
        '用户登录',
        '登录失败：密码错误',
        {
          reason: '密码错误',
          email,
          userId: user[0].id,
          username: user[0].username,
          timestamp: new Date().toISOString()
        },
        user[0].id
      );

      return unauthorizedResponse('邮箱或密码错误');
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user[0].id));

    const token = sign(
      {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
        roleId: user[0].roleId,
        avatar: user[0].avatar,
        isSuperAdmin: user[0].isSuperAdmin
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    await logger.info(
      '用户认证',
      '用户登录',
      '用户登录成功',
      {
        userId: user[0].id,
        username: user[0].username,
        email: user[0].email,
        roleId: user[0].roleId,
        loginTime: new Date().toISOString(),
        tokenExpiry: '30天'
      },
      user[0].id
    );

    const payload = {
      message: '登录成功',
      user: {
        id: user[0].id,
        email: user[0].email,
        username: user[0].username,
        avatar: user[0].avatar,
        roleId: user[0].roleId,
        status: user[0].status,
        isSuperAdmin: user[0].isSuperAdmin
      },
      token
    };

    const response = successResponse(payload);

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    await logger.error('用户认证', '用户登录', '登录过程发生服务器错误', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return errorResponse('服务器错误');
  }
}
