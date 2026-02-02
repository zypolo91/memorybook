-- 为现有的medical_records表添加缺失的列
-- 请在Supabase SQL编辑器中执行

-- 首先查看现有表结构
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medical_records';

-- 添加缺失的列（如果不存在）
DO $$ 
BEGIN
    -- user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'user_id') THEN
        ALTER TABLE medical_records ADD COLUMN user_id INTEGER;
    END IF;
    
    -- patient_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'patient_id') THEN
        ALTER TABLE medical_records ADD COLUMN patient_id INTEGER;
    END IF;
    
    -- category_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'category_id') THEN
        ALTER TABLE medical_records ADD COLUMN category_id INTEGER;
    END IF;
    
    -- file_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'file_type') THEN
        ALTER TABLE medical_records ADD COLUMN file_type VARCHAR(50);
    END IF;
    
    -- file_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'file_url') THEN
        ALTER TABLE medical_records ADD COLUMN file_url VARCHAR(500);
    END IF;
    
    -- thumbnail_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE medical_records ADD COLUMN thumbnail_url VARCHAR(500);
    END IF;
    
    -- file_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'file_name') THEN
        ALTER TABLE medical_records ADD COLUMN file_name VARCHAR(200);
    END IF;
    
    -- file_size
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'file_size') THEN
        ALTER TABLE medical_records ADD COLUMN file_size INTEGER;
    END IF;
    
    -- mime_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'mime_type') THEN
        ALTER TABLE medical_records ADD COLUMN mime_type VARCHAR(100);
    END IF;
    
    -- ai_analysis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'ai_analysis') THEN
        ALTER TABLE medical_records ADD COLUMN ai_analysis JSONB;
    END IF;
    
    -- is_important
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'is_important') THEN
        ALTER TABLE medical_records ADD COLUMN is_important BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'status') THEN
        ALTER TABLE medical_records ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
    
    -- record_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'record_date') THEN
        ALTER TABLE medical_records ADD COLUMN record_date TIMESTAMP;
    END IF;
    
    -- hospital
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'hospital') THEN
        ALTER TABLE medical_records ADD COLUMN hospital VARCHAR(200);
    END IF;
    
    -- doctor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'doctor') THEN
        ALTER TABLE medical_records ADD COLUMN doctor VARCHAR(100);
    END IF;
    
    -- department
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'department') THEN
        ALTER TABLE medical_records ADD COLUMN department VARCHAR(100);
    END IF;
    
    -- diagnosis
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'diagnosis') THEN
        ALTER TABLE medical_records ADD COLUMN diagnosis TEXT;
    END IF;
    
    -- notes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'notes') THEN
        ALTER TABLE medical_records ADD COLUMN notes TEXT;
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'description') THEN
        ALTER TABLE medical_records ADD COLUMN description TEXT;
    END IF;
    
    -- created_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'created_at') THEN
        ALTER TABLE medical_records ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
    
    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'updated_at') THEN
        ALTER TABLE medical_records ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS medical_records_user_id_idx ON medical_records(user_id);
CREATE INDEX IF NOT EXISTS medical_records_patient_id_idx ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS medical_records_file_type_idx ON medical_records(file_type);
CREATE INDEX IF NOT EXISTS medical_records_status_idx ON medical_records(status);
