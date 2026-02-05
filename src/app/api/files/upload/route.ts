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

// 文件大小限制
const MAX_SINGLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB总计
const MAX_FILES_COUNT = 9; // 最多9个文件

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

    // 检查文件数量
    if (files.length > MAX_FILES_COUNT) {
      return errorResponse(`最多只能上传${MAX_FILES_COUNT}个文件`);
    }

    const results = [];
    const errors = [];
    let totalSize = 0;

    for (const f of files) {
      if (!(f instanceof File)) continue;

      try {
        const arrayBuffer = await f.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileSize = buffer.length;

        // 检查单个文件大小
        if (fileSize > MAX_SINGLE_FILE_SIZE) {
          errors.push({
            fileName: f.name,
            error: `文件超过${MAX_SINGLE_FILE_SIZE / 1024 / 1024}MB限制`
          });
          console.log(
            `[Upload] 文件 ${f.name} 超过大小限制: ${fileSize} bytes`
          );
          continue;
        }

        // 检查总大小
        totalSize += fileSize;
        if (totalSize > MAX_TOTAL_SIZE) {
          errors.push({
            fileName: f.name,
            error: '总文件大小超过限制'
          });
          console.log(`[Upload] 总大小超过限制: ${totalSize} bytes`);
          continue;
        }

        console.log(
          `[Upload] 开始上传文件: ${f.name}, 大小: ${fileSize} bytes`
        );

        // 生成唯一文件名
        const uniqueName = generateUniqueFileName(f.name);
        const key = buildR2Path(dir, uniqueName);
        const contentType = f.type || getMimeType(f.name);

        // 上传到 R2
        const { url } = await uploadToR2(buffer, key, contentType);

        console.log(`[Upload] 文件上传成功: ${f.name} -> ${url}`);

        results.push({
          originalName: f.name,
          name: uniqueName,
          path: key,
          url,
          size: fileSize,
          mimeType: contentType
        });
      } catch (fileError) {
        console.error(`[Upload] 文件 ${f.name} 上传失败:`, fileError);
        errors.push({
          fileName: f.name,
          error: (fileError as Error).message
        });
      }
    }

    // 如果所有文件都失败了
    if (results.length === 0 && errors.length > 0) {
      return errorResponse(
        '所有文件上传失败: ' +
          errors.map((e) => `${e.fileName}: ${e.error}`).join('; ')
      );
    }

    return successResponse({
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: results.length,
      totalFailed: errors.length
    });
  } catch (error) {
    console.error('R2 Upload failed:', error);
    return errorResponse('上传失败: ' + (error as Error).message);
  }
}
