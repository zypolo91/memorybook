-- 藏品图片标签表
CREATE TABLE IF NOT EXISTS jewelry_image_tags (
  id SERIAL PRIMARY KEY,
  jewelry_id INTEGER NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  tag_ids JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_jewelry_image_tags_jewelry_id ON jewelry_image_tags(jewelry_id);
CREATE INDEX IF NOT EXISTS idx_jewelry_image_tags_image_url ON jewelry_image_tags(image_url);

-- 添加外键约束（可选，根据需要启用）
-- ALTER TABLE jewelry_image_tags ADD CONSTRAINT fk_jewelry_image_tags_jewelry 
--   FOREIGN KEY (jewelry_id) REFERENCES jewelries(id) ON DELETE CASCADE;
