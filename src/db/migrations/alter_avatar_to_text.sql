-- 修改 users 表的 avatar 字段类型从 varchar(255) 改为 text
-- 以支持更长的 R2 URL

ALTER TABLE users ALTER COLUMN avatar TYPE text;
