-- 为Supabase Table Editor准备的消息表迁移SQL
-- 直接在Supabase Table Editor中执行此SQL

-- 1. 添加新字段到messages表
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_id INTEGER,
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS collection_id INTEGER,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 2. 添加外键约束
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_reply_to 
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

ALTER TABLE messages 
ADD CONSTRAINT fk_messages_collection 
  FOREIGN KEY (collection_id) REFERENCES jewelries(id) ON DELETE SET NULL;

-- 3. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_collection_id ON messages(collection_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);

-- 4. 添加字段注释
COMMENT ON COLUMN messages.type IS '消息类型: text, image, emoji, file, collection, poke, quote';
COMMENT ON COLUMN messages.reply_to_id IS '引用的消息ID（用于回复消息）';
COMMENT ON COLUMN messages.file_url IS '文件或图片的URL地址';
COMMENT ON COLUMN messages.file_name IS '文件名称';
COMMENT ON COLUMN messages.file_size IS '文件大小（字节）';
COMMENT ON COLUMN messages.collection_id IS '关联的藏品ID（用于分享藏品）';
COMMENT ON COLUMN messages.is_deleted IS '软删除标记';

-- 5. 验证更新
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;
