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
  deleteFromR2,
  listR2Objects,
  getR2SignedUrl,
  buildR2Path,
  generateUniqueFileName,
  getMimeType
} from '@/lib/r2';

export const runtime = 'nodejs';

const PERM_READ = 'system.file.read';
const PERM_UPLOAD = 'system.file.upload';
const PERM_DELETE = 'system.file.delete';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canRead = await hasPermission(PERM_READ, userId);
    if (!canRead) return forbiddenResponse('权限不足');

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 获取签名 URL
    if (action === 'signedUrl') {
      const path = searchParams.get('path') || '';
      const expiresIn = Math.min(
        Math.max(Number(searchParams.get('expiresIn')) || 3600, 60),
        60 * 60 * 24
      );

      const url = await getR2SignedUrl(path, expiresIn, 'get');
      return successResponse({ url, expiresIn });
    }

    // 列表
    const prefix = searchParams.get('path') || '';
    const maxKeys = Math.min(Number(searchParams.get('limit')) || 200, 1000);

    const result = await listR2Objects(prefix, maxKeys);

    const items = result.items.map((item) => ({
      name: item.name,
      path: item.key,
      isFolder: item.isFolder,
      size: item.size,
      mimeType: item.contentType || null,
      updatedAt: item.lastModified,
      createdAt: item.lastModified,
      lastAccessedAt: null
    }));

    return successResponse({
      path: prefix,
      items,
      nextToken: result.nextToken
    });
  } catch (error) {
    console.error('Files GET failed:', error);
    return errorResponse('获取文件列表失败: ' + (error as Error).message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canUpload = await hasPermission(PERM_UPLOAD, userId);
    if (!canUpload) return forbiddenResponse('权限不足');

    const formData = await request.formData();
    const dir = String(formData.get('path') || '').replace(/^\/+|\/+$/g, '');

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
    console.error('Files POST failed:', error);
    return errorResponse('上传失败: ' + (error as Error).message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canDelete = await hasPermission(PERM_DELETE, userId);
    if (!canDelete) return forbiddenResponse('权限不足');

    const body = await request.json().catch(() => ({}));
    const rawPaths: unknown = body?.paths ?? body?.path;

    const paths = Array.isArray(rawPaths)
      ? rawPaths.map(String)
      : rawPaths
        ? [String(rawPaths)]
        : [];

    if (!paths.length) return errorResponse('缺少 path');

    // 删除文件
    for (const path of paths) {
      await deleteFromR2(path);
    }

    return successResponse({ deleted: paths });
  } catch (error) {
    console.error('Files DELETE failed:', error);
    return errorResponse('删除失败: ' + (error as Error).message);
  }
}
