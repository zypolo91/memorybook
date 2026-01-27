import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserPermissions } from '@/lib/server-permissions';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse('未登录');
    }
    const permissions = await getUserPermissions(session.user.id);
    return successResponse(permissions);
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return errorResponse('获取权限失败');
  }
}
