import { NextRequest } from 'next/server';
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
  forbiddenResponse
} from '@/service/response';
import { getUserFromRequest, hasPermission } from '@/lib/server-permissions';
import {
  getR2Client,
  getR2BucketName,
  getR2PublicUrl,
  buildR2Path,
  generateUniqueFileName,
  getMimeType
} from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';

const PERM_UPLOAD = 'system.file.upload';
const MAX_FILES_COUNT = 9;

/**
 * POST /api/files/presign
 * 生成预签名URL，支持客户端直传R2（绕过Vercel 4.5MB限制）
 *
 * Body (JSON):
 * - files: Array<{ fileName: string, contentType?: string }>
 * - dir: string (上传目录，如 'memories', 'avatars')
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canUpload = await hasPermission(PERM_UPLOAD, userId);
    if (!canUpload) return forbiddenResponse('权限不足');

    const body = await request.json();
    const { files, dir = 'memories' } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return errorResponse('请提供文件信息');
    }

    if (files.length > MAX_FILES_COUNT) {
      return errorResponse(`最多只能上传${MAX_FILES_COUNT}个文件`);
    }

    const cleanDir = (dir as string).replace(/^\/+|\/+$/g, '');
    const R2 = getR2Client();
    const BUCKET = getR2BucketName();
    const publicUrl = getR2PublicUrl();

    const results = [];

    for (const file of files) {
      const { fileName, contentType } = file;
      if (!fileName) continue;

      const uniqueName = generateUniqueFileName(fileName);
      const key = buildR2Path(cleanDir, uniqueName);
      const mime = contentType || getMimeType(fileName);

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: mime
      });

      const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });

      results.push({
        originalName: fileName,
        name: uniqueName,
        key,
        path: key,
        url: publicUrl ? `${publicUrl}/${key}` : key,
        mimeType: mime,
        presignedUrl
      });
    }

    return successResponse({
      uploads: results
    });
  } catch (error) {
    console.error('[Presign] 生成预签名URL失败:', error);
    return errorResponse('生成上传URL失败: ' + (error as Error).message);
  }
}
