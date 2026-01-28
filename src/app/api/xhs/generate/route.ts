/**
 * 小红书文章生成 API
 * 根据记忆内容自动生成小红书风格的文章
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const AI_API_URL = 'https://aihubmix.com/v1/chat/completions';
const AI_API_KEY = process.env.AI_API_KEY;

const XHS_PROMPT = `你是一位专业的小红书内容创作者，擅长将生活故事转化为温暖感人的小红书文章。

请根据以下记忆内容，生成一篇适合在小红书发布的文章：

【记忆标题】{title}
【记忆内容】{content}
【记忆日期】{date}
【心情】{mood}
【地点】{location}
【标签】{tags}

【生成要求】
1. 标题要求：
   - 15-25字，吸引眼球
   - 可以用emoji开头增加亲和力
   - 体现温暖、感人、治愈的氛围

2. 正文要求：
   - 300-500字
   - 分3-5个自然段落
   - 适当使用emoji点缀（每段1-2个）
   - 语气亲切温暖，有感染力
   - 可以适当加入感悟和情感表达
   - 如果涉及阿尔茨海默症相关，要表达关爱和温暖

3. 标签要求：
   - 生成6-10个相关标签
   - 包含主题标签和流量标签
   - 用#号开头

请严格按照以下JSON格式输出，不要添加任何其他内容：
{
  "title": "生成的标题",
  "content": "生成的正文内容",
  "tags": ["#标签1", "#标签2", "#标签3"]
}`;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: '未授权' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, date, mood, location, tags } = body;

    if (!title || !content) {
      return NextResponse.json(
        { code: 400, message: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    // 构建提示词
    const prompt = XHS_PROMPT.replace('{title}', title || '')
      .replace('{content}', content || '')
      .replace('{date}', date || '未知')
      .replace('{mood}', mood || '未知')
      .replace('{location}', location || '未知')
      .replace('{tags}', Array.isArray(tags) ? tags.join(', ') : '无');

    // 调用 AI API
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('AI API 调用失败');
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || '';

    // 解析 JSON
    let parsed;
    try {
      // 尝试提取 JSON
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析 AI 响应');
      }
    } catch (e) {
      // 如果解析失败，返回原始内容
      parsed = {
        title: `📝 ${title}`,
        content: aiContent,
        tags: ['#记忆守护', '#温暖时光', '#生活记录']
      };
    }

    return NextResponse.json({
      code: 0,
      message: 'success',
      data: {
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags
      }
    });
  } catch (error) {
    console.error('生成小红书文章失败:', error);
    return NextResponse.json(
      { code: 500, message: '生成失败，请重试' },
      { status: 500 }
    );
  }
}

/**
 * GET - 获取小红书文章模板
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    code: 0,
    data: {
      templates: [
        {
          id: 'warm',
          name: '温暖治愈',
          description: '适合温馨的家庭记忆'
        },
        {
          id: 'nostalgic',
          name: '怀旧回忆',
          description: '适合老照片、过去的故事'
        },
        {
          id: 'daily',
          name: '日常分享',
          description: '适合日常生活点滴'
        },
        {
          id: 'emotional',
          name: '情感感悟',
          description: '适合有深度的情感表达'
        }
      ]
    }
  });
}
