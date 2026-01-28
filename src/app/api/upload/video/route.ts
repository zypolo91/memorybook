/**
 * 视频分片上传 API
 * 支持断点续传、进度追踪
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from '@aws-sdk/client-s3';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// R2 配置
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET = process.env.R2_BUCKET || 'memorybook';

// 视频上传记录表（用于断点续传）
// 注意：需要在数据库中创建此表

/**
 * POST /api/upload/video
 * 处理视频分片上传的各个阶段
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const action = formData.get('action') as string;

    switch (action) {
      case 'init':
        return handleInit(formData, user.id);
      case 'uploadPart':
        return handleUploadPart(formData, user.id);
      case 'complete':
        return handleComplete(formData, user.id);
      case 'abort':
        return handleAbort(formData, user.id);
      case 'status':
        return handleStatus(formData, user.id);
      default:
        return NextResponse.json(
          { code: 400, message: '无效的操作' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { code: 500, message: '上传失败' },
      { status: 500 }
    );
  }
}

/**
 * 初始化分片上传
 */
async function handleInit(formData: FormData, userId: number) {
  const fileName = formData.get('fileName') as string;
  const fileSize = parseInt(formData.get('fileSize') as string);
  const mimeType = formData.get('mimeType') as string;
  const resumeKey = formData.get('resumeKey') as string;

  if (!fileName || !fileSize) {
    return NextResponse.json(
      { code: 400, message: '缺少必要参数' },
      { status: 400 }
    );
  }

  // 检查是否有未完成的上传（断点续传）
  if (resumeKey) {
    try {
      // 从内存/数据库获取之前的上传状态
      const existingUpload = await getUploadRecord(resumeKey);
      if (existingUpload) {
        // 获取已上传的分片
        const listCommand = new ListPartsCommand({
          Bucket: BUCKET,
          Key: existingUpload.key,
          UploadId: existingUpload.uploadId
        });
        const listResult = await R2.send(listCommand);

        return NextResponse.json({
          code: 0,
          message: '恢复上传',
          data: {
            uploadId: existingUpload.uploadId,
            key: existingUpload.key,
            uploadedParts:
              listResult.Parts?.map((p) => ({
                partNumber: p.PartNumber,
                etag: p.ETag,
                size: p.Size
              })) || [],
            resumed: true
          }
        });
      }
    } catch (e) {
      // 上传记录不存在或已过期，创建新的
    }
  }

  // 生成文件路径
  const ext = fileName.split('.').pop() || 'mp4';
  const key = `videos/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  // 创建分片上传
  const command = new CreateMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: mimeType || 'video/mp4',
    Metadata: {
      'original-name': encodeURIComponent(fileName),
      'user-id': userId.toString()
    }
  });

  const result = await R2.send(command);

  // 保存上传记录（用于断点续传）
  if (resumeKey) {
    await saveUploadRecord(resumeKey, {
      uploadId: result.UploadId!,
      key,
      userId,
      fileName,
      fileSize,
      createdAt: new Date()
    });
  }

  return NextResponse.json({
    code: 0,
    message: '初始化成功',
    data: {
      uploadId: result.UploadId,
      key,
      uploadedParts: [],
      resumed: false
    }
  });
}

/**
 * 上传单个分片
 */
async function handleUploadPart(formData: FormData, userId: number) {
  const uploadId = formData.get('uploadId') as string;
  const key = formData.get('key') as string;
  const partNumber = parseInt(formData.get('partNumber') as string);
  const chunk = formData.get('chunk') as Blob;

  if (!uploadId || !key || !partNumber || !chunk) {
    return NextResponse.json(
      { code: 400, message: '缺少必要参数' },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await chunk.arrayBuffer());

  const command = new UploadPartCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
    Body: buffer
  });

  const result = await R2.send(command);

  return NextResponse.json({
    code: 0,
    message: '分片上传成功',
    data: {
      partNumber,
      etag: result.ETag
    }
  });
}

/**
 * 完成分片上传
 */
async function handleComplete(formData: FormData, userId: number) {
  const uploadId = formData.get('uploadId') as string;
  const key = formData.get('key') as string;
  const partsJson = formData.get('parts') as string;
  const resumeKey = formData.get('resumeKey') as string;

  if (!uploadId || !key || !partsJson) {
    return NextResponse.json(
      { code: 400, message: '缺少必要参数' },
      { status: 400 }
    );
  }

  const parts = JSON.parse(partsJson) as Array<{
    partNumber: number;
    etag: string;
  }>;

  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.map((p) => ({
        PartNumber: p.partNumber,
        ETag: p.etag
      }))
    }
  });

  const result = await R2.send(command);

  // 清理上传记录
  if (resumeKey) {
    await deleteUploadRecord(resumeKey);
  }

  // 构建访问 URL
  const url = `${process.env.R2_PUBLIC_URL || ''}/${key}`;

  return NextResponse.json({
    code: 0,
    message: '上传完成',
    data: {
      url,
      key,
      location: result.Location
    }
  });
}

/**
 * 取消分片上传
 */
async function handleAbort(formData: FormData, userId: number) {
  const uploadId = formData.get('uploadId') as string;
  const key = formData.get('key') as string;
  const resumeKey = formData.get('resumeKey') as string;

  if (!uploadId || !key) {
    return NextResponse.json(
      { code: 400, message: '缺少必要参数' },
      { status: 400 }
    );
  }

  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET,
    Key: key,
    UploadId: uploadId
  });

  await R2.send(command);

  // 清理上传记录
  if (resumeKey) {
    await deleteUploadRecord(resumeKey);
  }

  return NextResponse.json({
    code: 0,
    message: '已取消上传'
  });
}

/**
 * 获取上传状态
 */
async function handleStatus(formData: FormData, userId: number) {
  const resumeKey = formData.get('resumeKey') as string;

  if (!resumeKey) {
    return NextResponse.json(
      { code: 400, message: '缺少resumeKey' },
      { status: 400 }
    );
  }

  const record = await getUploadRecord(resumeKey);
  if (!record) {
    return NextResponse.json({
      code: 0,
      data: { exists: false }
    });
  }

  try {
    const listCommand = new ListPartsCommand({
      Bucket: BUCKET,
      Key: record.key,
      UploadId: record.uploadId
    });
    const listResult = await R2.send(listCommand);

    return NextResponse.json({
      code: 0,
      data: {
        exists: true,
        uploadId: record.uploadId,
        key: record.key,
        uploadedParts:
          listResult.Parts?.map((p) => ({
            partNumber: p.PartNumber,
            etag: p.ETag,
            size: p.Size
          })) || []
      }
    });
  } catch (e) {
    // 上传已过期
    await deleteUploadRecord(resumeKey);
    return NextResponse.json({
      code: 0,
      data: { exists: false }
    });
  }
}

// ========== 上传记录管理（简单的内存存储，生产环境应使用 Redis 或数据库）==========

interface UploadRecord {
  uploadId: string;
  key: string;
  userId: number;
  fileName: string;
  fileSize: number;
  createdAt: Date;
}

// 使用全局变量存储上传记录（生产环境建议使用 Redis）
const uploadRecords = new Map<string, UploadRecord>();

async function getUploadRecord(
  resumeKey: string
): Promise<UploadRecord | null> {
  const record = uploadRecords.get(resumeKey);
  if (!record) return null;

  // 检查是否过期（24小时）
  const now = new Date();
  const diff = now.getTime() - record.createdAt.getTime();
  if (diff > 24 * 60 * 60 * 1000) {
    uploadRecords.delete(resumeKey);
    return null;
  }

  return record;
}

async function saveUploadRecord(
  resumeKey: string,
  record: UploadRecord
): Promise<void> {
  uploadRecords.set(resumeKey, record);
}

async function deleteUploadRecord(resumeKey: string): Promise<void> {
  uploadRecords.delete(resumeKey);
}
