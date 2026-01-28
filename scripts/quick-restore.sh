#!/bin/bash
# 快速恢复表结构脚本 (macOS/Linux)
# 直接使用 psql 执行 SQL 文件，无需 Node.js

echo "========================================"
echo "表结构恢复脚本"
echo "========================================"
echo ""

# 检查 psql 是否可用
if ! command -v psql &> /dev/null; then
    echo "[错误] 未找到 psql 命令"
    echo ""
    echo "请安装 PostgreSQL 客户端:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

echo "[1/3] 检查数据库连接..."
if ! psql -U postgres -d memorybook -c "SELECT 1;" &> /dev/null; then
    echo "[错误] 无法连接到数据库"
    echo ""
    echo "可能的原因:"
    echo "- PostgreSQL 服务未运行"
    echo "- 数据库不存在"
    echo "- 用户名/密码错误"
    echo ""
    echo "请先:"
    echo "1. 启动 PostgreSQL 服务"
    echo "   macOS: brew services start postgresql@XX"
    echo "   Linux: sudo systemctl start postgresql"
    echo ""
    echo "2. 创建数据库:"
    echo "   psql -U postgres -c 'CREATE DATABASE memorybook;'"
    echo ""
    exit 1
fi

echo "[2/3] 执行恢复脚本..."
psql -U postgres -d memorybook -f drizzle/pg/restore_all_tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "[3/3] 验证表结构..."
    psql -U postgres -d memorybook -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    echo ""
    echo "========================================"
    echo "恢复完成！"
    echo "========================================"
else
    echo ""
    echo "[错误] 恢复失败，请检查错误信息"
    exit 1
fi
