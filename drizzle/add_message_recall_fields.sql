-- 添加消息撤回字段
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recalled_at TIMESTAMP;

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_messages_is_recalled ON messages(is_recalled);
