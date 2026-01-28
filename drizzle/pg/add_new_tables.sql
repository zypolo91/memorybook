-- ========================================
-- 新增表结构 - 安全迁移脚本
-- 只添加新表，不删除现有表和数据
-- 执行时间: 2026-01-28
-- ========================================

-- ========================================
-- 病例档案相关表
-- ========================================

-- 病例档案分类表
CREATE TABLE IF NOT EXISTS "medical_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL,
  "icon" VARCHAR(50),
  "color" VARCHAR(20),
  "description" TEXT,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 病例档案文件表
CREATE TABLE IF NOT EXISTS "medical_records" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "patient_id" INTEGER REFERENCES "patients"("id"),
  "category_id" INTEGER REFERENCES "medical_categories"("id"),
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "file_url" VARCHAR(500),
  "thumbnail_url" VARCHAR(500),
  "file_type" VARCHAR(50),
  "file_name" VARCHAR(200),
  "file_size" INTEGER,
  "mime_type" VARCHAR(100),
  "record_date" TIMESTAMP,
  "hospital" VARCHAR(200),
  "doctor" VARCHAR(100),
  "department" VARCHAR(100),
  "diagnosis" TEXT,
  "notes" TEXT,
  "ai_analysis" JSONB,
  "is_important" BOOLEAN DEFAULT false,
  "status" VARCHAR(20) DEFAULT 'active',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "medical_records_user_id_idx" ON "medical_records"("user_id");
CREATE INDEX IF NOT EXISTS "medical_records_patient_id_idx" ON "medical_records"("patient_id");
CREATE INDEX IF NOT EXISTS "medical_records_category_id_idx" ON "medical_records"("category_id");
CREATE INDEX IF NOT EXISTS "medical_records_record_date_idx" ON "medical_records"("record_date");

-- 病例档案标签表
CREATE TABLE IF NOT EXISTS "medical_tags" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL UNIQUE,
  "color" VARCHAR(20),
  "usage_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 病例档案标签关联表
CREATE TABLE IF NOT EXISTS "medical_record_tags" (
  "id" SERIAL PRIMARY KEY,
  "record_id" INTEGER NOT NULL REFERENCES "medical_records"("id") ON DELETE CASCADE,
  "tag_id" INTEGER NOT NULL REFERENCES "medical_tags"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "medical_record_tags_record_id_idx" ON "medical_record_tags"("record_id");
CREATE INDEX IF NOT EXISTS "medical_record_tags_tag_id_idx" ON "medical_record_tags"("tag_id");

-- ========================================
-- 位置监控相关表
-- ========================================

-- 位置记录表
CREATE TABLE IF NOT EXISTS "location_records" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "patient_id" INTEGER REFERENCES "patients"("id"),
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "accuracy" DOUBLE PRECISION,
  "altitude" DOUBLE PRECISION,
  "speed" DOUBLE PRECISION,
  "heading" DOUBLE PRECISION,
  "address" VARCHAR(500),
  "recorded_at" TIMESTAMP NOT NULL,
  "device_info" JSONB,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "location_records_user_id_idx" ON "location_records"("user_id");
CREATE INDEX IF NOT EXISTS "location_records_patient_id_idx" ON "location_records"("patient_id");
CREATE INDEX IF NOT EXISTS "location_records_recorded_at_idx" ON "location_records"("recorded_at");

-- 地理围栏表
CREATE TABLE IF NOT EXISTS "geofences" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "patient_id" INTEGER REFERENCES "patients"("id"),
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "center_lat" DOUBLE PRECISION NOT NULL,
  "center_lng" DOUBLE PRECISION NOT NULL,
  "radius" DOUBLE PRECISION NOT NULL,
  "address" VARCHAR(500),
  "is_active" BOOLEAN DEFAULT true,
  "alert_on_exit" BOOLEAN DEFAULT true,
  "alert_on_enter" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "geofences_user_id_idx" ON "geofences"("user_id");
CREATE INDEX IF NOT EXISTS "geofences_patient_id_idx" ON "geofences"("patient_id");

-- 围栏报警记录表
CREATE TABLE IF NOT EXISTS "geofence_alerts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "geofence_id" INTEGER NOT NULL REFERENCES "geofences"("id"),
  "patient_id" INTEGER REFERENCES "patients"("id"),
  "alert_type" VARCHAR(20) NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "address" VARCHAR(500),
  "is_read" BOOLEAN DEFAULT false,
  "is_handled" BOOLEAN DEFAULT false,
  "handled_at" TIMESTAMP,
  "handled_by" INTEGER,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "geofence_alerts_user_id_idx" ON "geofence_alerts"("user_id");
CREATE INDEX IF NOT EXISTS "geofence_alerts_geofence_id_idx" ON "geofence_alerts"("geofence_id");
CREATE INDEX IF NOT EXISTS "geofence_alerts_created_at_idx" ON "geofence_alerts"("created_at");

-- ========================================
-- 完成提示
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 新表创建完成！';
  RAISE NOTICE '   已创建表: medical_categories, medical_records, medical_tags, medical_record_tags';
  RAISE NOTICE '   已创建表: location_records, geofences, geofence_alerts';
END $$;
