-- ========================================
-- 修复 health_records 和 health_guides 表的缺失字段
-- 执行时间: 2026-01-28
-- ========================================

-- 1. 修复 health_records 表
ALTER TABLE health_records 
  ADD COLUMN IF NOT EXISTS "data" JSONB,
  ADD COLUMN IF NOT EXISTS "recorded_at" TIMESTAMP DEFAULT NOW();

-- 如果有 record_date 字段，将数据迁移到 recorded_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'health_records' AND column_name = 'record_date'
  ) THEN
    UPDATE health_records SET recorded_at = record_date WHERE recorded_at IS NULL;
    -- 可选：删除旧字段（如果需要）
    -- ALTER TABLE health_records DROP COLUMN IF EXISTS record_date;
  END IF;
END $$;

-- 2. 修复 health_guides 表
ALTER TABLE health_guides 
  ADD COLUMN IF NOT EXISTS "subtitle" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "description" TEXT;

-- 3. 验证修改
DO $$
BEGIN
  RAISE NOTICE '✅ health_records 表字段已更新';
  RAISE NOTICE '   - data (JSONB) - 额外数据';
  RAISE NOTICE '   - recorded_at (TIMESTAMP) - 记录时间';
  RAISE NOTICE '';
  RAISE NOTICE '✅ health_guides 表字段已更新';
  RAISE NOTICE '   - subtitle (VARCHAR) - 副标题';
  RAISE NOTICE '   - description (TEXT) - 描述';
END $$;
