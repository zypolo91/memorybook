/**
 * MemoryBook 数据库Schema定义
 * 阿尔茨海默症患者家属记忆管理系统
 */

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './schema.pg';

// ========================================
// 记忆相关表
// ========================================

/**
 * 记忆表 - 核心表
 */
export const memories = pgTable(
  'memories',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content'),
    memoryDate: timestamp('memory_date'), // 记忆发生的日期
    location: varchar('location', { length: 200 }), // 地点
    mood: varchar('mood', { length: 50 }), // 心情标签
    isPublic: boolean('is_public').default(false), // 是否公开
    viewCount: integer('view_count').default(0),
    likeCount: integer('like_count').default(0),
    commentCount: integer('comment_count').default(0),
    status: varchar('status', { length: 20 }).default('active'), // active, archived, deleted
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('memories_user_id_idx').on(table.userId),
    memoryDateIdx: index('memories_memory_date_idx').on(table.memoryDate),
    statusIdx: index('memories_status_idx').on(table.status)
  })
);

/**
 * 记忆媒体表 - 图片/视频/音频
 */
export const memoryMedia = pgTable(
  'memory_media',
  {
    id: serial('id').primaryKey(),
    memoryId: integer('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull(), // image, video, audio
    url: varchar('url', { length: 500 }).notNull(),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    fileName: varchar('file_name', { length: 200 }),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    width: integer('width'),
    height: integer('height'),
    duration: integer('duration'), // 视频/音频时长(秒)
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    memoryIdIdx: index('memory_media_memory_id_idx').on(table.memoryId)
  })
);

/**
 * 标签表
 */
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 20 }),
  icon: varchar('icon', { length: 50 }),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * 记忆标签关联表
 */
export const memoryTags = pgTable(
  'memory_tags',
  {
    id: serial('id').primaryKey(),
    memoryId: integer('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    memoryIdIdx: index('memory_tags_memory_id_idx').on(table.memoryId),
    tagIdIdx: index('memory_tags_tag_id_idx').on(table.tagId)
  })
);

// ========================================
// 相册相关表
// ========================================

/**
 * 相册表
 */
export const albums = pgTable(
  'albums',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    coverUrl: varchar('cover_url', { length: 500 }),
    memoryCount: integer('memory_count').default(0),
    isDefault: boolean('is_default').default(false),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('albums_user_id_idx').on(table.userId)
  })
);

/**
 * 相册记忆关联表
 */
export const albumMemories = pgTable(
  'album_memories',
  {
    id: serial('id').primaryKey(),
    albumId: integer('album_id')
      .notNull()
      .references(() => albums.id, { onDelete: 'cascade' }),
    memoryId: integer('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    albumIdIdx: index('album_memories_album_id_idx').on(table.albumId),
    memoryIdIdx: index('album_memories_memory_id_idx').on(table.memoryId)
  })
);

// ========================================
// 家庭圈相关表
// ========================================

/**
 * 家庭圈表
 */
export const familyCircles = pgTable('family_circles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  inviteCode: varchar('invite_code', { length: 20 }).unique(),
  creatorId: integer('creator_id')
    .notNull()
    .references(() => users.id),
  memberCount: integer('member_count').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * 家庭圈成员表
 */
export const familyMembers = pgTable(
  'family_members',
  {
    id: serial('id').primaryKey(),
    circleId: integer('circle_id')
      .notNull()
      .references(() => familyCircles.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    role: varchar('role', { length: 20 }).default('member'), // admin, member
    nickname: varchar('nickname', { length: 50 }),
    relationship: varchar('relationship', { length: 50 }), // 与患者的关系
    joinedAt: timestamp('joined_at').defaultNow()
  },
  (table) => ({
    circleIdIdx: index('family_members_circle_id_idx').on(table.circleId),
    userIdIdx: index('family_members_user_id_idx').on(table.userId)
  })
);

/**
 * 患者信息表
 */
export const patients = pgTable('patients', {
  id: serial('id').primaryKey(),
  circleId: integer('circle_id')
    .notNull()
    .references(() => familyCircles.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  birthDate: timestamp('birth_date'),
  diagnosisDate: timestamp('diagnosis_date'), // 确诊日期
  stage: varchar('stage', { length: 20 }), // 病情阶段: early, middle, late
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ========================================
// 互动相关表
// ========================================

/**
 * 评论表
 */
export const memoryComments = pgTable(
  'memory_comments',
  {
    id: serial('id').primaryKey(),
    memoryId: integer('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    parentId: integer('parent_id'), // 回复的评论ID
    content: text('content').notNull(),
    likeCount: integer('like_count').default(0),
    status: varchar('status', { length: 20 }).default('active'),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    memoryIdIdx: index('memory_comments_memory_id_idx').on(table.memoryId),
    userIdIdx: index('memory_comments_user_id_idx').on(table.userId)
  })
);

/**
 * 点赞表
 */
export const memoryLikes = pgTable(
  'memory_likes',
  {
    id: serial('id').primaryKey(),
    memoryId: integer('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    memoryIdIdx: index('memory_likes_memory_id_idx').on(table.memoryId),
    userIdIdx: index('memory_likes_user_id_idx').on(table.userId)
  })
);

/**
 * 收藏表
 */
export const memoryFavorites = pgTable(
  'memory_favorites',
  {
    id: serial('id').primaryKey(),
    memoryId: integer('memory_id')
      .notNull()
      .references(() => memories.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    memoryIdIdx: index('memory_favorites_memory_id_idx').on(table.memoryId),
    userIdIdx: index('memory_favorites_user_id_idx').on(table.userId)
  })
);

// ========================================
// 提醒相关表
// ========================================

/**
 * 提醒表
 */
export const memoryReminders = pgTable(
  'memory_reminders',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    memoryId: integer('memory_id').references(() => memories.id, {
      onDelete: 'cascade'
    }),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content'),
    reminderTime: timestamp('reminder_time').notNull(),
    repeatType: varchar('repeat_type', { length: 20 }).default('none'), // none, daily, weekly, monthly, yearly
    isCompleted: boolean('is_completed').default(false),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('memory_reminders_user_id_idx').on(table.userId),
    reminderTimeIdx: index('memory_reminders_reminder_time_idx').on(
      table.reminderTime
    )
  })
);

// ========================================
// 关系定义
// ========================================

export const memoriesRelations = relations(memories, ({ one, many }) => ({
  user: one(users, {
    fields: [memories.userId],
    references: [users.id]
  }),
  media: many(memoryMedia),
  tags: many(memoryTags),
  comments: many(memoryComments),
  likes: many(memoryLikes),
  favorites: many(memoryFavorites),
  albumMemories: many(albumMemories)
}));

export const memoryMediaRelations = relations(memoryMedia, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryMedia.memoryId],
    references: [memories.id]
  })
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  memoryTags: many(memoryTags)
}));

