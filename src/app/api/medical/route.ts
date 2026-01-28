/**
 * 病例档案 API
 * 管理阿尔茨海默患者的医疗档案、CT报告、病例、医嘱等
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  medicalRecords,
  medicalCategories,
  medicalTags,
  medicalRecordTags
} from '@/db/schema.memorybook';
import { eq, desc, and, or, like, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取病例档案列表
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const categoryId = searchParams.get('categoryId');
    const fileType = searchParams.get('fileType');
    const keyword = searchParams.get('keyword');
    const isImportant = searchParams.get('isImportant');

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [
      eq(medicalRecords.userId, user.id),
      eq(medicalRecords.status, 'active')
    ];

    if (categoryId) {
      conditions.push(eq(medicalRecords.categoryId, parseInt(categoryId)));
    }
    if (fileType) {
      conditions.push(eq(medicalRecords.fileType, fileType));
    }
    if (isImportant === 'true') {
      conditions.push(eq(medicalRecords.isImportant, true));
    }
    if (keyword) {
      conditions.push(
        or(
          like(medicalRecords.title, `%${keyword}%`),
          like(medicalRecords.description, `%${keyword}%`),
          like(medicalRecords.hospital, `%${keyword}%`),
          like(medicalRecords.diagnosis, `%${keyword}%`)
        )!
      );
    }

    // 查询列表
    const records = await db
      .select()
      .from(medicalRecords)
      .where(and(...conditions))
      .orderBy(desc(medicalRecords.recordDate), desc(medicalRecords.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(medicalRecords)
      .where(and(...conditions));

    // 获取每条记录的标签
    const recordsWithTags = await Promise.all(
      records.map(async (record: any) => {
        const recordTags = await db
          .select({ tag: medicalTags })
          .from(medicalRecordTags)
          .innerJoin(medicalTags, eq(medicalRecordTags.tagId, medicalTags.id))
          .where(eq(medicalRecordTags.recordId, record.id));

        return {
          ...record,
          tags: recordTags.map((t: any) => t.tag)
        };
      })
    );

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        list: recordsWithTags,
        total: Number(count),
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('GET /api/medical error:', error);
    return NextResponse.json(
      { code: 500, message: '获取病例档案失败' },
      { status: 500 }
    );
  }
}

// POST - 创建病例档案
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
      title,
      description,
      fileUrl,
      thumbnailUrl,
      fileType,
      fileName,
      fileSize,
      mimeType,
      recordDate,
      hospital,
      doctor,
      department,
      diagnosis,
      notes,
      categoryId,
      patientId,
      tagIds = [],
      isImportant = false
    } = body;

    if (!title) {
      return NextResponse.json(
        { code: 400, message: '标题不能为空' },
        { status: 400 }
      );
    }

    // 创建记录
    const [newRecord] = await db
      .insert(medicalRecords)
      .values({
        userId: user.id,
        title,
        description,
        fileUrl,
        thumbnailUrl,
        fileType: fileType || 'other',
        fileName,
        fileSize,
        mimeType,
        recordDate: recordDate ? new Date(recordDate) : null,
        hospital,
        doctor,
        department,
        diagnosis,
        notes,
        categoryId: categoryId ? parseInt(categoryId) : null,
        patientId: patientId ? parseInt(patientId) : null,
        isImportant
      })
      .returning();

    // 添加标签
    if (tagIds.length > 0) {
      await db.insert(medicalRecordTags).values(
        tagIds.map((tagId: number) => ({
          recordId: newRecord.id,
          tagId
        }))
      );

      // 更新标签使用次数
      for (const tagId of tagIds) {
        await db
          .update(medicalTags)
          .set({ usageCount: sql`${medicalTags.usageCount} + 1` })
          .where(eq(medicalTags.id, tagId));
      }
    }

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: newRecord
    });
  } catch (error) {
    console.error('POST /api/medical error:', error);
    return NextResponse.json(
      { code: 500, message: '创建病例档案失败' },
      { status: 500 }
    );
  }
}
