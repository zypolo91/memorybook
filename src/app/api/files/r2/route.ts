import { NextRequest } from 'next/server';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserFromRequest, hasPermission } from '@/lib/server-permissions';
import {
  listR2Objects,
  deleteFromR2,
  deleteMultipleFromR2,
  getR2SignedUrl,
  buildR2Path
} from '@/lib/r2';

export const runtime = 'nodejs';

const PERM_READ = 'system.file.read';
const PERM_DELETE = 'system.file.delete';

/**
 * GET /api/files/r2 - 列出R2文件或获取签名URL
 */
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
      const key = searchParams.get('key') || '';
      if (!key) return errorResponse('缺少 key 参数');

      const expiresIn = Math.min(
        Math.max(Number(searchParams.get('expiresIn')) || 3600, 60),
        60 * 60 * 24
      );

      const url = await getR2SignedUrl(key, expiresIn, 'get');
      return successResponse({ url, expiresIn });
    }

    // 列出文件
    const prefix = searchParams.get('prefix') || searchParams.get('path') || '';
    const maxKeys = Math.min(Number(searchParams.get('limit')) || 100, 1000);
    const continuationToken = searchParams.get('token') || undefined;

    const result = await listR2Objects(prefix, maxKeys, continuationToken);

    return successResponse({
      prefix,
      items: result.items,
      nextToken: result.nextToken,
      hasMore: result.isTruncated
    });
  } catch (error) {
    console.error('R2 GET failed:', error);
    return errorResponse('获取文件列表失败: ' + (error as Error).message);
  }
}

/**
 * DELETE /api/files/r2 - 删除R2文件
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canDelete = await hasPermission(PERM_DELETE, userId);
    if (!canDelete) return forbiddenResponse('权限不足');

    const body = await request.json().catch(() => ({}));
    const rawKeys: unknown = body?.keys ?? body?.key;

    const keys = Array.isArray(rawKeys)
      ? rawKeys.map(String)
      : rawKeys
        ? [String(rawKeys)]
        : [];

    if (!keys.length) return errorResponse('缺少 key');

    if (keys.length === 1) {
      await deleteFromR2(keys[0]);
    } else {
      await deleteMultipleFromR2(keys);
    }

    return successResponse({ deleted: keys });
  } catch (error) {
    console.error('R2 DELETE failed:', error);
    return errorResponse('删除失败: ' + (error as Error).message);
  }
}
