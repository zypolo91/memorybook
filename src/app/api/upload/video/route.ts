/**
 * 视频分片上传 API
 * 支持断点续传、进度追踪
 *
 * 重构说明：
 * 1. 使用数据库持久化存储上传记录，支持服务器重启后恢复
 * 2. 详细的错误日志记录
 * 3. 分片级别的重试支持
 * 4. 上传进度实时更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/db';
import { videoUploadRecords } from '@/db/schema';
import { eq, and, lt, sql } from 'drizzle-orm';

import { getR2Client, getR2BucketName } from '@/lib/r2';

// 使用统一的 R2 配置
const R2 = getR2Client();
const BUCKET = getR2BucketName();

// 分片大小常量（与前端保持一致）
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

// 视频上传记录表（用于断点续传）
// 注意：需要在数据库中创建此表

/**
 * POST /api/upload/video
 * 处理视频分片上传的各个阶段
 */
export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    if (!user) {
      console.log('[VideoUpload] 认证失败 - 未找到有效用户');
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }
    console.log('[VideoUpload] 用户认证成功:', user.id);

    const formData = await request.formData();
    const action = formData.get('action') as string;

    switch (action) {
      case 'init':
        return handleInit(formData, user.id);
      case 'getUploadUrls':
        return handleGetUploadUrls(formData, user.id);
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
 * 生成分片上传预签名URL（客户端直传R2，绕过Vercel 4.5MB限制）
 */
async function handleGetUploadUrls(formData: FormData, userId: number) {
  const uploadId = formData.get('uploadId') as string;
  const key = formData.get('key') as string;
  const totalParts = parseInt(formData.get('totalParts') as string);

  if (!uploadId || !key || !totalParts) {
    return NextResponse.json(
      { code: 400, message: '缺少必要参数' },
      { status: 400 }
    );
  }

  console.log(
    `[VideoUpload] 生成预签名URL: key=${key}, totalParts=${totalParts}`
  );

  const urls: Array<{ partNumber: number; url: string }> = [];

  for (let i = 1; i <= totalParts; i++) {
    const command = new UploadPartCommand({
      Bucket: BUCKET,
      Key: key,
      UploadId: uploadId,
      PartNumber: i
    });

    const url = await getSignedUrl(R2, command, { expiresIn: 3600 });
    urls.push({ partNumber: i, url });
  }

  return NextResponse.json({
    code: 0,
    message: '预签名URL生成成功',
    data: { urls }
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
    console.log('[VideoUpload] handleComplete 缺少参数:', {
      uploadId,
      key,
      partsJson
    });
    return NextResponse.json(
      { code: 400, message: '缺少必要参数' },
      { status: 400 }
    );
  }

  console.log('[VideoUpload] handleComplete partsJson:', partsJson);

  let parts: Array<{ partNumber: number; etag: string }>;
  try {
    parts = JSON.parse(partsJson);
  } catch (e) {
    console.error('[VideoUpload] JSON解析失败:', e, 'partsJson:', partsJson);
    return NextResponse.json(
      { code: 400, message: 'parts参数格式错误' },
      { status: 400 }
    );
  }

  console.log(
    '[VideoUpload] handleComplete parts:',
    JSON.stringify(parts, null, 2)
  );

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

  let result;
  try {
    result = await R2.send(command);
  } catch (e: any) {
    console.error('[VideoUpload] CompleteMultipartUpload 失败:', e.message, e);
    return NextResponse.json(
      { code: 500, message: `完成上传失败: ${e.message}` },
      { status: 500 }
    );
  }

  // 标记上传完成并清理记录
  if (resumeKey) {
    await markUploadCompleted(resumeKey);
    // 延迟删除，保留一段时间用于查询
    setTimeout(() => deleteUploadRecord(resumeKey), 60000);
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

// ========== 上传记录管理（使用数据库持久化存储）==========

interface UploadRecord {
  uploadId: string;
  key: string;
  userId: number;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadedParts?: Array<{ partNumber: number; etag: string; size?: number }>;
  totalParts?: number;
  createdAt: Date;
}

/**
 * 获取上传记录
 */
async function getUploadRecord(
  resumeKey: string
): Promise<UploadRecord | null> {
  try {
    const [record] = await db
      .select()
      .from(videoUploadRecords)
      .where(eq(videoUploadRecords.resumeKey, resumeKey));

    if (!record) return null;

    // 检查是否过期
    if (record.expiresAt && new Date() > record.expiresAt) {
      await deleteUploadRecord(resumeKey);
      return null;
    }

    return {
      uploadId: record.uploadId,
      key: record.key,
      userId: record.userId,
      fileName: record.fileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType || undefined,
      uploadedParts: (record.uploadedParts as any) || [],
      totalParts: record.totalParts || undefined,
      createdAt: record.createdAt || new Date()
    };
  } catch (e) {
    console.error('[VideoUpload] 获取上传记录失败:', e);
    return null;
  }
}

/**
 * 保存上传记录
 */
async function saveUploadRecord(
  resumeKey: string,
  record: UploadRecord
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
    const totalParts = Math.ceil(record.fileSize / CHUNK_SIZE);

    await db
      .insert(videoUploadRecords)
      .values({
        resumeKey,
        uploadId: record.uploadId,
        key: record.key,
        userId: record.userId,
        fileName: record.fileName,
        fileSize: record.fileSize,
        mimeType: record.mimeType,
        uploadedParts: record.uploadedParts || [],
        totalParts,
        status: 'uploading',
        expiresAt
      })
      .onConflictDoUpdate({
        target: videoUploadRecords.resumeKey,
        set: {
          uploadId: record.uploadId,
          key: record.key,
          uploadedParts: record.uploadedParts || [],
          updatedAt: new Date(),
          expiresAt
        }
      });

    console.log(`[VideoUpload] 保存上传记录成功: ${resumeKey}`);
  } catch (e) {
    console.error('[VideoUpload] 保存上传记录失败:', e);
  }
}

/**
 * 更新已上传的分片信息
 */
async function updateUploadedParts(
  resumeKey: string,
  parts: Array<{ partNumber: number; etag: string; size?: number }>
): Promise<void> {
  try {
    await db
      .update(videoUploadRecords)
      .set({
        uploadedParts: parts,
        updatedAt: new Date()
      })
      .where(eq(videoUploadRecords.resumeKey, resumeKey));
  } catch (e) {
    console.error('[VideoUpload] 更新分片信息失败:', e);
  }
}

/**
 * 删除上传记录
 */
async function deleteUploadRecord(resumeKey: string): Promise<void> {
  try {
    await db
      .delete(videoUploadRecords)
      .where(eq(videoUploadRecords.resumeKey, resumeKey));
    console.log(`[VideoUpload] 删除上传记录: ${resumeKey}`);
  } catch (e) {
    console.error('[VideoUpload] 删除上传记录失败:', e);
  }
}

/**
 * 标记上传完成
 */
async function markUploadCompleted(resumeKey: string): Promise<void> {
  try {
    await db
      .update(videoUploadRecords)
      .set({
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(videoUploadRecords.resumeKey, resumeKey));
  } catch (e) {
    console.error('[VideoUpload] 标记完成失败:', e);
  }
}

/**
 * 清理过期的上传记录
 */
async function cleanupExpiredRecords(): Promise<void> {
  try {
    const now = new Date();
    await db
      .delete(videoUploadRecords)
      .where(lt(videoUploadRecords.expiresAt, now));
  } catch (e) {
    console.error('[VideoUpload] 清理过期记录失败:', e);
  }
}
