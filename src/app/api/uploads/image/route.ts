import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket =
  process.env.SUPABASE_UPLOADS_BUCKET ||
  process.env.SUPABASE_STORAGE_BUCKET ||
  'uploads';

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type UploadType =
  | 'category'
  | 'channel'
  | 'jewelry'
  | 'certificate'
  | 'general';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  if (!supabase) {
    return errorResponse('未配置 Supabase 上传，请检查环境变量');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = ((formData.get('type') as string) || 'general') as UploadType;
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return errorResponse('请选择需要上传的文件');
    }

    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const cleanFolder = folder.replace(/(^\/|\/$)/g, '');
    const basePath = cleanFolder ? `${cleanFolder}/` : '';
    const filePath = `${basePath}${type}/${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from(supabaseBucket)
      .upload(filePath, file, {
        contentType: file.type
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);

    return successResponse({ url: publicUrl, path: filePath });
  } catch (error) {
    console.error('图片上传失败:', error);
    return errorResponse('上传失败');
  }
}
