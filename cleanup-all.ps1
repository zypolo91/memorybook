# ========================================
# MemoryBook - 完整清理脚本
# 删除所有珠宝相关代码，保留MemoryBook相关代码
# ========================================
# 使用方法: 关闭Windsurf IDE后运行此脚本
# PowerShell -ExecutionPolicy Bypass -File cleanup-all.ps1

Write-Host "========================================"
Write-Host "MemoryBook - 完整清理脚本"
Write-Host "========================================"

$base = "f:\memorybook\admin"

# ========================================
# 1. 删除API目录中的珠宝相关路由
# ========================================
Write-Host "`n[1/5] 清理API目录..." -ForegroundColor Yellow

$apiToDelete = @(
    "jewelries",
    "jewelry-categories",
    "achievements",
    "ai",
    "certificate",
    "checkin",
    "community",
    "knowledge",
    "live",
    "market",
    "notifications",
    "purchase-channels",
    "reminders",
    "themes",
    "vip",
    "tools",
    "settings"
)

foreach ($dir in $apiToDelete) {
    $path = "$base\src\app\api\$dir"
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  删除: api\$dir" -ForegroundColor Green
    }
}

# ========================================
# 2. 删除Dashboard中的珠宝相关页面
# ========================================
Write-Host "`n[2/5] 清理Dashboard目录..." -ForegroundColor Yellow

$dashToDelete = @(
    "collection",
    "system\vip",
    "system\achievements",
    "system\themes"
)

foreach ($dir in $dashToDelete) {
    $path = "$base\src\app\dashboard\$dir"
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  删除: dashboard\$dir" -ForegroundColor Green
    }
}

# ========================================
# 3. 删除scripts中的珠宝相关脚本
# ========================================
Write-Host "`n[3/5] 清理scripts目录..." -ForegroundColor Yellow

$scriptsToDelete = @(
    "seed-jewelry-knowledge.ts",
    "seed-certificates.ts",
    "seed-china-institutions.ts",
    "seed-china-institutions-by-province.ts",
    "check-cert-data.ts",
    "crawlers"
)

foreach ($item in $scriptsToDelete) {
    $path = "$base\src\scripts\$item"
    if (Test-Path $path) {
        Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  删除: scripts\$item" -ForegroundColor Green
    }
}

# 删除seeds目录中的珠宝相关种子
$seedsToDelete = @(
    "achievements.seed.ts"
)

foreach ($item in $seedsToDelete) {
    $path = "$base\src\db\seeds\$item"
    if (Test-Path $path) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        Write-Host "  删除: db\seeds\$item" -ForegroundColor Green
    }
}

# ========================================
# 4. 删除旧的清理脚本
# ========================================
Write-Host "`n[4/5] 清理旧脚本..." -ForegroundColor Yellow

$oldScripts = @(
    "scripts\cleanup-jewelry.bat",
    "scripts\cleanup-jewelry.ps1",
    "scripts\cleanup.ps1",
    "scripts\cleanup-database.sql",
    "scripts\add-community-tables.sql",
    "scripts\add-new-tables.sql",
    "scripts\add-new-tables.ts",
    "scripts\seed-v2.ts",
    "scripts\test-openrouter.ts",
    "CLEANUP_README.md"
)

foreach ($item in $oldScripts) {
    $path = "$base\$item"
    if (Test-Path $path) {
        Remove-Item $path -Force -ErrorAction SilentlyContinue
        Write-Host "  删除: $item" -ForegroundColor Green
    }
}

# ========================================
# 5. 重写schema.pg.ts (只保留核心表)
# ========================================
Write-Host "`n[5/5] 重写schema.pg.ts..." -ForegroundColor Yellow

$schemaPgContent = @'
/**
 * MemoryBook - PostgreSQL Schema
 * 只保留核心用户管理表，业务表在 schema.memorybook.ts 中定义
 */
import {
  pgTable,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  jsonb,
  uniqueIndex,
  serial
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ========================================
// 用户管理核心表
// ========================================

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }).default('/avatars/default.jpg'),
  mobile: varchar('mobile', { length: 20 }),
  roleId: integer('role_id').notNull(),
  isSuperAdmin: boolean('is_super_admin').default(false),
  status: varchar('status', { length: 20 }).default('active'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  isSuper: boolean('is_super').default(false),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  parentId: integer('parent_id'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date())
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: serial('id').primaryKey(),
    roleId: integer('role_id').notNull(),
    permissionId: integer('permission_id').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    unq: uniqueIndex('role_permission_unique').on(t.roleId, t.permissionId)
  })
);

export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  level: varchar('level', { length: 20 }).notNull(),
  action: varchar('action', { length: 100 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  message: text('message').notNull(),
  details: jsonb('details'),
  userId: integer('user_id'),
  userAgent: varchar('user_agent', { length: 500 }),
  ip: varchar('ip', { length: 45 }),
  requestId: varchar('request_id', { length: 100 }),
  duration: integer('duration'),
  createdAt: timestamp('created_at').defaultNow()
});

// ========================================
// 关系定义
// ========================================

export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id]
  })
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id]
  })
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  rolePermissions: many(rolePermissions)
}));

export const permissionsRelations = relations(permissions, ({ many, one }) => ({
  rolePermissions: many(rolePermissions),
  parent: one(permissions, {
    fields: [permissions.parentId],
    references: [permissions.id]
  }),
  children: many(permissions, { relationName: 'parent_child' })
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id]
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id]
    })
  })
);
'@

$schemaPgPath = "$base\src\db\schema.pg.ts"
Set-Content -Path $schemaPgPath -Value $schemaPgContent -Encoding UTF8
Write-Host "  重写: schema.pg.ts" -ForegroundColor Green

# ========================================
# 完成
# ========================================
Write-Host "`n========================================"
Write-Host "清理完成!" -ForegroundColor Green
Write-Host "========================================"
Write-Host "`n保留的MemoryBook文件:"
Write-Host "  - src/db/schema.memorybook.ts (MemoryBook业务表)"
Write-Host "  - src/db/schema.ts (导出所有表)"
Write-Host "  - src/app/api/memories/ (记忆API)"
Write-Host "  - src/app/api/albums/ (相册API)"
Write-Host "  - src/app/api/tags/ (标签API)"
Write-Host "  - src/app/api/family/ (家庭圈API)"
Write-Host "  - scripts/seed-defaults.ts (标签初始化)"
Write-Host "  - scripts/init-admin.ts (管理员初始化)"
Write-Host "`n下一步:"
Write-Host "  1. 重新打开Windsurf IDE"
Write-Host "  2. 运行: pnpm db:push"
Write-Host "  3. 运行: pnpm seed:defaults"
Write-Host "  4. 运行: pnpm dev"
