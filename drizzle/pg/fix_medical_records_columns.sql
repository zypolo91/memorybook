-- 修复 medical_records 表缺失的列
-- 问题：数据库中 medical_records 表可能缺少多个列

DO $$
BEGIN
  -- 添加 file_url 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "file_url" VARCHAR(500);
    RAISE NOTICE '✅ 已添加 file_url 列';
  ELSE
    RAISE NOTICE '⏭️ file_url 列已存在';
  END IF;

  -- 添加 thumbnail_url 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "thumbnail_url" VARCHAR(500);
    RAISE NOTICE '✅ 已添加 thumbnail_url 列';
  ELSE
    RAISE NOTICE '⏭️ thumbnail_url 列已存在';
  END IF;

  -- 添加 file_type 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "file_type" VARCHAR(50);
    RAISE NOTICE '✅ 已添加 file_type 列';
  ELSE
    RAISE NOTICE '⏭️ file_type 列已存在';
  END IF;

  -- 添加 file_name 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "file_name" VARCHAR(200);
    RAISE NOTICE '✅ 已添加 file_name 列';
  ELSE
    RAISE NOTICE '⏭️ file_name 列已存在';
  END IF;

  -- 添加 file_size 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "file_size" INTEGER;
    RAISE NOTICE '✅ 已添加 file_size 列';
  ELSE
    RAISE NOTICE '⏭️ file_size 列已存在';
  END IF;

  -- 添加 mime_type 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "mime_type" VARCHAR(100);
    RAISE NOTICE '✅ 已添加 mime_type 列';
  ELSE
    RAISE NOTICE '⏭️ mime_type 列已存在';
  END IF;

  -- 添加 record_date 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'record_date'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "record_date" TIMESTAMP;
    RAISE NOTICE '✅ 已添加 record_date 列';
  ELSE
    RAISE NOTICE '⏭️ record_date 列已存在';
  END IF;

  -- 添加 hospital 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'hospital'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "hospital" VARCHAR(200);
    RAISE NOTICE '✅ 已添加 hospital 列';
  ELSE
    RAISE NOTICE '⏭️ hospital 列已存在';
  END IF;

  -- 添加 doctor 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'doctor'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "doctor" VARCHAR(100);
    RAISE NOTICE '✅ 已添加 doctor 列';
  ELSE
    RAISE NOTICE '⏭️ doctor 列已存在';
  END IF;

  -- 添加 department 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'department'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "department" VARCHAR(100);
    RAISE NOTICE '✅ 已添加 department 列';
  ELSE
    RAISE NOTICE '⏭️ department 列已存在';
  END IF;

  -- 添加 diagnosis 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'diagnosis'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "diagnosis" TEXT;
    RAISE NOTICE '✅ 已添加 diagnosis 列';
  ELSE
    RAISE NOTICE '⏭️ diagnosis 列已存在';
  END IF;

  -- 添加 notes 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'notes'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "notes" TEXT;
    RAISE NOTICE '✅ 已添加 notes 列';
  ELSE
    RAISE NOTICE '⏭️ notes 列已存在';
  END IF;

  -- 添加 ai_analysis 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "ai_analysis" JSONB;
    RAISE NOTICE '✅ 已添加 ai_analysis 列';
  ELSE
    RAISE NOTICE '⏭️ ai_analysis 列已存在';
  END IF;

  -- 添加 is_important 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'is_important'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "is_important" BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ 已添加 is_important 列';
  ELSE
    RAISE NOTICE '⏭️ is_important 列已存在';
  END IF;

  -- 添加 status 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'status'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "status" VARCHAR(20) DEFAULT 'active';
    RAISE NOTICE '✅ 已添加 status 列';
  ELSE
    RAISE NOTICE '⏭️ status 列已存在';
  END IF;

  -- 添加 category_id 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "category_id" INTEGER;
    RAISE NOTICE '✅ 已添加 category_id 列';
  ELSE
    RAISE NOTICE '⏭️ category_id 列已存在';
  END IF;

  -- 添加 updated_at 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'medical_records' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE "medical_records" ADD COLUMN "updated_at" TIMESTAMP DEFAULT NOW();
    RAISE NOTICE '✅ 已添加 updated_at 列';
  ELSE
    RAISE NOTICE '⏭️ updated_at 列已存在';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ medical_records 表修复完成！';
  RAISE NOTICE '已检查并添加所有缺失的列：';
  RAISE NOTICE '  - file_url, thumbnail_url, file_type, file_name, file_size, mime_type';
  RAISE NOTICE '  - record_date, hospital, doctor, department, diagnosis, notes';
  RAISE NOTICE '  - ai_analysis, is_important, status, category_id, updated_at';
END $$;
