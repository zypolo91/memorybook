import { auth } from '@/lib/auth';
import { successResponse } from '@/service/response';

export async function GET() {
  const session = await auth();
  return successResponse(session);
}
