# 直接执行 SQL 恢复表结构（无需 Node.js）

## ⚠️ 如果遇到连接错误

如果 `pnpm db:restore` 报连接错误，可以直接使用 SQL 文件恢复，无需通过 Node.js。

## ✅ 方法 1: 使用 psql 命令行（推荐）

### Windows

```bash
# 方法 A: 如果 PostgreSQL 在 PATH 中
psql -U postgres -d memorybook -f drizzle\pg\restore_all_tables.sql

# 方法 B: 使用完整路径（如果 PostgreSQL 安装在默认位置）
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d memorybook -f drizzle\pg\restore_all_tables.sql

# 方法 C: 如果使用不同的数据库名
psql -U postgres -d your_database_name -f drizzle\pg\restore_all_tables.sql
```

### macOS/Linux

```bash
psql -U postgres -d memorybook -f drizzle/pg/restore_all_tables.sql
```

## ✅ 方法 2: 使用 pgAdmin（图形界面）

1. 打开 pgAdmin
2. 连接到数据库服务器
3. 选择数据库 `memorybook`
4. 右键点击数据库 → Query Tool
5. 打开文件 `drizzle/pg/restore_all_tables.sql`
6. 执行（F5 或点击运行按钮）

## ✅ 方法 3: 使用 DBeaver / DataGrip

1. 连接到 PostgreSQL 数据库
2. 打开 SQL 编辑器
3. 打开文件 `drizzle/pg/restore_all_tables.sql`
4. 执行脚本

## ✅ 方法 4: 使用 VS Code 扩展

如果安装了 PostgreSQL 扩展：

1. 在 VS Code 中打开 `drizzle/pg/restore_all_tables.sql`
2. 连接到数据库
3. 右键点击 → "Execute Query" 或使用快捷键

## 📋 执行步骤

1. **确认数据库服务运行**
   ```bash
   # Windows
   sc query postgresql-x64-XX
   
   # macOS
   brew services list | grep postgresql
   
   # Linux
   sudo systemctl status postgresql
   ```

2. **确认数据库存在**
   ```sql
   -- 连接到 PostgreSQL
   psql -U postgres
   
   -- 列出所有数据库
   \l
   
   -- 如果数据库不存在，创建它
   CREATE DATABASE memorybook;
   
   -- 退出
   \q
   ```

3. **执行恢复脚本**
   ```bash
   cd admin
   psql -U postgres -d memorybook -f drizzle\pg\restore_all_tables.sql
   ```

## 🔍 验证恢复

执行后验证：

```sql
-- 连接到数据库
psql -U postgres -d memorybook

-- 列出所有表
\dt

-- 应该看到 22 个表（不包括系统表）
-- 或者执行查询
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';
```

## ⚠️ 常见问题

### Q: 提示 "password authentication failed"

A: 需要输入密码，或者配置 `.pgpass` 文件：

**Windows:** `C:\Users\YourName\AppData\Roaming\postgresql\pgpass.conf`
**macOS/Linux:** `~/.pgpass`

格式：
```
localhost:5432:memorybook:postgres:your_password
```

### Q: 提示 "database does not exist"

A: 先创建数据库：
```sql
CREATE DATABASE memorybook;
```

### Q: 提示 "connection refused"

A: PostgreSQL 服务未运行，需要启动服务。

**Windows:**
```bash
net start postgresql-x64-XX
```

**macOS:**
```bash
brew services start postgresql@XX
```

**Linux:**
```bash
sudo systemctl start postgresql
```

## 💡 提示

如果仍然无法连接，可以：

1. **检查 `.env.local` 配置**
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=memorybook
   ```

2. **使用 Docker（如果本地没有 PostgreSQL）**
   ```bash
   docker run -d \
     --name postgres-memorybook \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=memorybook \
     -p 5432:5432 \
     postgres:15
   ```

3. **使用云数据库**（如 Supabase、Neon）
   - 获取连接字符串
   - 使用 `psql $DATABASE_URL -f drizzle/pg/restore_all_tables.sql`
