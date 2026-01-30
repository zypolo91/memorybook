-- 插入测试家庭圈（如果不存在）
INSERT INTO family_circles (id, name, creator_id, created_at)
VALUES (1, '测试家庭圈', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入测试患者
INSERT INTO patients (id, circle_id, name, birth_date, diagnosis_date, stage, cognitive_status, notes, created_at)
VALUES (
  1, 
  1, 
  '测试患者', 
  '1950-01-01', 
  '2023-01-01', 
  'early', 
  'mci',
  '这是一个测试患者，用于演示阿尔茨海默健康监控功能',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  cognitive_status = EXCLUDED.cognitive_status;

-- 确认插入成功
SELECT id, name, cognitive_status FROM patients WHERE id = 1;
