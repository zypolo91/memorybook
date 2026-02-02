-- 同步medical_records表结构
-- 如果表不存在则创建，如果存在则添加缺失的列

-- 检查并创建表
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    patient_id INTEGER,
    category_id INTEGER,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    file_type VARCHAR(50),
    file_name VARCHAR(200),
    file_size INTEGER,
    mime_type VARCHAR(100),
    record_date TIMESTAMP,
    hospital VARCHAR(200),
    doctor VARCHAR(100),
    department VARCHAR(100),
    diagnosis TEXT,
    notes TEXT,
    ai_analysis JSONB,
    is_important BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS medical_records_user_id_idx ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS medical_records_category_id_idx ON medical_records(category_id);
CREATE INDEX IF NOT EXISTS medical_records_record_date_idx ON medical_records(record_date);

-- 创建medical_categories表
CREATE TABLE IF NOT EXISTS medical_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 插入默认分类
INSERT INTO medical_categories (name, description, icon, color, sort_order) VALUES
    ('cognitive_assessment', '认知评估', 'psychology', '#6366F1', 1),
    ('biomarker', '生物标志物', 'biotech', '#10B981', 2),
    ('imaging', '影像检查', 'scanner', '#3B82F6', 3),
    ('genetic', '遗传检测', 'hub', '#8B5CF6', 4),
    ('blood_test', '血液检测', 'water_drop', '#EF4444', 5),
    ('medication', '用药记录', 'medication', '#F59E0B', 6),
    ('symptom', '症状记录', 'warning', '#EC4899', 7),
    ('other', '其他', 'folder', '#6B7280', 8)
ON CONFLICT (name) DO NOTHING;

-- 创建medical_tags表
CREATE TABLE IF NOT EXISTS medical_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 创建medical_record_tags表
CREATE TABLE IF NOT EXISTS medical_record_tags (
    id SERIAL PRIMARY KEY,
    record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES medical_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS medical_record_tags_record_id_idx ON medical_record_tags(record_id);
CREATE INDEX IF NOT EXISTS medical_record_tags_tag_id_idx ON medical_record_tags(tag_id);
