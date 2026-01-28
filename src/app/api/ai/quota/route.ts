/**
 * AI 配额管理 API
 * 记录和管理用户的 AI 对话使用次数
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema.pg';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// 每日限制次数
const DAILY_LIMIT = 20;

// GET - 获取用户的 AI 配额信息
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    // 从数据库获取用户的 AI 使用记录
    // 这里我们使用 users 表的扩展字段来存储
    // 如果没有专门的表，可以使用 preferences 字段或创建新表

    const today = new Date().toISOString().split('T')[0];

    // 简化实现：使用内存/缓存计数
    // 实际生产环境应该使用 Redis 或专门的计数表
    const quotaKey = `ai_quota_${user.id}_${today}`;

    // 模拟从缓存获取使用次数
    const used = global.aiQuotaCache?.[quotaKey] || 0;

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        daily: {
          total: DAILY_LIMIT,
          used: used,
          remaining: Math.max(0, DAILY_LIMIT - used)
        },
        resetTime: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
      }
    });
  } catch (error) {
    console.error('GET /api/ai/quota error:', error);
    return NextResponse.json(
      { code: 500, message: '获取配额信息失败' },
      { status: 500 }
    );
  }
}

// POST - 增加 AI 使用次数
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const quotaKey = `ai_quota_${user.id}_${today}`;

    // 初始化全局缓存
    if (!global.aiQuotaCache) {
      global.aiQuotaCache = {};
    }

    const currentUsed = global.aiQuotaCache[quotaKey] || 0;

    // 检查是否超过限制
    if (currentUsed >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          code: 429,
          message: '今日 AI 对话次数已用完，请明天再试',
          data: {
            daily: {
              total: DAILY_LIMIT,
              used: currentUsed,
              remaining: 0
            }
          }
        },
        { status: 429 }
      );
    }

    // 增加使用次数
    global.aiQuotaCache[quotaKey] = currentUsed + 1;

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        daily: {
          total: DAILY_LIMIT,
          used: currentUsed + 1,
          remaining: Math.max(0, DAILY_LIMIT - currentUsed - 1)
        }
      }
    });
  } catch (error) {
    console.error('POST /api/ai/quota error:', error);
    return NextResponse.json(
      { code: 500, message: '记录使用次数失败' },
      { status: 500 }
    );
  }
}

// 声明全局缓存类型
declare global {
  var aiQuotaCache: Record<string, number> | undefined;
}
