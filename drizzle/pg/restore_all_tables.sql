-- ========================================
-- 完整表结构恢复脚本
-- 包含所有原有表 + 新增的7个表
-- 执行时间: 2026-01-28
-- ========================================

-- ========================================
-- 1. 记忆相关表
-- ========================================

-- 记忆表
CREATE TABLE IF NOT EXISTS "memories" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT,
  "memory_date" TIMESTAMP,
  "location" VARCHAR(200),
  "mood" VARCHAR(50),
  "is_public" BOOLEAN DEFAULT false,
  "view_count" INTEGER DEFAULT 0,
  "like_count" INTEGER DEFAULT 0,
  "comment_count" INTEGER DEFAULT 0,
  "status" VARCHAR(20) DEFAULT 'active',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "memories_user_id_idx" ON "memories"("user_id");
CREATE INDEX IF NOT EXISTS "memories_memory_date_idx" ON "memories"("memory_date");
CREATE INDEX IF NOT EXISTS "memories_status_idx" ON "memories"("status");

-- 记忆媒体表
CREATE TABLE IF NOT EXISTS "memory_media" (
  "id" SERIAL PRIMARY KEY,
  "memory_id" INTEGER NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
  "type" VARCHAR(20) NOT NULL,
  "url" VARCHAR(500) NOT NULL,
  "thumbnail_url" VARCHAR(500),
  "file_name" VARCHAR(200),
  "file_size" INTEGER,
  "mime_type" VARCHAR(100),
  "width" INTEGER,
  "height" INTEGER,
  "duration" INTEGER,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "memory_media_memory_id_idx" ON "memory_media"("memory_id");

-- 标签表
CREATE TABLE IF NOT EXISTS "tags" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(50) NOT NULL UNIQUE,
  "color" VARCHAR(20),
  "icon" VARCHAR(50),
  "usage_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- 记忆标签关联表
CREATE TABLE IF NOT EXISTS "memory_tags" (
  "id" SERIAL PRIMARY KEY,
  "memory_id" INTEGER NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
  "tag_id" INTEGER NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "memory_tags_memory_id_idx" ON "memory_tags"("memory_id");
CREATE INDEX IF NOT EXISTS "memory_tags_tag_id_idx" ON "memory_tags"("tag_id");

-- ========================================
-- 2. 相册相关表
-- ========================================

-- 相册表
CREATE TABLE IF NOT EXISTS "albums" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "cover_url" VARCHAR(500),
  "is_public" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "albums_user_id_idx" ON "albums"("user_id");

-- 相册记忆关联表
CREATE TABLE IF NOT EXISTS "album_memories" (
  "id" SERIAL PRIMARY KEY,
  "album_id" INTEGER NOT NULL REFERENCES "albums"("id") ON DELETE CASCADE,
  "memory_id" INTEGER NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "album_memories_album_id_idx" ON "album_memories"("album_id");
CREATE INDEX IF NOT EXISTS "album_memories_memory_id_idx" ON "album_memories"("memory_id");

-- ========================================
-- 3. 家庭圈相关表
-- ========================================

-- 家庭圈表
CREATE TABLE IF NOT EXISTS "family_circles" (
  "id" SERIAL PRIMARY KEY,
  "creator_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "avatar_url" VARCHAR(500),
  "invite_code" VARCHAR(20) UNIQUE,
  "member_count" INTEGER DEFAULT 1,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "family_circles_creator_id_idx" ON "family_circles"("creator_id");

-- 家庭成员表
CREATE TABLE IF NOT EXISTS "family_members" (
  "id" SERIAL PRIMARY KEY,
  "circle_id" INTEGER NOT NULL REFERENCES "family_circles"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "role" VARCHAR(20) DEFAULT 'member',
  "nickname" VARCHAR(50),
  "relationship" VARCHAR(50),
  "joined_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "family_members_circle_id_idx" ON "family_members"("circle_id");
CREATE INDEX IF NOT EXISTS "family_members_user_id_idx" ON "family_members"("user_id");

-- 患者表
CREATE TABLE IF NOT EXISTS "patients" (
  "id" SERIAL PRIMARY KEY,
  "circle_id" INTEGER NOT NULL REFERENCES "family_circles"("id") ON DELETE CASCADE,
  "name" VARCHAR(100) NOT NULL,
  "avatar_url" VARCHAR(500),
  "birth_date" TIMESTAMP,
  "diagnosis_date" TIMESTAMP,
  "stage" VARCHAR(20),
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "patients_circle_id_idx" ON "patients"("circle_id");

-- ========================================
-- 4. 记忆互动相关表
-- ========================================

-- 记忆评论表
CREATE TABLE IF NOT EXISTS "memory_comments" (
  "id" SERIAL PRIMARY KEY,
  "memory_id" INTEGER NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "parent_id" INTEGER REFERENCES "memory_comments"("id"),
  "content" TEXT NOT NULL,
  "like_count" INTEGER DEFAULT 0,
  "status" VARCHAR(20) DEFAULT 'active',
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "memory_comments_memory_id_idx" ON "memory_comments"("memory_id");
CREATE INDEX IF NOT EXISTS "memory_comments_user_id_idx" ON "memory_comments"("user_id");

-- 记忆点赞表
CREATE TABLE IF NOT EXISTS "memory_likes" (
  "id" SERIAL PRIMARY KEY,
  "memory_id" INTEGER NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "memory_likes_memory_user_unique" ON "memory_likes"("memory_id", "user_id");

CREATE INDEX IF NOT EXISTS "memory_likes_memory_id_idx" ON "memory_likes"("memory_id");
CREATE INDEX IF NOT EXISTS "memory_likes_user_id_idx" ON "memory_likes"("user_id");

-- 记忆收藏表
CREATE TABLE IF NOT EXISTS "memory_favorites" (
  "id" SERIAL PRIMARY KEY,
  "memory_id" INTEGER NOT NULL REFERENCES "memories"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "memory_favorites_memory_user_unique" ON "memory_favorites"("memory_id", "user_id");

CREATE INDEX IF NOT EXISTS "memory_favorites_memory_id_idx" ON "memory_favorites"("memory_id");
CREATE INDEX IF NOT EXISTS "memory_favorites_user_id_idx" ON "memory_favorites"("user_id");

-- ========================================
-- 5. 提醒相关表
-- ========================================

-- 记忆提醒表
CREATE TABLE IF NOT EXISTS "memory_reminders" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "memory_id" INTEGER REFERENCES "memories"("id") ON DELETE CASCADE,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT,
  "reminder_time" TIMESTAMP NOT NULL,
  "repeat_type" VARCHAR(20) DEFAULT 'none',
  "is_completed" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "memory_reminders_user_id_idx" ON "memory_reminders"("user_id");
CREATE INDEX IF NOT EXISTS "memory_reminders_reminder_time_idx" ON "memory_reminders"("reminder_time");

-- ========================================
-- 6. 健康管理相关表
-- ========================================

-- 健康记录表
CREATE TABLE IF NOT EXISTS "health_records" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INTEGER NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "creator_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "type" VARCHAR(50) NOT NULL,
  "value" VARCHAR(200),
  "unit" VARCHAR(20),
  "record_date" TIMESTAMP NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "health_records_patient_id_idx" ON "health_records"("patient_id");
CREATE INDEX IF NOT EXISTS "health_records_creator_id_idx" ON "health_records"("creator_id");
CREATE INDEX IF NOT EXISTS "health_records_record_date_idx" ON "health_records"("record_date");

-- 健康指南表
CREATE TABLE IF NOT EXISTS "health_guides" (
  "id" SERIAL PRIMARY KEY,
  "category" VARCHAR(50) NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT NOT NULL,
  "image_url" VARCHAR(500),
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "health_guides_category_idx" ON "health_guides"("category");

-- ========================================
-- 7. 病例档案相关表（新增）
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

CREATE INDEX IF NOT EXISTS "medical_record_tags_record_id_idx" ON "medical_record_tags"("record_id");
CREATE INDEX IF NOT EXISTS "medical_record_tags_tag_id_idx" ON "medical_record_tags"("tag_id");

-- ========================================
-- 8. 位置监控相关表（新增）
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

CREATE INDEX IF NOT EXISTS "geofence_alerts_user_id_idx" ON "geofence_alerts"("user_id");
CREATE INDEX IF NOT EXISTS "geofence_alerts_geofence_id_idx" ON "geofence_alerts"("geofence_id");
CREATE INDEX IF NOT EXISTS "geofence_alerts_created_at_idx" ON "geofence_alerts"("created_at");

-- ========================================
-- 完成提示
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ 所有表结构已恢复！';
  RAISE NOTICE '   原有表: memories, memory_media, tags, memory_tags, albums, album_memories';
  RAISE NOTICE '   原有表: family_circles, family_members, patients';
  RAISE NOTICE '   原有表: memory_comments, memory_likes, memory_favorites, memory_reminders';
  RAISE NOTICE '   原有表: health_records, health_guides';
  RAISE NOTICE '   新增表: medical_categories, medical_records, medical_tags, medical_record_tags';
  RAISE NOTICE '   新增表: location_records, geofences, geofence_alerts';
END $$;
