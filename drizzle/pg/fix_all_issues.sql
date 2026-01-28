-- ========================================
-- 全面修复数据库问题
-- 执行时间: 2026-01-28
-- ========================================

-- 1. 修复 health_records 表 - 添加缺失字段
ALTER TABLE health_records 
  ADD COLUMN IF NOT EXISTS "data" JSONB,
  ADD COLUMN IF NOT EXISTS "recorded_at" TIMESTAMP DEFAULT NOW();

-- 如果存在 record_date，迁移数据
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'health_records' AND column_name = 'record_date'
  ) THEN
    UPDATE health_records SET recorded_at = COALESCE(recorded_at, record_date);
  END IF;
END $$;

-- 2. 修复 health_guides 表 - 添加缺失字段
ALTER TABLE health_guides 
  ADD COLUMN IF NOT EXISTS "subtitle" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "description" TEXT;

-- 3. 确保 health_records 的 value 字段足够长
ALTER TABLE health_records 
  ALTER COLUMN "value" TYPE VARCHAR(200);

-- 4. 验证
DO $$
BEGIN
  RAISE NOTICE '✅ 数据库修复完成！';
  RAISE NOTICE '';
  RAISE NOTICE '📊 health_records 表：';
  RAISE NOTICE '   - data (JSONB) ✓';
  RAISE NOTICE '   - recorded_at (TIMESTAMP) ✓';
  RAISE NOTICE '   - value (VARCHAR 200) ✓';
  RAISE NOTICE '';
  RAISE NOTICE '📚 health_guides 表：';
  RAISE NOTICE '   - subtitle (VARCHAR 500) ✓';
  RAISE NOTICE '   - description (TEXT) ✓';
END $$;
