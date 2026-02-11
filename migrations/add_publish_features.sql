-- 记忆表新增发布功能字段
-- 在 Supabase SQL Editor 中执行

-- 1. 定时发布时间
ALTER TABLE memories ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP;

-- 2. 允许评论 (默认允许)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;

-- 3. 原创声明
ALTER TABLE memories ADD COLUMN IF NOT EXISTS is_original BOOLEAN DEFAULT false;

-- 4. 可见范围 (public/private/family) 替代原有 is_public boolean
ALTER TABLE memories ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

-- 将已有数据的 is_public 迁移到 visibility
UPDATE memories SET visibility = CASE 
  WHEN is_public = true THEN 'public' 
  ELSE 'private' 
END WHERE visibility IS NULL OR visibility = 'public';

-- 5. 封面图 URL (独立存储，不依赖媒体列表第一张)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 6. 封面文字
ALTER TABLE memories ADD COLUMN IF NOT EXISTS cover_text VARCHAR(200);

-- 索引
CREATE INDEX IF NOT EXISTS memories_scheduled_time_idx ON memories (scheduled_time) WHERE scheduled_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS memories_visibility_idx ON memories (visibility);
