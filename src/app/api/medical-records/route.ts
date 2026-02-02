/**
 * 病例记录 API
 * 管理阿尔茨海默患者的病例记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  medicalRecords,
  medicalCategories,
  medicalTags,
  medicalRecordTags
} from '@/db/schema';
import { eq, desc, and, sql, isNull } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取病例记录列表
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
    const patientId = searchParams.get('patientId');
    const categoryId = searchParams.get('categoryId');
    const fileType = searchParams.get('fileType');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions: any[] = [eq(medicalRecords.status, 'active')];

    if (patientId) {
      conditions.push(eq(medicalRecords.patientId, parseInt(patientId)));
    } else {
      conditions.push(eq(medicalRecords.userId, user.id));
    }

    if (categoryId) {
      conditions.push(eq(medicalRecords.categoryId, parseInt(categoryId)));
    }

    if (fileType) {
      conditions.push(eq(medicalRecords.fileType, fileType));
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

        // 获取分类信息
        let category = null;
        if (record.categoryId) {
          const [cat] = await db
            .select()
            .from(medicalCategories)
            .where(eq(medicalCategories.id, record.categoryId));
          category = cat;
        }

        return {
          id: record.id,
          patientId: record.patientId,
          title: record.title,
          category: category?.name || record.fileType || 'other',
          description: record.description || record.notes,
          recordDate: record.recordDate,
          hospital: record.hospital,
          doctor: record.doctor,
          department: record.department,
          indicators: record.aiAnalysis || {},
          isImportant: record.isImportant,
          files: record.fileUrl
            ? [
                {
                  name: record.fileName || 'file',
                  url: record.fileUrl,
                  type: record.fileType || 'file',
                  size: record.fileSize || 0,
                  mimeType: record.mimeType,
                  thumbnailUrl: record.thumbnailUrl
                }
              ]
            : [],
          tags: recordTags.map((t: any) => t.tag),
          createdAt: record.createdAt,
          updatedAt: record.updatedAt
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
    console.error('GET /api/medical-records error:', error);
    return NextResponse.json(
      { code: 500, message: '获取病例记录失败' },
      { status: 500 }
    );
  }
}

// POST - 创建病例记录
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
      title,
      category,
      description,
      recordDate,
      hospital,
      doctor,
      department,
      indicators,
      files = [],
      isImportant = false
    } = body;

    if (!title) {
      return NextResponse.json(
        { code: 400, message: '标题不能为空' },
        { status: 400 }
      );
    }

    // 获取或创建分类
    let categoryId = null;
    if (category) {
      const [existingCategory] = await db
        .select()
        .from(medicalCategories)
        .where(eq(medicalCategories.name, category));

      if (existingCategory) {
        categoryId = existingCategory.id;
      }
    }

    // 处理文件
    const firstFile = files.length > 0 ? files[0] : null;

    // 创建记录
    const [newRecord] = await db
      .insert(medicalRecords)
      .values({
        userId: user.id,
        patientId: patientId ? parseInt(patientId) : null,
        categoryId,
        title,
        description,
        fileUrl: firstFile?.url || null,
        thumbnailUrl: firstFile?.thumbnailUrl || null,
        fileType: category || firstFile?.type || 'other',
        fileName: firstFile?.name || null,
        fileSize: firstFile?.size || null,
        mimeType: firstFile?.mimeType || null,
        recordDate: recordDate ? new Date(recordDate) : new Date(),
        hospital,
        doctor,
        department,
        notes: description,
        aiAnalysis: indicators || {},
        isImportant
      })
      .returning();

    return NextResponse.json({
      code: 0,
      message: '创建成功',
      data: {
        id: newRecord.id,
        patientId: newRecord.patientId,
        title: newRecord.title,
        category: category || newRecord.fileType,
        description: newRecord.description,
        recordDate: newRecord.recordDate,
        indicators: newRecord.aiAnalysis,
        createdAt: newRecord.createdAt,
        updatedAt: newRecord.updatedAt
      }
    });
  } catch (error) {
    console.error('POST /api/medical-records error:', error);
    return NextResponse.json(
      { code: 500, message: '创建病例记录失败' },
      { status: 500 }
    );
  }
}
