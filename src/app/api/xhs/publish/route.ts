import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, images = [], sourceUrl } = body ?? {};

    if (!content || String(content).trim().length === 0) {
      return NextResponse.json(
        { code: -1, message: 'content 不能为空' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        draft: {
          title: title ? String(title) : null,
          content: String(content),
          images: Array.isArray(images) ? images.map(String) : [],
          sourceUrl: sourceUrl ? String(sourceUrl) : null
        }
      }
    });
  } catch (error) {
    console.error('XHS publish draft failed:', error);
    return NextResponse.json(
      { code: -1, message: '生成草稿失败' },
      { status: 500 }
    );
  }
}
