@echo off
REM 快速恢复表结构脚本 (Windows)
REM 直接使用 psql 执行 SQL 文件，无需 Node.js

echo ========================================
echo 表结构恢复脚本
echo ========================================
echo.

REM 检查 PostgreSQL 是否在 PATH 中
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 psql 命令
    echo.
    echo 请使用以下方法之一:
    echo 1. 将 PostgreSQL bin 目录添加到 PATH
    echo    例如: C:\Program Files\PostgreSQL\15\bin
    echo.
    echo 2. 使用完整路径执行:
    echo    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d memorybook -f drizzle\pg\restore_all_tables.sql
    echo.
    echo 3. 使用 pgAdmin 或其他数据库工具打开 drizzle\pg\restore_all_tables.sql 并执行
    echo.
    pause
    exit /b 1
)

echo [1/3] 检查数据库连接...
psql -U postgres -d memorybook -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 无法连接到数据库
    echo.
    echo 可能的原因:
    echo - PostgreSQL 服务未运行
    echo - 数据库不存在
    echo - 用户名/密码错误
    echo.
    echo 请先:
    echo 1. 启动 PostgreSQL 服务: net start postgresql-x64-XX
    echo 2. 创建数据库: psql -U postgres -c "CREATE DATABASE memorybook;"
    echo.
    pause
    exit /b 1
)

echo [2/3] 执行恢复脚本...
psql -U postgres -d memorybook -f drizzle\pg\restore_all_tables.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [3/3] 验证表结构...
    psql -U postgres -d memorybook -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    echo.
    echo ========================================
    echo 恢复完成！
    echo ========================================
) else (
    echo.
    echo [错误] 恢复失败，请检查错误信息
)

echo.
pause
