/**
 * 病例记录详情 API
 * 获取、更新、删除单条病例记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import {
  medicalRecords,
  medicalCategories,
  medicalTags,
  medicalRecordTags
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// GET - 获取单条病例记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recordId = parseInt(id);

    const [record] = await db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, recordId));

    if (!record) {
      return NextResponse.json(
        { code: 404, message: '记录不存在' },
        { status: 404 }
      );
    }

    // 获取标签
    const recordTags = await db
      .select({ tag: medicalTags })
      .from(medicalRecordTags)
      .innerJoin(medicalTags, eq(medicalRecordTags.tagId, medicalTags.id))
      .where(eq(medicalRecordTags.recordId, record.id));

    // 获取分类
    let category = null;
    if (record.categoryId) {
      const [cat] = await db
        .select()
        .from(medicalCategories)
        .where(eq(medicalCategories.id, record.categoryId));
      category = cat;
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
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
      }
    });
  } catch (error) {
    console.error('GET /api/medical-records/[id] error:', error);
    return NextResponse.json(
      { code: 500, message: '获取病例记录失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新病例记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recordId = parseInt(id);
    const body = await request.json();
    const {
      title,
      description,
      recordDate,
      hospital,
      doctor,
      department,
      indicators,
      isImportant,
      files
    } = body;

    // 构建更新对象
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (recordDate !== undefined) updateData.recordDate = new Date(recordDate);
    if (hospital !== undefined) updateData.hospital = hospital;
    if (doctor !== undefined) updateData.doctor = doctor;
    if (department !== undefined) updateData.department = department;
    if (indicators !== undefined) updateData.aiAnalysis = indicators;
    if (isImportant !== undefined) updateData.isImportant = isImportant;

    // 处理文件
    if (files && files.length > 0) {
      const firstFile = files[0];
      updateData.fileUrl = firstFile.url;
      updateData.fileName = firstFile.name;
      updateData.fileSize = firstFile.size;
      updateData.fileType = firstFile.type;
      updateData.mimeType = firstFile.mimeType;
      updateData.thumbnailUrl = firstFile.thumbnailUrl;
    }

    const [updatedRecord] = await db
      .update(medicalRecords)
      .set(updateData)
      .where(eq(medicalRecords.id, recordId))
      .returning();

    if (!updatedRecord) {
      return NextResponse.json(
        { code: 404, message: '记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '更新成功',
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patientId,
        title: updatedRecord.title,
        description: updatedRecord.description,
        recordDate: updatedRecord.recordDate,
        indicators: updatedRecord.aiAnalysis,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt
      }
    });
  } catch (error) {
    console.error('PUT /api/medical-records/[id] error:', error);
    return NextResponse.json(
      { code: 500, message: '更新病例记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除病例记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const recordId = parseInt(id);

    // 设置状态为archived（软删除）
    const [deletedRecord] = await db
      .update(medicalRecords)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(medicalRecords.id, recordId))
      .returning();

    if (!deletedRecord) {
      return NextResponse.json(
        { code: 404, message: '记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: '删除成功',
      data: { id: deletedRecord.id }
    });
  } catch (error) {
    console.error('DELETE /api/medical-records/[id] error:', error);
    return NextResponse.json(
      { code: 500, message: '删除病例记录失败' },
      { status: 500 }
    );
  }
}
