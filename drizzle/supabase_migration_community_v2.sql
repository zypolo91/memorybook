-- ============================================
-- 社区功能V2数据库迁移脚本 (Supabase PostgreSQL)
-- 功能: 推荐系统、用户偏好、浏览历史、通知系统
-- 执行方式: 复制到Supabase SQL Editor执行
-- ============================================

-- 1. 用户偏好表（用于推荐算法和减少推送功能）
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reduced_categories JSONB DEFAULT '[]'::jsonb,  -- 减少推送的分类
  reduced_topics JSONB DEFAULT '[]'::jsonb,      -- 减少推送的话题
  blocked_users JSONB DEFAULT '[]'::jsonb,       -- 屏蔽的用户ID列表
  not_interested_posts JSONB DEFAULT '[]'::jsonb, -- 不感兴趣的帖子ID列表
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_preferences_user_id_unique UNIQUE(user_id)
);

-- 用户偏好表索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 用户偏好表注释
COMMENT ON TABLE user_preferences IS '用户偏好设置表，用于个性化推荐和内容过滤';
COMMENT ON COLUMN user_preferences.reduced_categories IS '用户选择减少推送的分类列表';
COMMENT ON COLUMN user_preferences.reduced_topics IS '用户选择减少推送的话题列表';
COMMENT ON COLUMN user_preferences.blocked_users IS '用户屏蔽的其他用户ID列表';
COMMENT ON COLUMN user_preferences.not_interested_posts IS '用户标记为不感兴趣的帖子ID列表';

-- 2. 用户浏览历史表（用于推荐算法）
CREATE TABLE IF NOT EXISTS user_view_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  view_duration INTEGER DEFAULT 0,  -- 浏览时长（秒）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_view_history_unique UNIQUE(user_id, post_id)
);

-- 浏览历史表索引
CREATE INDEX IF NOT EXISTS idx_user_view_history_user_id ON user_view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_view_history_post_id ON user_view_history(post_id);
CREATE INDEX IF NOT EXISTS idx_user_view_history_created_at ON user_view_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_view_history_user_created ON user_view_history(user_id, created_at DESC);

-- 浏览历史表注释
COMMENT ON TABLE user_view_history IS '用户浏览历史记录，用于推荐算法分析用户兴趣';
COMMENT ON COLUMN user_view_history.view_duration IS '用户在该帖子停留的时长（秒），用于判断内容质量';

-- 3. 通知表更新（如果已存在则跳过，否则创建）
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,  -- 'system', 'mention', 'follow', 'like', 'comment', 'achievement'
  title VARCHAR(255),
  content TEXT NOT NULL,
  data JSONB,  -- 额外数据
  related_type VARCHAR(50),  -- 'post', 'comment', 'user', 'achievement'
  related_id INTEGER,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 通知表索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 通知表注释
COMMENT ON TABLE notifications IS '系统通知表，包含各类用户通知';
COMMENT ON COLUMN notifications.type IS '通知类型: system-系统通知, mention-@提及, follow-关注, like-点赞, comment-评论, achievement-成就';
COMMENT ON COLUMN notifications.data IS '通知相关的额外数据，JSON格式';

-- 4. 更新messages表（添加撤回相关字段，如果不存在）
DO $$ 
BEGIN
  -- 检查并添加is_recalled字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_recalled'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_recalled BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN messages.is_recalled IS '消息是否已撤回';
  END IF;

  -- 检查并添加recalled_at字段
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'recalled_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN recalled_at TIMESTAMP WITH TIME ZONE;
    COMMENT ON COLUMN messages.recalled_at IS '消息撤回时间';
  END IF;
END $$;

-- 5. 创建自动更新updated_at的触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 为user_preferences表添加自动更新触发器
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建清理旧浏览历史的函数（可选，保留最近90天）
CREATE OR REPLACE FUNCTION cleanup_old_view_history()
RETURNS void AS $$
BEGIN
  DELETE FROM user_view_history 
  WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 8. 创建获取用户推荐帖子的辅助视图（可选）
CREATE OR REPLACE VIEW user_interest_summary AS
SELECT 
  vh.user_id,
  p.type,
  COUNT(*) as view_count,
  AVG(vh.view_duration) as avg_duration
FROM user_view_history vh
JOIN posts p ON vh.post_id = p.id
WHERE vh.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY vh.user_id, p.type;

COMMENT ON VIEW user_interest_summary IS '用户兴趣摘要视图，用于快速分析用户偏好（按帖子类型统计）';

-- 9. 启用Row Level Security (RLS) - Supabase推荐
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_view_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 10. 创建RLS策略 - 用户只能访问自己的数据
-- user_preferences策略
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
CREATE POLICY "Users can insert own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

-- user_view_history策略
DROP POLICY IF EXISTS "Users can view own history" ON user_view_history;
CREATE POLICY "Users can view own history" 
  ON user_view_history FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own history" ON user_view_history;
CREATE POLICY "Users can insert own history" 
  ON user_view_history FOR INSERT 
  WITH CHECK (auth.uid()::text = user_id::text);

-- notifications策略
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

-- 11. 验证迁移结果
DO $$ 
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name IN ('user_preferences', 'user_view_history', 'notifications')
    AND table_schema = 'public';
  
  IF table_count = 3 THEN
    RAISE NOTICE '✓ 迁移成功！所有表已创建';
  ELSE
    RAISE WARNING '⚠ 迁移可能不完整，请检查表创建情况';
  END IF;
END $$;

-- ============================================
-- 迁移完成
-- ============================================
-- 下一步操作建议：
-- 1. 在Supabase Dashboard检查表结构
-- 2. 验证RLS策略是否正确应用
-- 3. 测试API端点是否能正常访问新表
-- 4. 可选：创建定时任务清理旧数据
--    SELECT cron.schedule('cleanup-view-history', '0 2 * * *', 'SELECT cleanup_old_view_history()');
-- ============================================
