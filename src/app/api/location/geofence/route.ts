/**
 * @deprecated 此API已弃用，围栏功能已移除
 * 地理围栏 API - 已弃用
 */

import { NextResponse } from 'next/server';

// 所有请求返回404
export async function POST() {
  return NextResponse.json(
    { code: 404, message: '此功能已弃用' },
    { status: 404 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { code: 404, message: '此功能已弃用' },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { code: 404, message: '此功能已弃用' },
    { status: 404 }
  );
}
