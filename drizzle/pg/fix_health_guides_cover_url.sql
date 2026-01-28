-- 修复 health_guides 表缺失 cover_url 字段（Drizzle schema: coverUrl）
-- 可在 Supabase SQL Editor 直接执行

ALTER TABLE health_guides
  ADD COLUMN IF NOT EXISTS "cover_url" TEXT;

