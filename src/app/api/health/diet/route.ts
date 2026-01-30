/**
 * 饮食管理 API
 * 管理 MIND 饮食记录和食谱推荐
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dietRecords, mindFoodCategories, recipes } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取饮食记录/食物分类/食谱
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'records'; // records, categories, recipes, summary
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (type) {
      case 'records':
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }

        const conditions = [eq(dietRecords.patientId, parseInt(patientId))];
        if (startDate) {
          conditions.push(gte(dietRecords.recordDate, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lte(dietRecords.recordDate, new Date(endDate)));
        }

        const records = await db
          .select()
          .from(dietRecords)
          .where(and(...conditions))
          .orderBy(desc(dietRecords.recordDate))
          .limit(limit);

        return NextResponse.json({ code: 0, data: records });

      case 'categories':
        const categories = await db
          .select()
          .from(mindFoodCategories)
          .orderBy(mindFoodCategories.sortOrder);

        return NextResponse.json({ code: 0, data: categories });

      case 'recipes':
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');

        let recipesQuery = db
          .select()
          .from(recipes)
          .where(eq(recipes.isActive, true));

        if (category) {
          recipesQuery = recipesQuery.where(eq(recipes.category, category));
        }
        if (featured === 'true') {
          recipesQuery = recipesQuery.where(eq(recipes.isFeatured, true));
        }

        const recipeList = await recipesQuery
          .orderBy(desc(recipes.createdAt))
          .limit(limit);
        return NextResponse.json({ code: 0, data: recipeList });

      case 'summary':
        if (!patientId) {
          return NextResponse.json(
            { code: 400, message: '缺少患者ID' },
            { status: 400 }
          );
        }
        const summary = await getWeeklySummary(parseInt(patientId));
        return NextResponse.json({ code: 0, data: summary });

      default:
        return NextResponse.json(
          { code: 400, message: '无效的类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('GET /api/health/diet error:', error);
    return NextResponse.json(
      { code: 500, message: '获取数据失败' },
      { status: 500 }
    );
  }
}

// POST - 添加饮食记录
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      recordDate,
      mealType,
      foods,
      calories,
      notes,
      photoUrl
    } = body;

    if (!patientId || !mealType || !foods || !Array.isArray(foods)) {
      return NextResponse.json(
        { code: 400, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 计算 MIND 饮食评分
    const mindScore = calculateMindScore(foods);

    const [record] = await db
      .insert(dietRecords)
      .values({
        patientId: parseInt(patientId),
        creatorId: user.id,
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        mealType,
        foods,
        mindScore,
        calories,
        notes,
        photoUrl
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '饮食记录已保存',
      data: record
    });
  } catch (error) {
    console.error('POST /api/health/diet error:', error);
    return NextResponse.json(
      { code: 500, message: '保存记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除饮食记录
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { code: 400, message: '缺少记录ID' },
        { status: 400 }
      );
    }

    await db.delete(dietRecords).where(eq(dietRecords.id, parseInt(id)));
    return NextResponse.json({ code: 0, message: '删除成功' });
  } catch (error) {
    console.error('DELETE /api/health/diet error:', error);
    return NextResponse.json(
      { code: 500, message: '删除失败' },
      { status: 500 }
    );
  }
}

// 计算 MIND 饮食评分 (0-15)
function calculateMindScore(foods: any[]): number {
  let score = 0;
  const categoryCount: Record<string, number> = {};

  // 统计各类食物份数
  for (const food of foods) {
    const category = food.category;
    if (category) {
      categoryCount[category] =
        (categoryCount[category] || 0) + (food.portion || 1);
    }
  }

  // 推荐食物评分 (每类1分，共10分)
  const recommendedCategories = [
    'green_leafy',
    'other_vegetables',
    'nuts',
    'berries',
    'beans',
    'whole_grains',
    'fish',
    'poultry',
    'olive_oil',
    'wine'
  ];

  for (const cat of recommendedCategories) {
    if (categoryCount[cat] && categoryCount[cat] > 0) {
      score += 1;
    }
  }

  // 限制食物评分 (每类不超标1分，共5分)
  const limitedCategories = [
    { code: 'red_meat', weeklyLimit: 4 },
    { code: 'butter', dailyLimit: 1 },
    { code: 'cheese', weeklyLimit: 1 },
    { code: 'pastries', weeklyLimit: 5 },
    { code: 'fried_food', weeklyLimit: 1 }
  ];

  for (const cat of limitedCategories) {
    const count = categoryCount[cat.code] || 0;
    const limit = cat.dailyLimit || (cat.weeklyLimit ? cat.weeklyLimit / 7 : 1);
    if (count <= limit) {
      score += 1;
    }
  }

  return Math.min(score, 15);
}

// 获取周度饮食总结
async function getWeeklySummary(patientId: number) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const records = await db
    .select()
    .from(dietRecords)
    .where(
      and(
        eq(dietRecords.patientId, patientId),
        gte(dietRecords.recordDate, weekAgo)
      )
    );

  // 统计各类食物摄入
  const categoryServings: Record<string, number> = {};
  let totalMindScore = 0;
  let mealCount = 0;

  for (const record of records) {
    if (record.mindScore) {
      totalMindScore += record.mindScore;
      mealCount++;
    }

    const foods = record.foods as any[];
    if (Array.isArray(foods)) {
      for (const food of foods) {
        if (food.category) {
          categoryServings[food.category] =
            (categoryServings[food.category] || 0) + (food.portion || 1);
        }
      }
    }
  }

  // 生成建议
  const recommendations: string[] = [];

  if (!categoryServings['green_leafy'] || categoryServings['green_leafy'] < 7) {
    recommendations.push('建议每天至少吃1份绿叶蔬菜');
  }
  if (!categoryServings['berries'] || categoryServings['berries'] < 2) {
    recommendations.push('建议每周至少吃2份浆果（如蓝莓、草莓）');
  }
  if (!categoryServings['fish'] || categoryServings['fish'] < 1) {
    recommendations.push('建议每周至少吃1份鱼类');
  }
  if (!categoryServings['nuts'] || categoryServings['nuts'] < 5) {
    recommendations.push('建议每周吃5份坚果');
  }

  return {
    categoryServings,
    averageMindScore:
      mealCount > 0 ? Math.round(totalMindScore / mealCount) : 0,
    totalMeals: mealCount,
    recommendations
  };
}
