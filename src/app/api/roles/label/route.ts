import { db } from '@/db';
import { roles } from '@/db/schema';
import { errorResponse, successResponse } from '@/service/response';

export async function GET() {
  try {
    const roleList = await db
      .select({
        id: roles.id,
        name: roles.name
      })
      .from(roles);

    return successResponse(roleList);
  } catch (error) {
    console.error('获取角色标签失败:', error);
    return errorResponse('获取角色标签失败');
  }
}
