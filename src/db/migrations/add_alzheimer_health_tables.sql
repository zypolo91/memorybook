-- ========================================
-- 阿尔茨海默病健康监控模块 - 数据库表
-- 执行时间: 2026-01-30
-- ========================================

-- ----------------------------------------
-- 1. 认知评估表 (cognitive_assessments)
-- 存储 MMSE、MoCA、ACE-R 等量表评估结果
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS cognitive_assessments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    assessor_id INTEGER NOT NULL REFERENCES users(id),  -- 评估者（家属/医生）
    scale_type VARCHAR(20) NOT NULL,  -- mmse, moca, acer
    total_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    dimension_scores JSONB,  -- 各维度得分 {"orientation": 10, "memory": 6, ...}
    severity VARCHAR(20),  -- normal, mild, moderate, severe
    assessor_notes TEXT,
    assessed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cognitive_assessments_patient_id ON cognitive_assessments(patient_id);
CREATE INDEX idx_cognitive_assessments_scale_type ON cognitive_assessments(scale_type);
CREATE INDEX idx_cognitive_assessments_assessed_at ON cognitive_assessments(assessed_at);

-- ----------------------------------------
-- 2. 生物标志物记录表 (biomarker_records)
-- 存储 CSF、血液、影像学检查结果
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS biomarker_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    category VARCHAR(20) NOT NULL,  -- csf, blood, imaging
    biomarker_type VARCHAR(50) NOT NULL,  -- ab42, ttau, ptau181, mta_score, etc.
    value DECIMAL(12, 4) NOT NULL,
    unit VARCHAR(30),
    reference_range VARCHAR(100),  -- 参考范围，如 ">500 pg/mL"
    interpretation VARCHAR(20),  -- normal, abnormal, borderline
    hospital_name VARCHAR(200),
    doctor_name VARCHAR(100),
    report_image_url TEXT,
    tested_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_biomarker_records_patient_id ON biomarker_records(patient_id);
CREATE INDEX idx_biomarker_records_category ON biomarker_records(category);
CREATE INDEX idx_biomarker_records_biomarker_type ON biomarker_records(biomarker_type);
CREATE INDEX idx_biomarker_records_tested_at ON biomarker_records(tested_at);

-- ----------------------------------------
-- 3. 认知训练游戏表 (cognitive_games)
-- 游戏定义（系统预置）
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS cognitive_games (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    category VARCHAR(30) NOT NULL,  -- memory, attention, executive, language
    description TEXT,
    icon_url VARCHAR(500),
    min_level INTEGER DEFAULT 1,
    max_level INTEGER DEFAULT 5,
    estimated_minutes INTEGER DEFAULT 5,
    instructions TEXT,  -- 游戏说明
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cognitive_games_category ON cognitive_games(category);

-- ----------------------------------------
-- 4. 游戏训练记录表 (game_sessions)
-- 用户游戏训练记录
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES cognitive_games(id),
    level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER,
    duration_seconds INTEGER,
    accuracy DECIMAL(5, 2),  -- 正确率 0-100
    details JSONB,  -- 详细数据 {"correct": 8, "wrong": 2, "skipped": 0}
    played_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_game_sessions_patient_id ON game_sessions(patient_id);
CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_played_at ON game_sessions(played_at);

-- ----------------------------------------
-- 5. 饮食记录表 (diet_records)
-- MIND饮食记录
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS diet_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    record_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL,  -- breakfast, lunch, dinner, snack
    foods JSONB NOT NULL,  -- [{"name": "菠菜", "category": "green_leafy", "portion": 1, "unit": "份"}]
    mind_score INTEGER,  -- 0-15 MIND饮食评分
    calories INTEGER,  -- 卡路里（可选）
    notes TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_diet_records_patient_id ON diet_records(patient_id);
CREATE INDEX idx_diet_records_record_date ON diet_records(record_date);
CREATE INDEX idx_diet_records_meal_type ON diet_records(meal_type);

-- ----------------------------------------
-- 6. MIND食物分类表 (mind_food_categories)
-- MIND饮食食物分类定义
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS mind_food_categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,  -- green_leafy, berries, nuts, etc.
    name VARCHAR(50) NOT NULL,
    name_en VARCHAR(50),
    description TEXT,
    is_recommended BOOLEAN DEFAULT TRUE,  -- true=推荐, false=限制
    weekly_target INTEGER,  -- 每周目标份数
    daily_target DECIMAL(3, 1),  -- 每日目标份数
    icon VARCHAR(50),
    color VARCHAR(20),
    example_foods TEXT,  -- 示例食物
    sort_order INTEGER DEFAULT 0
);

