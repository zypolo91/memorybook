import { NextRequest } from 'next/server';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserFromRequest, hasPermission } from '@/lib/server-permissions';
import {
  uploadToR2,
  buildR2Path,
  generateUniqueFileName,
  getMimeType
} from '@/lib/r2';

export const runtime = 'nodejs';

const PERM_UPLOAD = 'system.file.upload';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canUpload = await hasPermission(PERM_UPLOAD, userId);
    if (!canUpload) return forbiddenResponse('权限不足');

    const formData = await request.formData();
    const rawDir = String(formData.get('path') || '');
    const dir = rawDir.replace(/^\/+|\/+$/g, '');

    const files = formData.getAll('files');
    if (!files.length) return errorResponse('请上传文件');

    const results = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;

      const arrayBuffer = await f.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 生成唯一文件名
      const uniqueName = generateUniqueFileName(f.name);
      const key = buildR2Path(dir, uniqueName);
      const contentType = f.type || getMimeType(f.name);

      // 上传到 R2
      const { url } = await uploadToR2(buffer, key, contentType);

      results.push({
        originalName: f.name,
        name: uniqueName,
        path: key,
        url,
        size: buffer.length,
        mimeType: contentType
      });
    }

    return successResponse({ uploaded: results });
  } catch (error) {
    console.error('R2 Upload failed:', error);
    return errorResponse('上传失败: ' + (error as Error).message);
  }
}
