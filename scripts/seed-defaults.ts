/**
 * MemoryBook - 初始化默认数据
 * 初始化默认标签
 */
import { db } from '../src/db';
import { tags } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// MemoryBook 默认标签
const defaultTags = [
  { name: '生日', color: '#FF6B6B' },
  { name: '旅行', color: '#4ECDC4' },
  { name: '聚会', color: '#FFE66D' },
  { name: '节日', color: '#FF8C42' },
  { name: '日常', color: '#95E1D3' },
  { name: '美食', color: '#F38181' },
  { name: '散步', color: '#AA96DA' },
  { name: '回忆', color: '#FCBAD3' },
  { name: '家庭', color: '#A8D8EA' },
  { name: '温馨', color: '#FFB6B9' },
  { name: '感动', color: '#FAE3D9' },
  { name: '快乐', color: '#BBDED6' }
];

async function seedDefaults() {
  console.log('🌱 MemoryBook - 开始初始化默认数据...\n');

  try {
    // 初始化默认标签
    console.log('🏷️  初始化默认标签...');
    for (const tag of defaultTags) {
      const existing = await db
        .select()
        .from(tags)
        .where(eq(tags.name, tag.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(tags).values({
          name: tag.name,
          color: tag.color
        });
        console.log(`  ✓ 创建标签: ${tag.name}`);
      } else {
        console.log(`  - 标签已存在: ${tag.name}`);
      }
    }

    console.log('\n✅ MemoryBook 默认数据初始化完成！');
    console.log('\n📊 统计信息:');

    const totalTags = await db.select().from(tags);
    console.log(`  - 总标签数: ${totalTags.length}`);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedDefaults();