-- ----------------------------------------
-- 7. 运动记录表 (exercise_records)
-- 运动锻炼记录
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS exercise_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    exercise_type VARCHAR(30) NOT NULL,  -- aerobic, strength, finger, balance, flexibility
    exercise_name VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    intensity VARCHAR(20),  -- low, moderate, high
    heart_rate_avg INTEGER,
    heart_rate_max INTEGER,
    calories_burned INTEGER,
    steps INTEGER,
    distance_meters INTEGER,
    notes TEXT,
    exercised_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercise_records_patient_id ON exercise_records(patient_id);
CREATE INDEX idx_exercise_records_exercise_type ON exercise_records(exercise_type);
CREATE INDEX idx_exercise_records_exercised_at ON exercise_records(exercised_at);

-- ----------------------------------------
-- 8. 运动计划表 (exercise_plans)
-- 个性化运动计划
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS exercise_plans (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    exercises JSONB NOT NULL,  -- [{"type": "aerobic", "name": "快走", "duration": 30, "frequency": "daily"}]
    weekly_goal_minutes INTEGER DEFAULT 150,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercise_plans_patient_id ON exercise_plans(patient_id);

-- ----------------------------------------
-- 9. 运动视频表 (exercise_videos)
-- 运动指导视频（系统预置）
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS exercise_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    exercise_type VARCHAR(30) NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration_seconds INTEGER,
    difficulty VARCHAR(20),  -- easy, medium, hard
    target_audience VARCHAR(50),  -- elderly, caregiver, all
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exercise_videos_exercise_type ON exercise_videos(exercise_type);

-- ----------------------------------------
-- 10. 健康评分历史表 (health_scores)
-- 综合健康评分记录
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS health_scores (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    score_date DATE NOT NULL,
    cognitive_score INTEGER,  -- 认知评分 0-100
    training_score INTEGER,   -- 训练完成度 0-100
    diet_score INTEGER,       -- 饮食评分 0-100
    exercise_score INTEGER,   -- 运动评分 0-100
    overall_score INTEGER,    -- 综合评分 0-100
    details JSONB,            -- 详细数据
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patient_id, score_date)
);

CREATE INDEX idx_health_scores_patient_id ON health_scores(patient_id);
CREATE INDEX idx_health_scores_score_date ON health_scores(score_date);

-- ----------------------------------------
-- 11. 食谱推荐表 (recipes)
-- MIND饮食食谱
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(30),  -- breakfast, lunch, dinner, snack, soup, salad
    mind_categories JSONB,  -- ["green_leafy", "fish", "olive_oil"]
    ingredients JSONB,  -- [{"name": "三文鱼", "amount": "200g"}]
    instructions TEXT,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    servings INTEGER,
    calories_per_serving INTEGER,
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    difficulty VARCHAR(20),  -- easy, medium, hard
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipes_category ON recipes(category);

-- ========================================
-- 插入初始数据
-- ========================================

