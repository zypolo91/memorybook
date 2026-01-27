# 直播间功能 - 数据库迁移指南

## 概述

本次更新添加了直播间聚合功能的后端支持，包括以下数据表：

- `live_rooms` - 直播间主表
- `live_status_cache` - 直播状态缓存表
- `live_history` - 直播历史记录表

## 数据库迁移步骤

### 1. 生成迁移文件

```bash
cd admin
pnpm drizzle-kit generate
```

这会在 `drizzle/pg/` 目录下生成新的迁移SQL文件。

### 2. 推送到数据库

```bash
pnpm drizzle-kit push
```

或者手动执行生成的SQL文件：

```bash
pnpm drizzle-kit migrate
```

### 3. 验证迁移

```bash
pnpm drizzle-kit studio
```

打开 Drizzle Studio 检查表是否创建成功。

## 新增表结构

### live_rooms 表

| 字段                 | 类型         | 说明                                     |
| -------------------- | ------------ | ---------------------------------------- |
| id                   | serial       | 主键                                     |
| unique_id            | varchar(100) | 客户端UUID                               |
| user_id              | integer      | 用户ID                                   |
| platform             | varchar(20)  | 平台: douyin/taobao/xiaohongshu/kuaishou |
| room_id              | varchar(100) | 平台直播间ID                             |
| anchor_name          | varchar(100) | 主播名称                                 |
| avatar_url           | varchar(500) | 主播头像                                 |
| original_url         | text         | 原始链接                                 |
| category             | varchar(50)  | 分类                                     |
| note                 | text         | 用户备注                                 |
| notification_enabled | boolean      | 通知开关                                 |
| sort_order           | integer      | 排序                                     |
| created_at           | timestamp    | 创建时间                                 |
| updated_at           | timestamp    | 更新时间                                 |

**唯一索引**: `(user_id, platform, room_id)`

### live_status_cache 表

| 字段            | 类型         | 说明         |
| --------------- | ------------ | ------------ |
| id              | serial       | 主键         |
| live_room_id    | integer      | 关联直播间ID |
| is_live         | boolean      | 是否直播中   |
| start_time      | timestamp    | 开播时间     |
| viewer_count    | integer      | 观看人数     |
| title           | varchar(255) | 直播标题     |
| cover_url       | varchar(500) | 封面图       |
| last_checked_at | timestamp    | 最后检查时间 |

### live_history 表

| 字段         | 类型         | 说明         |
| ------------ | ------------ | ------------ |
| id           | serial       | 主键         |
| live_room_id | integer      | 关联直播间ID |
| start_time   | timestamp    | 开播时间     |
| end_time     | timestamp    | 结束时间     |
| duration     | integer      | 时长(秒)     |
| peak_viewers | integer      | 峰值观看人数 |
| title        | varchar(255) | 直播标题     |

## API 接口

### 直播间 CRUD

| 方法   | 路径                 | 说明           |
| ------ | -------------------- | -------------- |
| GET    | /api/live/rooms      | 获取直播间列表 |
| POST   | /api/live/rooms      | 添加直播间     |
| PUT    | /api/live/rooms/[id] | 更新直播间     |
| DELETE | /api/live/rooms/[id] | 删除直播间     |
| POST   | /api/live/rooms/sync | 批量同步直播间 |

### 直播状态

| 方法 | 路径                   | 说明             |
| ---- | ---------------------- | ---------------- |
| POST | /api/live/status/batch | 批量获取直播状态 |

## 请求头

所有接口需要传递用户ID：

```
X-User-Id: <用户ID>
```

## 快速迁移命令

```bash
# 一键执行
cd admin && pnpm drizzle-kit push
```

## 回滚

如需回滚，手动执行以下SQL：

```sql
DROP TABLE IF EXISTS live_history;
DROP TABLE IF EXISTS live_status_cache;
DROP TABLE IF EXISTS live_rooms;
```

## 注意事项

1. 确保 `.env.local` 中的数据库连接配置正确
2. 生产环境建议先在测试环境验证
3. 迁移前建议备份数据库
