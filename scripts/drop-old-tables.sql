-- ========================================
-- MemoryBook - 删除珠宝相关旧表
-- ========================================
-- 在Supabase SQL Editor中执行此脚本
-- 执行前请确认这些表不再需要！

-- 删除珠宝相关表
DROP TABLE IF EXISTS jewelry_image_tags CASCADE;
DROP TABLE IF EXISTS jewelry_value_history CASCADE;
DROP TABLE IF EXISTS jewelries CASCADE;
DROP TABLE IF EXISTS jewelry_categories CASCADE;
DROP TABLE IF EXISTS purchase_channels CASCADE;

-- 删除VIP相关表
DROP TABLE IF EXISTS user_vip CASCADE;
DROP TABLE IF EXISTS vip_levels CASCADE;

-- 删除成就相关表
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- 删除AI相关表
DROP TABLE IF EXISTS ai_chats CASCADE;
DROP TABLE IF EXISTS ai_valuations CASCADE;
DROP TABLE IF EXISTS ai_authentications CASCADE;
DROP TABLE IF EXISTS ai_quotas CASCADE;

-- 删除社区相关表
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;

-- 删除证书相关表
DROP TABLE IF EXISTS cert_image_features CASCADE;
DROP TABLE IF EXISTS cert_verifications CASCADE;
DROP TABLE IF EXISTS cert_knowledge CASCADE;
DROP TABLE IF EXISTS cert_institutions CASCADE;

-- 删除直播相关表
DROP TABLE IF EXISTS live_history CASCADE;
DROP TABLE IF EXISTS live_status_cache CASCADE;
DROP TABLE IF EXISTS live_rooms CASCADE;

-- 删除其他无关表
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS themes CASCADE;
DROP TABLE IF EXISTS user_themes CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS user_levels CASCADE;
DROP TABLE IF EXISTS level_config CASCADE;
DROP TABLE IF EXISTS search_keywords CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_view_history CASCADE;

-- ========================================
-- 第二部分：创建MemoryBook新表
-- ========================================

-- 记忆表
CREATE TABLE IF NOT EXISTS memories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  memory_date TIMESTAMP,
  location VARCHAR(200),
  mood VARCHAR(50),
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(user_id);
CREATE INDEX IF NOT EXISTS memories_status_idx ON memories(status);

-- 记忆媒体表
CREATE TABLE IF NOT EXISTS memory_media (
  id SERIAL PRIMARY KEY,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  file_name VARCHAR(200),
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS memory_media_memory_id_idx ON memory_media(memory_id);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20),
  icon VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 记忆标签关联表
CREATE TABLE IF NOT EXISTS memory_tags (
  id SERIAL PRIMARY KEY,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 相册表
CREATE TABLE IF NOT EXISTS albums (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cover_url VARCHAR(500),
  memory_count INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 相册记忆关联表
CREATE TABLE IF NOT EXISTS album_memories (
  id SERIAL PRIMARY KEY,
  album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 家庭圈表
CREATE TABLE IF NOT EXISTS family_circles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url VARCHAR(500),
  invite_code VARCHAR(20) UNIQUE,
  creator_id INTEGER NOT NULL REFERENCES users(id),
  member_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 家庭圈成员表
CREATE TABLE IF NOT EXISTS family_members (
  id SERIAL PRIMARY KEY,
  circle_id INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(20) DEFAULT 'member',
  nickname VARCHAR(50),
  relationship VARCHAR(50),
  joined_at TIMESTAMP DEFAULT NOW()
);

-- 患者信息表
CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  circle_id INTEGER NOT NULL REFERENCES family_circles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(500),
  birth_date TIMESTAMP,
  diagnosis_date TIMESTAMP,
  stage VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 记忆评论表
CREATE TABLE IF NOT EXISTS memory_comments (
  id SERIAL PRIMARY KEY,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  parent_id INTEGER,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 记忆点赞表
CREATE TABLE IF NOT EXISTS memory_likes (
  id SERIAL PRIMARY KEY,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- 记忆收藏表
CREATE TABLE IF NOT EXISTS memory_favorites (
  id SERIAL PRIMARY KEY,
  memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(memory_id, user_id)
);

-- 提醒表
CREATE TABLE IF NOT EXISTS memory_reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  reminder_time TIMESTAMP NOT NULL,
  repeat_type VARCHAR(20) DEFAULT 'none',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 第三部分：初始化默认标签
-- ========================================
INSERT INTO tags (name, color) VALUES 
  ('生日', '#FF6B6B'),
  ('旅行', '#4ECDC4'),
  ('聚会', '#FFE66D'),
  ('节日', '#FF8C42'),
  ('日常', '#95E1D3'),
  ('美食', '#F38181'),
  ('散步', '#AA96DA'),
  ('回忆', '#FCBAD3'),
  ('家庭', '#A8D8EA'),
  ('温馨', '#FFB6B9'),
  ('感动', '#FAE3D9'),
  ('快乐', '#BBDED6')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 验证所有表
-- ========================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