-- 插入认知训练游戏
INSERT INTO cognitive_games (name, name_en, category, description, min_level, max_level, estimated_minutes, sort_order) VALUES
-- 记忆力训练
('配对翻牌', 'Memory Match', 'memory', '翻开卡片找到配对的图案，训练视觉记忆和工作记忆', 1, 5, 5, 1),
('数字记忆', 'Number Memory', 'memory', '记住并复述数字序列，训练短期记忆和数字广度', 1, 5, 3, 2),
('位置记忆', 'Position Memory', 'memory', '记住物品出现的位置，训练空间记忆', 1, 5, 5, 3),
('故事回忆', 'Story Recall', 'memory', '听故事后回答问题，训练情景记忆和语义记忆', 1, 3, 8, 4),
-- 注意力训练
('舒尔特方格', 'Schulte Grid', 'attention', '按顺序点击数字，训练注意力集中和视觉搜索', 1, 5, 3, 5),
('颜色干扰', 'Stroop Test', 'attention', '说出文字的颜色而非内容，训练选择性注意和抑制控制', 1, 3, 5, 6),
('目标追踪', 'Target Tracking', 'attention', '追踪移动的目标，训练持续性注意', 1, 5, 5, 7),
-- 执行功能训练
('分类排序', 'Card Sorting', 'executive', '按规则对卡片分类，训练认知灵活性', 1, 3, 5, 8),
('计划迷宫', 'Maze Planning', 'executive', '规划最短路径走出迷宫，训练计划能力', 1, 5, 5, 9),
('双任务挑战', 'Dual Task', 'executive', '同时完成两个任务，训练任务切换能力', 1, 3, 5, 10),
-- 语言能力训练
('词语联想', 'Word Association', 'language', '说出相关词语，训练语义流畅性', 1, 3, 5, 11),
('图片命名', 'Picture Naming', 'language', '说出图片中物品的名称，训练命名能力', 1, 3, 5, 12),
('句子完成', 'Sentence Completion', 'language', '完成不完整的句子，训练语言理解', 1, 3, 5, 13);

-- 插入MIND食物分类
INSERT INTO mind_food_categories (code, name, name_en, is_recommended, weekly_target, daily_target, icon, color, example_foods, sort_order) VALUES
-- 推荐食物（10类）
('green_leafy', '绿叶蔬菜', 'Green Leafy Vegetables', TRUE, NULL, 1, '🥬', '#22C55E', '菠菜、羽衣甘蓝、生菜、芝麻菜、西兰花', 1),
('other_vegetables', '其他蔬菜', 'Other Vegetables', TRUE, NULL, 1, '🥕', '#F97316', '胡萝卜、西红柿、南瓜、青椒、洋葱', 2),
('nuts', '坚果', 'Nuts', TRUE, 5, NULL, '🥜', '#A16207', '核桃、杏仁、腰果、开心果、榛子', 3),
('berries', '浆果', 'Berries', TRUE, 2, NULL, '🫐', '#7C3AED', '蓝莓、草莓、黑莓、覆盆子、蔓越莓', 4),
('beans', '豆类', 'Beans/Legumes', TRUE, 3, NULL, '🫘', '#B45309', '黑豆、扁豆、鹰嘴豆、红豆、绿豆', 5),
('whole_grains', '全谷物', 'Whole Grains', TRUE, NULL, 3, '🌾', '#CA8A04', '燕麦、糙米、全麦面包、藜麦、荞麦', 6),
('fish', '鱼类', 'Fish', TRUE, 1, NULL, '🐟', '#0EA5E9', '三文鱼、沙丁鱼、鲭鱼、金枪鱼、鳕鱼', 7),
('poultry', '禽肉', 'Poultry', TRUE, 2, NULL, '🍗', '#F59E0B', '鸡肉、火鸡肉、鸭肉', 8),
('olive_oil', '橄榄油', 'Olive Oil', TRUE, NULL, NULL, '🫒', '#84CC16', '特级初榨橄榄油', 9),
('wine', '红酒', 'Wine (Optional)', TRUE, NULL, 1, '🍷', '#DC2626', '红葡萄酒（可选，每天≤1杯）', 10),
-- 限制食物（5类）
('red_meat', '红肉', 'Red Meat', FALSE, 4, NULL, '🥩', '#EF4444', '牛肉、猪肉、羊肉（每周<4份）', 11),
('butter', '黄油', 'Butter/Margarine', FALSE, NULL, 1, '🧈', '#FBBF24', '黄油、人造黄油（每天<1汤匙）', 12),
('cheese', '奶酪', 'Cheese', FALSE, 1, NULL, '🧀', '#FCD34D', '全脂奶酪（每周<1份）', 13),
('pastries', '糕点甜食', 'Pastries/Sweets', FALSE, 5, NULL, '🍰', '#FB7185', '蛋糕、饼干、糖果、冰淇淋（每周<5份）', 14),
('fried_food', '油炸快餐', 'Fried/Fast Food', FALSE, 1, NULL, '🍟', '#F87171', '炸鸡、薯条、汉堡（每周<1份）', 15);

