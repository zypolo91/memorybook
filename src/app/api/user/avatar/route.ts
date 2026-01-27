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

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) return unauthorizedResponse();

  if (!supabase) {
    return errorResponse('未配置 Supabase 上传，请检查环境变量');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('请选择需要上传的头像');
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return errorResponse('请上传图片文件');
    }

    // 限制文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('头像图片不能超过5MB');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `avatars/${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from(supabaseBucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);

    return successResponse({ url: publicUrl, path: filePath });
  } catch (error) {
    console.error('头像上传失败:', error);
    return errorResponse('头像上传失败');
  }
}
