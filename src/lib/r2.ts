import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'momo-love';
const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// 创建 S3 客户端（R2 兼容 S3 API）
let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (r2Client) return r2Client;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2 credentials');
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });

  return r2Client;
}

export function getR2BucketName(): string {
  return R2_BUCKET_NAME;
}

export function getR2PublicUrl(): string {
  return R2_PUBLIC_URL;
}

/**
 * 上传文件到 R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType
    })
  );

  const publicUrl = getR2PublicUrl();
  const url = publicUrl ? `${publicUrl}/${key}` : key;

  return { url, key };
}

/**
 * 从 R2 删除文件
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}

/**
 * 批量删除文件
 */
export async function deleteMultipleFromR2(keys: string[]): Promise<void> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  // R2 不支持批量删除，需要逐个删除
  await Promise.all(
    keys.map((key) =>
      client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key
        })
      )
    )
  );
}

/**
 * 列出 R2 对象
 */
export async function listR2Objects(
  prefix?: string,
  maxKeys: number = 100,
  continuationToken?: string
): Promise<{
  items: R2ObjectInfo[];
  nextToken?: string;
  isTruncated: boolean;
}> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
      Delimiter: '/'
    })
  );

  const items: R2ObjectInfo[] = [];

  // 添加文件夹（CommonPrefixes）
  if (result.CommonPrefixes) {
    for (const prefix of result.CommonPrefixes) {
      if (prefix.Prefix) {
        items.push({
          key: prefix.Prefix,
          name: prefix.Prefix.replace(/\/$/, '').split('/').pop() || '',
          isFolder: true,
          size: 0,
          lastModified: null
        });
      }
    }
  }

  // 添加文件
  if (result.Contents) {
    for (const obj of result.Contents) {
      if (obj.Key && !obj.Key.endsWith('/')) {
        items.push({
          key: obj.Key,
          name: obj.Key.split('/').pop() || '',
          isFolder: false,
          size: obj.Size || 0,
          lastModified: obj.LastModified || null
        });
      }
    }
  }

  return {
    items,
    nextToken: result.NextContinuationToken,
    isTruncated: result.IsTruncated || false
  };
}

/**
 * 获取文件信息
 */
export async function getR2ObjectInfo(
  key: string
): Promise<R2ObjectInfo | null> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  try {
    const result = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key
      })
    );

    return {
      key,
      name: key.split('/').pop() || '',
      isFolder: false,
      size: result.ContentLength || 0,
      lastModified: result.LastModified || null,
      contentType: result.ContentType
    };
  } catch {
    return null;
  }
}

/**
 * 生成预签名 URL（用于直接上传或下载）
 */
export async function getR2SignedUrl(
  key: string,
  expiresIn: number = 3600,
  operation: 'get' | 'put' = 'get'
): Promise<string> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command =
    operation === 'put'
      ? new PutObjectCommand({ Bucket: bucket, Key: key })
      : new GetObjectCommand({ Bucket: bucket, Key: key });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * 构建文件存储路径
 */
export function buildR2Path(
  ...segments: (string | undefined | null)[]
): string {
  return segments
    .filter(Boolean)
    .map((s) => s!.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}

/**
 * 从路径中提取文件名
 */
export function getFileNameFromPath(path: string): string {
  return path.split('/').pop() || path;
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return ext ? `${timestamp}_${random}.${ext}` : `${timestamp}_${random}`;
}

/**
 * 获取文件的 MIME 类型
 */
export function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    json: 'application/json',
    txt: 'text/plain'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// 类型定义
export interface R2ObjectInfo {
  key: string;
  name: string;
  isFolder: boolean;
  size: number;
  lastModified: Date | null;
  contentType?: string;
}

export interface R2UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}
