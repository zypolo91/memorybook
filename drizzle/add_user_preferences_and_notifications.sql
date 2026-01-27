-- 用户偏好表（用于减少推送等功能）
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reduced_categories TEXT[] DEFAULT '{}',
  reduced_topics TEXT[] DEFAULT '{}',
  blocked_users INTEGER[] DEFAULT '{}',
  not_interested_posts INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'system', 'mention', 'follow', 'like', 'comment', 'achievement'
  title VARCHAR(255),
  content TEXT NOT NULL,
  related_type VARCHAR(50), -- 'post', 'comment', 'user', 'achievement'
  related_id INTEGER,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 用户浏览历史表（用于推荐算法）
CREATE TABLE IF NOT EXISTS user_view_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  view_duration INTEGER DEFAULT 0, -- 浏览时长（秒）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_user_view_history_user_id ON user_view_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_view_history_created_at ON user_view_history(created_at);
