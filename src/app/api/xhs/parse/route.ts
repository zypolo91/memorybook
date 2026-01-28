import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function extractMeta(html: string, name: string): string | null {
  const patterns = [
    new RegExp(
      `<meta\\s+property=["']${name}["']\\s+content=["']([^"']*)["']\\s*/?>`,
      'i'
    ),
    new RegExp(
      `<meta\\s+content=["']([^"']*)["']\\s+property=["']${name}["']\\s*/?>`,
      'i'
    )
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

function extractAllOgImages(html: string): string[] {
  const urls: string[] = [];
  const re =
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']\s*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) urls.push(m[1]);
  }
  return Array.from(new Set(urls));
}

function extractNoteId(url: string): string | null {
  const patterns = [
    /\/explore\/([A-Za-z0-9]+)/,
    /\/discovery\/item\/([A-Za-z0-9]+)/,
    /\/xhsdiscover\/([A-Za-z0-9]+)/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1];
  }
  return null;
}

function extractJsonLd(html: string): any | null {
  try {
    const re =
      /<script\s+type=["']application\/ld\+json["']\s*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      if (m[1]) {
        const json = JSON.parse(m[1]);
        // 优先寻找 Note 或 Article 类型
        if (Array.isArray(json)) {
          const note = json.find((item: any) =>
            ['Note', 'Article', 'SocialMediaPosting'].includes(item['@type'])
          );
          if (note) return note;
        } else if (
          ['Note', 'Article', 'SocialMediaPosting'].includes(json['@type'])
        ) {
          return json;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = String(body?.url ?? '').trim();

    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      return NextResponse.json(
        { code: -1, message: '请提供合法的分享链接' },
        { status: 400 }
      );
    }

    const res = await fetch(rawUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36'
      }
    });

    const finalUrl = res.url || rawUrl;
    const html = await res.text();

    const jsonLd = extractJsonLd(html);

    let title =
      jsonLd?.headline ||
      jsonLd?.name ||
      extractMeta(html, 'og:title') ||
      extractMeta(html, 'twitter:title');

    let description =
      jsonLd?.description ||
      extractMeta(html, 'og:description') ||
      extractMeta(html, 'twitter:description');

    let images = extractAllOgImages(html);
    if (jsonLd?.image) {
      if (Array.isArray(jsonLd.image)) {
        images = [...images, ...jsonLd.image];
      } else if (typeof jsonLd.image === 'string') {
        images.push(jsonLd.image);
      } else if (jsonLd.image.url) {
        images.push(jsonLd.image.url);
      }
    }

    // 去重
    images = Array.from(new Set(images));

    const noteId = extractNoteId(finalUrl);

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        inputUrl: rawUrl,
        finalUrl,
        noteId,
        title,
        description,
        images
      }
    });
  } catch (error) {
    console.error('XHS parse failed:', error);
    return NextResponse.json(
      { code: -1, message: '解析失败' },
      { status: 500 }
    );
  }
}
