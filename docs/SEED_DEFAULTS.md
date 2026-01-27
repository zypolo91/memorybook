# 系统默认数据初始化

## 概述

本文档说明如何初始化系统默认的珠宝分类和购买渠道数据。这些默认数据对所有用户可见和使用。

## 默认分类

系统预设以下珠宝分类（`isSystem = true`, `userId = null`）：

1. 松石
2. 翡翠
3. 蜜蜡/琥珀
4. 南红
5. 银饰
6. 黄金
7. 其他

## 默认渠道

系统预设以下购买渠道（`isSystem = true`, `userId = null`）：

1. 抖音直播
2. 小红书
3. 闲鱼
4. 淘宝/天猫
5. 实体店
6. 朋友转让
7. 其他

## 运行初始化脚本

### 方法一：使用 npm/pnpm 脚本

```bash
# 使用 pnpm
pnpm seed:defaults

# 或使用 npm
npm run seed:defaults
```

### 方法二：直接运行

```bash
tsx scripts/seed-defaults.ts
```

## 工作原理

### 数据库架构

- **isSystem**: 布尔值，标记是否为系统预设数据
- **userId**: 整数或 null，系统预设数据的 userId 为 null

### API 查询逻辑

API 端点会返回以下数据：

```typescript
// 获取分类/渠道时的查询条件
where(
  or(
    eq(table.isSystem, true), // 所有系统预设数据
    eq(table.userId, currentUser.id) // 当前用户自定义数据
  )
);
```

这确保了：

- ✅ 所有用户都能访问系统预设数据
- ✅ 用户只能看到自己创建的自定义数据
- ✅ 用户无法修改或删除系统预设数据

## 脚本特性

- **幂等性**: 可以安全地多次运行，不会创建重复数据
- **检查机制**: 运行前检查数据是否已存在
- **统计信息**: 完成后显示系统数据统计

## 示例输出

```
🌱 开始初始化系统默认数据...

📦 检查默认分类...
  ✓ 创建分类: 松石
  ✓ 创建分类: 翡翠
  ✓ 创建分类: 蜜蜡/琥珀
  ...

🏪 检查默认渠道...
  ✓ 创建渠道: 抖音直播
  ✓ 创建渠道: 小红书
  ...

✅ 系统默认数据初始化完成！

📊 统计信息:
  - 总分类数: 7
  - 系统分类: 7
  - 总渠道数: 7
  - 系统渠道: 7
```

## 注意事项

1. 确保数据库连接配置正确（`.env.local` 文件）
2. 首次部署时应运行此脚本
3. 脚本会自动跳过已存在的数据
4. 系统预设数据不应通过 API 修改或删除

## 相关文件

- 脚本文件: `scripts/seed-defaults.ts`
- API 端点:
  - `src/app/api/jewelry-categories/route.ts`
  - `src/app/api/purchase-channels/route.ts`
- 数据库架构: `src/db/schema.pg.ts`
