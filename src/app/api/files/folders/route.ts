import { NextRequest } from 'next/server';
import {
  errorResponse,
  forbiddenResponse,
  successResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserFromRequest, hasPermission } from '@/lib/server-permissions';
import {
  applyStoragePrefix,
  buildObjectPath,
  fromStorageKey,
  getSupabaseAdmin,
  getSupabaseStorageBucket,
  normalizeStoragePath
} from '@/lib/supabase';

export const runtime = 'nodejs';

const PERM_CREATE = 'system.file.folder.create';
const PERM_DELETE = 'system.file.folder.delete';
const PERM_READ = 'system.file.read';

function isFolderItem(item: any): boolean {
  return item?.id == null && item?.metadata == null;
}

async function listRecursive(dir: string): Promise<string[]> {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseStorageBucket();

  const queue: string[] = [dir];
  const files: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(applyStoragePrefix(current), {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) throw new Error(error.message);

    for (const item of data || []) {
      const childName = fromStorageKey(item.name);
      const childPath = buildObjectPath(current, childName);
      if (isFolderItem(item)) {
        queue.push(childPath);
      } else {
        files.push(childPath);
      }
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

    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(applyStoragePrefix(dir), {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) return errorResponse(error.message);

    const folders = (data || [])
      .filter((item: any) => isFolderItem(item))
      .map((item: any) => ({
        name: fromStorageKey(item.name),
        path: buildObjectPath(dir, fromStorageKey(item.name)),
        updatedAt: item?.updated_at ?? null
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

    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();

    const keepPath = buildObjectPath(folderPath, '.keep');

    const { error } = await supabase.storage
      .from(bucket)
      .upload(applyStoragePrefix(keepPath), Buffer.alloc(0), {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (error) return errorResponse(error.message);
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

    const supabase = getSupabaseAdmin();
    const bucket = getSupabaseStorageBucket();

    const allFiles = await listRecursive(dir);
    if (allFiles.length === 0) {
      return successResponse({ deleted: [], note: 'folder empty' });
    }

    // chunk remove calls to avoid huge payloads
    const deleted: string[] = [];
    for (let i = 0; i < allFiles.length; i += 100) {
      const chunk = allFiles.slice(i, i + 100);
      const { error } = await supabase.storage
        .from(bucket)
        .remove(chunk.map(applyStoragePrefix));

      if (error) return errorResponse(error.message);
      deleted.push(...chunk);
    }

    return successResponse({ deleted });
  } catch (error) {
    console.error('Folders DELETE failed:', error);
    return errorResponse('删除文件夹失败');
  }
}
