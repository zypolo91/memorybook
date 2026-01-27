import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/service/response';
import {
  getR2Client,
  getR2BucketName,
  uploadToR2,
  listR2Objects,
  deleteFromR2
} from '@/lib/r2';

export const runtime = 'nodejs';

/**
 * GET /api/files/r2/test - 测试R2连接
 */
export async function GET(request: NextRequest) {
  try {
    const bucket = getR2BucketName();

    // 测试列出对象
    const listResult = await listR2Objects('', 10);

    return successResponse({
      status: 'connected',
      bucket,
      message: 'R2 连接成功',
      objectCount: listResult.items.length,
      objects: listResult.items.slice(0, 5).map((item) => ({
        key: item.key,
        size: item.size,
        isFolder: item.isFolder
      }))
    });
  } catch (error) {
    console.error('R2 Test failed:', error);
    return errorResponse('R2 连接失败: ' + (error as Error).message);
  }
}

/**
 * POST /api/files/r2/test - 测试R2上传
 */
export async function POST(request: NextRequest) {
  try {
    const testContent = `MemoryBook R2 Test - ${new Date().toISOString()}`;
    const testKey = `_test/connection-test-${Date.now()}.txt`;

    // 测试上传
    const uploadResult = await uploadToR2(
      Buffer.from(testContent, 'utf-8'),
      testKey,
      'text/plain'
    );

    // 测试列出
    const listResult = await listR2Objects('_test/', 10);

    // 测试删除
    await deleteFromR2(testKey);

    return successResponse({
      status: 'success',
      message: 'R2 上传测试成功',
      uploadedKey: uploadResult.key,
      uploadedUrl: uploadResult.url,
      testContent,
      objectsInTestFolder: listResult.items.length,
      deleted: true
    });
  } catch (error) {
    console.error('R2 Upload Test failed:', error);
    return errorResponse('R2 上传测试失败: ' + (error as Error).message);
  }
}