-- 插入运动视频示例
INSERT INTO exercise_videos (title, description, exercise_type, video_url, duration_seconds, difficulty, target_audience, sort_order) VALUES
('晨间手指操', '5分钟手指灵活性训练，改善手部协调和大脑活力', 'finger', '/videos/finger_morning.mp4', 300, 'easy', 'elderly', 1),
('坐姿太极', '适合老年人的坐姿太极动作，安全舒缓', 'aerobic', '/videos/seated_taichi.mp4', 900, 'easy', 'elderly', 2),
('平衡训练基础', '简单的平衡练习，预防跌倒', 'balance', '/videos/balance_basic.mp4', 600, 'easy', 'elderly', 3),
('弹力带上肢训练', '使用弹力带进行上肢力量训练', 'strength', '/videos/resistance_upper.mp4', 900, 'medium', 'elderly', 4),
('记忆力手指操', '结合数字记忆的手指运动', 'finger', '/videos/finger_memory.mp4', 480, 'medium', 'elderly', 5);

-- 插入示例食谱
INSERT INTO recipes (title, description, category, mind_categories, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories_per_serving, difficulty, is_featured) VALUES
('蓝莓燕麦早餐碗', '富含抗氧化剂的健脑早餐', 'breakfast', '["berries", "whole_grains", "nuts"]', 
 '[{"name": "燕麦", "amount": "50g"}, {"name": "蓝莓", "amount": "100g"}, {"name": "核桃", "amount": "15g"}, {"name": "蜂蜜", "amount": "1茶匙"}]',
 '1. 燕麦加水煮熟\n2. 加入新鲜蓝莓\n3. 撒上核桃碎\n4. 淋上蜂蜜即可', 5, 10, 1, 350, 'easy', TRUE),
('三文鱼菠菜沙拉', '富含Omega-3和叶酸的健脑午餐', 'lunch', '["fish", "green_leafy", "olive_oil", "nuts"]',
 '[{"name": "三文鱼", "amount": "150g"}, {"name": "菠菜", "amount": "100g"}, {"name": "橄榄油", "amount": "2汤匙"}, {"name": "杏仁", "amount": "20g"}, {"name": "柠檬汁", "amount": "1汤匙"}]',
 '1. 三文鱼煎至金黄\n2. 菠菜洗净沥干\n3. 混合橄榄油和柠檬汁做酱汁\n4. 摆盘撒上杏仁片', 10, 15, 1, 450, 'easy', TRUE),
('地中海烤鸡配蔬菜', '蛋白质丰富的健康晚餐', 'dinner', '["poultry", "other_vegetables", "olive_oil", "beans"]',
 '[{"name": "鸡胸肉", "amount": "200g"}, {"name": "西红柿", "amount": "2个"}, {"name": "洋葱", "amount": "1个"}, {"name": "鹰嘴豆", "amount": "100g"}, {"name": "橄榄油", "amount": "2汤匙"}, {"name": "迷迭香", "amount": "适量"}]',
 '1. 鸡胸肉用橄榄油和香料腌制\n2. 蔬菜切块\n3. 一起放入烤箱200°C烤25分钟\n4. 加入煮熟的鹰嘴豆', 15, 25, 2, 380, 'medium', TRUE);

-- ========================================
-- 更新现有表（可选）
-- ========================================

-- 更新 health_guides 表的 category 枚举说明
COMMENT ON COLUMN health_guides.category IS '分类: cognitive(认知训练), diet(饮食指导), exercise(运动锻炼), emotion(情绪管理), biomarker(生物标志物)';

-- 更新 patients 表，添加认知状态字段
ALTER TABLE patients ADD COLUMN IF NOT EXISTS cognitive_status VARCHAR(30);  -- normal, scd, mci, mild_ad, moderate_ad, severe_ad
COMMENT ON COLUMN patients.cognitive_status IS '认知状态: normal(正常), scd(主观认知下降), mci(轻度认知障碍), mild_ad(轻度AD), moderate_ad(中度AD), severe_ad(重度AD)';

ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_assessment_date TIMESTAMP;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_assessment_score INTEGER;
