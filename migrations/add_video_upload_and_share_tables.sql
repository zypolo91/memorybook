-- =====================================================
-- Memorybook 新增数据库表 SQL
-- 请在 Supabase SQL Editor 中执行
-- =====================================================

-- 1. 视频上传记录表（用于断点续传）
CREATE TABLE IF NOT EXISTS video_upload_records (
    id SERIAL PRIMARY KEY,
    resume_key VARCHAR(100) NOT NULL UNIQUE,
    upload_id VARCHAR(200) NOT NULL,
    key VARCHAR(500) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    file_name VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    uploaded_parts JSONB DEFAULT '[]',
    total_parts INTEGER,
    status VARCHAR(20) DEFAULT 'uploading', -- uploading, completed, failed, expired
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP -- 过期时间，默认24小时后
);

-- 索引
CREATE INDEX IF NOT EXISTS video_upload_resume_key_idx ON video_upload_records(resume_key);
CREATE INDEX IF NOT EXISTS video_upload_user_id_idx ON video_upload_records(user_id);
CREATE INDEX IF NOT EXISTS video_upload_status_idx ON video_upload_records(status);

-- 2. 分享链接表（用于病例记录等私有数据的分享）
-- 注意：根据用户反馈，病例记录只需要家属圈成员可见，不需要分享链接
-- 此表保留用于其他资源的分享功能
CREATE TABLE IF NOT EXISTS share_links (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE, -- 分享码
    resource_type VARCHAR(50) NOT NULL, -- medical_record, memory, album
    resource_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    password VARCHAR(100), -- 可选密码
    view_count INTEGER DEFAULT 0,
    max_views INTEGER, -- 最大查看次数，null表示无限制
    expires_at TIMESTAMP, -- 过期时间，null表示永不过期
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS share_links_code_idx ON share_links(code);
CREATE INDEX IF NOT EXISTS share_links_user_id_idx ON share_links(user_id);

-- 3. 为 medical_records 表添加分享相关字段
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS shared_at TIMESTAMP;

-- =====================================================
-- 注意事项：
-- 1. 执行前请确保 users 表已存在
-- 2. 如果表已存在，CREATE TABLE IF NOT EXISTS 会跳过
-- 3. 索引同样使用 IF NOT EXISTS 避免重复创建
-- 4. ALTER TABLE ADD COLUMN IF NOT EXISTS 用于添加新字段
-- =====================================================