export const memoryTagsRelations = relations(memoryTags, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryTags.memoryId],
    references: [memories.id]
  }),
  tag: one(tags, {
    fields: [memoryTags.tagId],
    references: [tags.id]
  })
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  user: one(users, {
    fields: [albums.userId],
    references: [users.id]
  }),
  albumMemories: many(albumMemories)
}));

export const albumMemoriesRelations = relations(albumMemories, ({ one }) => ({
  album: one(albums, {
    fields: [albumMemories.albumId],
    references: [albums.id]
  }),
  memory: one(memories, {
    fields: [albumMemories.memoryId],
    references: [memories.id]
  })
}));

export const familyCirclesRelations = relations(
  familyCircles,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [familyCircles.creatorId],
      references: [users.id]
    }),
    members: many(familyMembers),
    patients: many(patients)
  })
);

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  circle: one(familyCircles, {
    fields: [familyMembers.circleId],
    references: [familyCircles.id]
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id]
  })
}));

export const patientsRelations = relations(patients, ({ one }) => ({
  circle: one(familyCircles, {
    fields: [patients.circleId],
    references: [familyCircles.id]
  })
}));

export const memoryCommentsRelations = relations(memoryComments, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryComments.memoryId],
    references: [memories.id]
  }),
  user: one(users, {
    fields: [memoryComments.userId],
    references: [users.id]
  })
}));

export const memoryLikesRelations = relations(memoryLikes, ({ one }) => ({
  memory: one(memories, {
    fields: [memoryLikes.memoryId],
    references: [memories.id]
  }),
  user: one(users, {
    fields: [memoryLikes.userId],
    references: [users.id]
  })
}));

export const memoryFavoritesRelations = relations(
  memoryFavorites,
  ({ one }) => ({
    memory: one(memories, {
      fields: [memoryFavorites.memoryId],
      references: [memories.id]
    }),
    user: one(users, {
      fields: [memoryFavorites.userId],
      references: [users.id]
    })
  })
);

export const memoryRemindersRelations = relations(
  memoryReminders,
  ({ one }) => ({
    user: one(users, {
      fields: [memoryReminders.userId],
      references: [users.id]
    }),
    memory: one(memories, {
      fields: [memoryReminders.memoryId],
      references: [memories.id]
    })
  })
);

// ========================================
// 健康相关表
// ========================================

/**
 * 健康数据记录表
 */
export const healthRecords = pgTable(
  'health_records',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id').references(() => patients.id, {
      onDelete: 'cascade'
    }),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 50 }).notNull(), // blood_pressure, heart_rate, weight, glucose, sleep, etc.
    value: varchar('value', { length: 50 }), // 主值，如 "120/80", "75", "6.5"
    unit: varchar('unit', { length: 20 }), // 单位
    data: jsonb('data'), // 额外数据，如 {systolic: 120, diastolic: 80}
    notes: text('notes'),
    recordedAt: timestamp('recorded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('health_records_patient_id_idx').on(table.patientId),
    creatorIdIdx: index('health_records_creator_id_idx').on(table.creatorId),
    typeIdx: index('health_records_type_idx').on(table.type),
    recordedAtIdx: index('health_records_recorded_at_idx').on(table.recordedAt)
  })
);

/**
 * 健康指南/文章表
 */
export const healthGuides = pgTable(
  'health_guides',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    subtitle: varchar('subtitle', { length: 500 }),
    category: varchar('category', { length: 50 }).notNull(), // brain, diet, care, emotion
    content: text('content'), // Markdown content
    coverUrl: varchar('cover_url', { length: 500 }),
    icon: varchar('icon', { length: 50 }), // Material icon name
    color: varchar('color', { length: 20 }), // Hex color
    sortOrder: integer('sort_order').default(0),
    isPublished: boolean('is_published').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    categoryIdx: index('health_guides_category_idx').on(table.category)
  })
);

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [healthRecords.patientId],
    references: [patients.id]
  }),
  creator: one(users, {
    fields: [healthRecords.creatorId],
    references: [users.id]
  })
}));
