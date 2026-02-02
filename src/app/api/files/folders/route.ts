import { NextRequest } from 'next/server';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserFromRequest, hasPermission } from '@/lib/server-permissions';
import { listR2Objects, uploadToR2, deleteMultipleFromR2 } from '@/lib/r2';

export const runtime = 'nodejs';

const PERM_CREATE = 'system.file.folder.create';
const PERM_DELETE = 'system.file.folder.delete';
const PERM_READ = 'system.file.read';

function normalizeStoragePath(path: string): string {
  return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
}

function buildObjectPath(dir: string, name: string): string {
  return dir ? `${dir}/${name}` : name;
}

async function listRecursive(dir: string): Promise<string[]> {
  const queue: string[] = [dir];
  const files: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    const prefix = current ? `${current}/` : '';

    try {
      const result = await listR2Objects(prefix, 1000);

      // 收集文件和文件夹
      for (const item of result.items) {
        if (item.isFolder) {
          queue.push(item.key.replace(/\/$/, ''));
        } else {
          files.push(item.key);
        }
      }
    } catch (error) {
      console.error('listRecursive error:', error);
      break;
    }
  }

  return files;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canRead = await hasPermission(PERM_READ, userId);
    if (!canRead) return forbiddenResponse('权限不足');

    const { searchParams } = new URL(request.url);
    const rawDir = searchParams.get('path') || '';
    const dir = rawDir ? normalizeStoragePath(rawDir) : '';

    const prefix = dir ? `${dir}/` : '';
    const result = await listR2Objects(prefix, 1000);

    const folders = result.items
      .filter((item) => item.isFolder)
      .map((item) => ({
        name: item.name,
        path: item.key.replace(/\/$/, ''),
        updatedAt: item.lastModified
      }));

    return successResponse({ path: dir, folders });
  } catch (error) {
    console.error('Folders GET failed:', error);
    return errorResponse('获取文件夹失败');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canCreate = await hasPermission(PERM_CREATE, userId);
    if (!canCreate) return forbiddenResponse('权限不足');

    const body = await request.json().catch(() => ({}));
    const rawPath = String(body?.path || '');
    if (!rawPath) return errorResponse('缺少 path');

    const folderPath = normalizeStoragePath(rawPath);
    if (!folderPath) return errorResponse('path 不合法');

    const keepPath = buildObjectPath(folderPath, '.keep');

    // 使用 R2 上传一个空文件来创建文件夹
    await uploadToR2(Buffer.alloc(0), keepPath, 'application/octet-stream');

    return successResponse({ created: folderPath });
  } catch (error) {
    console.error('Folders POST failed:', error);
    return errorResponse('创建文件夹失败');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserFromRequest(request);
    if (!userId) return unauthorizedResponse('未授权');

    const canDelete = await hasPermission(PERM_DELETE, userId);
    if (!canDelete) return forbiddenResponse('权限不足');

    const body = await request.json().catch(() => ({}));
    const rawPath = String(body?.path || '');
    if (!rawPath) return errorResponse('缺少 path');

    const dir = normalizeStoragePath(rawPath);
    if (!dir) return errorResponse('path 不合法');

    const allFiles = await listRecursive(dir);
    if (allFiles.length === 0) {
      return successResponse({ deleted: [], note: 'folder empty' });
    }

    // 使用 R2 删除文件
    await deleteMultipleFromR2(allFiles);

    return successResponse({ deleted: allFiles });
  } catch (error) {
    console.error('Folders DELETE failed:', error);
    return errorResponse('删除文件夹失败');
  }
}
