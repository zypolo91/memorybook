-- 添加消息表的新字段以支持多种消息类型
-- 适用于PostgreSQL和MySQL

-- PostgreSQL版本
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS collection_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- 为reply_to_id添加外键约束
ALTER TABLE messages ADD CONSTRAINT fk_messages_reply_to 
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

-- 为collection_id添加外键约束
ALTER TABLE messages ADD CONSTRAINT fk_messages_collection 
  FOREIGN KEY (collection_id) REFERENCES jewelries(id) ON DELETE SET NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_collection_id ON messages(collection_id);

-- 更新type字段的注释
COMMENT ON COLUMN messages.type IS '消息类型: text, image, emoji, file, collection, poke, quote';
COMMENT ON COLUMN messages.reply_to_id IS '引用的消息ID';
COMMENT ON COLUMN messages.file_url IS '文件/图片URL';
COMMENT ON COLUMN messages.file_name IS '文件名';
COMMENT ON COLUMN messages.file_size IS '文件大小(bytes)';
COMMENT ON COLUMN messages.collection_id IS '藏品ID';
COMMENT ON COLUMN messages.is_deleted IS '是否已删除(软删除)';
