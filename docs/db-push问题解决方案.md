# db:push 问题解决方案

## ❌ 问题：为什么 db:push 要删除所有表？

Drizzle 检测到 schema 定义和数据库中的实际表结构不匹配，所以它想要：
1. 删除所有现有表（包括有数据的表）
2. 重新创建所有表

**这会丢失所有数据！** ⚠️

## ✅ 解决方案

### 方案 1: 使用安全迁移脚本（⭐ 推荐）

**最简单、最安全的方法：**

```bash
pnpm db:safe-migrate
```

这个脚本会：
- ✅ 自动检查哪些表已存在
- ✅ 只创建新表（7个新表）
- ✅ **不会删除任何现有表**
- ✅ **不会丢失任何数据**
- ✅ 显示详细的执行日志

### 方案 2: 直接执行 SQL（备选）

```bash
# 方法 A: 使用 psql
psql -U postgres -d memorybook -f drizzle/pg/add_new_tables.sql

# 方法 B: 使用 DATABASE_URL
psql $DATABASE_URL -f drizzle/pg/add_new_tables.sql
```

### 方案 3: 使用 db:push（⚠️ 会丢失数据）

**只有在以下情况下才使用：**
- ✅ 开发环境
- ✅ 可以接受数据丢失
- ✅ 已备份数据

```bash
# 1. 先备份数据（重要！）
pg_dump -U postgres memorybook > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行 push
pnpm db:push

# 3. 如果需要恢复数据
psql -U postgres memorybook < backup_*.sql
```

## 📋 新增的表（7个）

执行迁移后会创建以下新表：

### 病例档案相关（4个）
- `medical_categories` - 病例档案分类
- `medical_records` - 病例档案文件
- `medical_tags` - 病例档案标签
- `medical_record_tags` - 病例档案标签关联

### 位置监控相关（3个）
- `location_records` - 位置记录
- `geofences` - 地理围栏
- `geofence_alerts` - 围栏报警记录

## 🔍 验证迁移

迁移完成后，验证新表是否创建成功：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'medical_categories',
    'medical_records',
    'medical_tags',
    'medical_record_tags',
    'location_records',
    'geofences',
    'geofence_alerts'
  )
ORDER BY table_name;
```

应该返回 7 行。

## ❓ 常见问题

### Q: 为什么不能直接使用 db:push？

A: 因为 Drizzle 的 snapshot 文件与当前数据库状态不匹配，它认为需要重建所有表。这会删除所有现有数据。

### Q: 能否修复 Drizzle 的 snapshot？

A: 可以，但比较复杂。更简单的方法是使用安全迁移脚本。

### Q: 执行安全迁移后，还能使用 db:push 吗？

A: 可以，但建议继续使用 `db:generate` + `db:migrate` 的方式，更安全。

### Q: 如果表已存在会怎样？

A: 安全迁移脚本会跳过已存在的表，不会报错。

## 🎯 推荐工作流

以后添加新表时：

1. **在 schema.memorybook.ts 中定义新表**
2. **使用安全迁移脚本**：`pnpm db:safe-migrate`
3. **或者生成迁移文件**：`pnpm db:generate` → 编辑 → `pnpm db:migrate`

**避免使用 `db:push`**，除非在全新的开发环境中。
