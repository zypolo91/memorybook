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
  index,
  doublePrecision
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
    visibility: varchar('visibility', { length: 20 }).default('public'), // public, private, family
    scheduledTime: timestamp('scheduled_time'), // 定时发布时间
    allowComments: boolean('allow_comments').default(true), // 允许评论
    isOriginal: boolean('is_original').default(false), // 原创声明
    coverUrl: text('cover_url'), // 封面图URL
    coverText: varchar('cover_text', { length: 200 }), // 封面文字
    layoutType: varchar('layout_type', { length: 50 }), // 排版类型
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
    editParams: jsonb('edit_params'), // 媒体编辑参数(滤镜/裁剪/速度等)
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
  cognitiveStatus: varchar('cognitive_status', { length: 30 }), // 认知状态: normal, scd, mci, mild_ad, moderate_ad, severe_ad
  lastAssessmentDate: timestamp('last_assessment_date'),
  lastAssessmentScore: integer('last_assessment_score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

/**
 * 家庭圈消息表
 */
export const familyMessages = pgTable(
  'family_messages',
  {
    id: serial('id').primaryKey(),
    circleId: integer('circle_id')
      .notNull()
      .references(() => familyCircles.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 20 }).notNull().default('text'), // text, image, location, shake
    content: text('content').notNull(),
    replyToId: integer('reply_to_id'),
    isDeleted: boolean('is_deleted').default(false),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    circleIdIdx: index('family_messages_circle_id_idx').on(table.circleId),
    userIdIdx: index('family_messages_user_id_idx').on(table.userId),
    createdAtIdx: index('family_messages_created_at_idx').on(table.createdAt)
  })
);

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

// ========================================
// 病例档案相关表
// ========================================

/**
 * 病例档案分类
 */
export const medicalCategories = pgTable('medical_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * 病例档案文件表
 */
export const medicalRecords = pgTable(
  'medical_records',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    patientId: integer('patient_id').references(() => patients.id),
    categoryId: integer('category_id').references(() => medicalCategories.id),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    fileUrl: varchar('file_url', { length: 500 }),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    fileType: varchar('file_type', { length: 50 }), // ct, report, prescription, paper, video, other
    fileName: varchar('file_name', { length: 200 }),
    fileSize: integer('file_size'),
    mimeType: varchar('mime_type', { length: 100 }),
    recordDate: timestamp('record_date'), // 检查/诊断日期
    hospital: varchar('hospital', { length: 200 }), // 医院名称
    doctor: varchar('doctor', { length: 100 }), // 医生姓名
    department: varchar('department', { length: 100 }), // 科室
    diagnosis: text('diagnosis'), // 诊断结果
    notes: text('notes'), // 备注
    aiAnalysis: jsonb('ai_analysis'), // AI分析结果
    isImportant: boolean('is_important').default(false), // 是否重要
    isShared: boolean('is_shared').default(false), // 是否已分享
    sharedAt: timestamp('shared_at'), // 分享时间
    status: varchar('status', { length: 20 }).default('active'), // active, archived
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('medical_records_user_id_idx').on(table.userId),
    patientIdIdx: index('medical_records_patient_id_idx').on(table.patientId),
    categoryIdIdx: index('medical_records_category_id_idx').on(
      table.categoryId
    ),
    recordDateIdx: index('medical_records_record_date_idx').on(table.recordDate)
  })
);

/**
 * 病例档案标签
 */
export const medicalTags = pgTable('medical_tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 20 }),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * 病例档案标签关联
 */
export const medicalRecordTags = pgTable(
  'medical_record_tags',
  {
    id: serial('id').primaryKey(),
    recordId: integer('record_id')
      .notNull()
      .references(() => medicalRecords.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => medicalTags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    recordIdIdx: index('medical_record_tags_record_id_idx').on(table.recordId),
    tagIdIdx: index('medical_record_tags_tag_id_idx').on(table.tagId)
  })
);

// 病例档案关系
export const medicalRecordsRelations = relations(
  medicalRecords,
  ({ one, many }) => ({
    user: one(users, {
      fields: [medicalRecords.userId],
      references: [users.id]
    }),
    patient: one(patients, {
      fields: [medicalRecords.patientId],
      references: [patients.id]
    }),
    category: one(medicalCategories, {
      fields: [medicalRecords.categoryId],
      references: [medicalCategories.id]
    }),
    tags: many(medicalRecordTags)
  })
);

export const medicalRecordTagsRelations = relations(
  medicalRecordTags,
  ({ one }) => ({
    record: one(medicalRecords, {
      fields: [medicalRecordTags.recordId],
      references: [medicalRecords.id]
    }),
    tag: one(medicalTags, {
      fields: [medicalRecordTags.tagId],
      references: [medicalTags.id]
    })
  })
);

// ========================================
// 位置监控相关表
// ========================================

/**
 * 位置记录表 - 存储患者的实时位置
 */
export const locationRecords = pgTable(
  'location_records',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    patientId: integer('patient_id').references(() => patients.id),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    accuracy: doublePrecision('accuracy'), // 精度（米）
    altitude: doublePrecision('altitude'), // 海拔
    speed: doublePrecision('speed'), // 速度（米/秒）
    heading: doublePrecision('heading'), // 方向（度）
    address: varchar('address', { length: 500 }), // 地址
    recordedAt: timestamp('recorded_at').notNull(), // 记录时间
    deviceInfo: jsonb('device_info'), // 设备信息
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('location_records_user_id_idx').on(table.userId),
    patientIdIdx: index('location_records_patient_id_idx').on(table.patientId),
    recordedAtIdx: index('location_records_recorded_at_idx').on(
      table.recordedAt
    )
  })
);

/**
 * 地理围栏表 - 设置安全区域
 */
export const geofences = pgTable(
  'geofences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    patientId: integer('patient_id').references(() => patients.id),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    centerLat: doublePrecision('center_lat').notNull(),
    centerLng: doublePrecision('center_lng').notNull(),
    radius: doublePrecision('radius').notNull(), // 半径（米）
    address: varchar('address', { length: 500 }),
    isActive: boolean('is_active').default(true),
    alertOnExit: boolean('alert_on_exit').default(true), // 离开时报警
    alertOnEnter: boolean('alert_on_enter').default(false), // 进入时报警
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('geofences_user_id_idx').on(table.userId),
    patientIdIdx: index('geofences_patient_id_idx').on(table.patientId)
  })
);

/**
 * 围栏报警记录表
 */
export const geofenceAlerts = pgTable(
  'geofence_alerts',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    geofenceId: integer('geofence_id')
      .notNull()
      .references(() => geofences.id),
    patientId: integer('patient_id').references(() => patients.id),
    alertType: varchar('alert_type', { length: 20 }).notNull(), // exit, enter
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    address: varchar('address', { length: 500 }),
    isRead: boolean('is_read').default(false),
    isHandled: boolean('is_handled').default(false),
    handledAt: timestamp('handled_at'),
    handledBy: integer('handled_by'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('geofence_alerts_user_id_idx').on(table.userId),
    geofenceIdIdx: index('geofence_alerts_geofence_id_idx').on(
      table.geofenceId
    ),
    createdAtIdx: index('geofence_alerts_created_at_idx').on(table.createdAt)
  })
);

/**
 * 位置共享权限表 - 控制谁可以查看位置
 */
export const locationPermissions = pgTable(
  'location_permissions',
  {
    id: serial('id').primaryKey(),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id), // 位置所有者（患者/被追踪者）
    viewerId: integer('viewer_id')
      .notNull()
      .references(() => users.id), // 被授权查看者
    circleId: integer('circle_id').references(() => familyCircles.id), // 所属家庭圈
    canViewRealtime: boolean('can_view_realtime').default(true), // 可查看实时位置
    canViewHistory: boolean('can_view_history').default(true), // 可查看历史轨迹
    canReceiveAlerts: boolean('can_receive_alerts').default(true), // 可接收围栏报警
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    ownerIdIdx: index('location_permissions_owner_id_idx').on(table.ownerId),
    viewerIdIdx: index('location_permissions_viewer_id_idx').on(table.viewerId),
    circleIdIdx: index('location_permissions_circle_id_idx').on(table.circleId)
  })
);

/**
 * 通知表 - 用于@提醒、点赞通知等
 */
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: varchar('type', { length: 50 }).notNull(), // mention, like, comment, follow, system
    title: varchar('title', { length: 200 }),
    content: text('content'),
    relatedId: integer('related_id'), // 关联的记忆ID、评论ID等
    relatedType: varchar('related_type', { length: 50 }), // memory, comment, etc
    fromUserId: integer('from_user_id').references(() => users.id),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt)
  })
);

// 位置监控关系
export const locationRecordsRelations = relations(
  locationRecords,
  ({ one }) => ({
    user: one(users, {
      fields: [locationRecords.userId],
      references: [users.id]
    }),
    patient: one(patients, {
      fields: [locationRecords.patientId],
      references: [patients.id]
    })
  })
);

export const geofencesRelations = relations(geofences, ({ one, many }) => ({
  user: one(users, {
    fields: [geofences.userId],
    references: [users.id]
  }),
  patient: one(patients, {
    fields: [geofences.patientId],
    references: [patients.id]
  }),
  alerts: many(geofenceAlerts)
}));

export const geofenceAlertsRelations = relations(geofenceAlerts, ({ one }) => ({
  user: one(users, {
    fields: [geofenceAlerts.userId],
    references: [users.id]
  }),
  geofence: one(geofences, {
    fields: [geofenceAlerts.geofenceId],
    references: [geofences.id]
  }),
  patient: one(patients, {
    fields: [geofenceAlerts.patientId],
    references: [patients.id]
  })
}));

// ========================================
// 阿尔茨海默病健康监控相关表
// ========================================

/**
 * 认知评估表 - MMSE/MoCA/ACE-R 量表评估结果
 */
export const cognitiveAssessments = pgTable(
  'cognitive_assessments',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    assessorId: integer('assessor_id')
      .notNull()
      .references(() => users.id),
    scaleType: varchar('scale_type', { length: 20 }).notNull(), // mmse, moca, acer
    totalScore: integer('total_score').notNull(),
    maxScore: integer('max_score').notNull(),
    dimensionScores: jsonb('dimension_scores'), // 各维度得分
    severity: varchar('severity', { length: 20 }), // normal, mild, moderate, severe
    assessorNotes: text('assessor_notes'),
    assessedAt: timestamp('assessed_at').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('cognitive_assessments_patient_id_idx').on(
      table.patientId
    ),
    scaleTypeIdx: index('cognitive_assessments_scale_type_idx').on(
      table.scaleType
    ),
    assessedAtIdx: index('cognitive_assessments_assessed_at_idx').on(
      table.assessedAt
    )
  })
);

/**
 * 生物标志物记录表 - CSF/血液/影像学检查
 */
export const biomarkerRecords = pgTable(
  'biomarker_records',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id),
    category: varchar('category', { length: 20 }).notNull(), // csf, blood, imaging
    biomarkerType: varchar('biomarker_type', { length: 50 }).notNull(), // ab42, ttau, ptau181, mta_score
    value: doublePrecision('value').notNull(),
    unit: varchar('unit', { length: 30 }),
    referenceRange: varchar('reference_range', { length: 100 }),
    interpretation: varchar('interpretation', { length: 20 }), // normal, abnormal, borderline
    hospitalName: varchar('hospital_name', { length: 200 }),
    doctorName: varchar('doctor_name', { length: 100 }),
    reportImageUrl: text('report_image_url'),
    testedAt: timestamp('tested_at').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('biomarker_records_patient_id_idx').on(table.patientId),
    categoryIdx: index('biomarker_records_category_idx').on(table.category),
    biomarkerTypeIdx: index('biomarker_records_biomarker_type_idx').on(
      table.biomarkerType
    ),
    testedAtIdx: index('biomarker_records_tested_at_idx').on(table.testedAt)
  })
);

/**
 * 认知训练游戏表 - 系统预置游戏定义
 */
export const cognitiveGames = pgTable(
  'cognitive_games',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    nameEn: varchar('name_en', { length: 100 }),
    category: varchar('category', { length: 30 }).notNull(), // memory, attention, executive, language
    description: text('description'),
    iconUrl: varchar('icon_url', { length: 500 }),
    minLevel: integer('min_level').default(1),
    maxLevel: integer('max_level').default(5),
    estimatedMinutes: integer('estimated_minutes').default(5),
    instructions: text('instructions'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    categoryIdx: index('cognitive_games_category_idx').on(table.category)
  })
);

/**
 * 游戏训练记录表
 */
export const gameSessions = pgTable(
  'game_sessions',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    gameId: integer('game_id')
      .notNull()
      .references(() => cognitiveGames.id),
    level: integer('level').notNull(),
    score: integer('score').notNull(),
    maxScore: integer('max_score'),
    durationSeconds: integer('duration_seconds'),
    accuracy: doublePrecision('accuracy'), // 0-100
    details: jsonb('details'),
    playedAt: timestamp('played_at').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('game_sessions_patient_id_idx').on(table.patientId),
    gameIdIdx: index('game_sessions_game_id_idx').on(table.gameId),
    playedAtIdx: index('game_sessions_played_at_idx').on(table.playedAt)
  })
);

/**
 * 饮食记录表 - MIND饮食
 */
export const dietRecords = pgTable(
  'diet_records',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id),
    recordDate: timestamp('record_date').notNull(),
    mealType: varchar('meal_type', { length: 20 }).notNull(), // breakfast, lunch, dinner, snack
    foods: jsonb('foods').notNull(),
    mindScore: integer('mind_score'),
    calories: integer('calories'),
    notes: text('notes'),
    photoUrl: varchar('photo_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('diet_records_patient_id_idx').on(table.patientId),
    recordDateIdx: index('diet_records_record_date_idx').on(table.recordDate),
    mealTypeIdx: index('diet_records_meal_type_idx').on(table.mealType)
  })
);

/**
 * MIND食物分类表
 */
export const mindFoodCategories = pgTable('mind_food_categories', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 30 }).notNull().unique(),
  name: varchar('name', { length: 50 }).notNull(),
  nameEn: varchar('name_en', { length: 50 }),
  description: text('description'),
  isRecommended: boolean('is_recommended').default(true),
  weeklyTarget: integer('weekly_target'),
  dailyTarget: doublePrecision('daily_target'),
  icon: varchar('icon', { length: 50 }),
  color: varchar('color', { length: 20 }),
  exampleFoods: text('example_foods'),
  sortOrder: integer('sort_order').default(0)
});

/**
 * 运动记录表
 */
export const exerciseRecords = pgTable(
  'exercise_records',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id),
    exerciseType: varchar('exercise_type', { length: 30 }).notNull(), // aerobic, strength, finger, balance
    exerciseName: varchar('exercise_name', { length: 100 }).notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    intensity: varchar('intensity', { length: 20 }), // low, moderate, high
    heartRateAvg: integer('heart_rate_avg'),
    heartRateMax: integer('heart_rate_max'),
    caloriesBurned: integer('calories_burned'),
    steps: integer('steps'),
    distanceMeters: integer('distance_meters'),
    notes: text('notes'),
    exercisedAt: timestamp('exercised_at').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('exercise_records_patient_id_idx').on(table.patientId),
    exerciseTypeIdx: index('exercise_records_exercise_type_idx').on(
      table.exerciseType
    ),
    exercisedAtIdx: index('exercise_records_exercised_at_idx').on(
      table.exercisedAt
    )
  })
);

/**
 * 运动计划表
 */
export const exercisePlans = pgTable(
  'exercise_plans',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    creatorId: integer('creator_id')
      .notNull()
      .references(() => users.id),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    exercises: jsonb('exercises').notNull(),
    weeklyGoalMinutes: integer('weekly_goal_minutes').default(150),
    isActive: boolean('is_active').default(true),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('exercise_plans_patient_id_idx').on(table.patientId)
  })
);

/**
 * 运动视频表 - 系统预置
 */
export const exerciseVideos = pgTable(
  'exercise_videos',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    exerciseType: varchar('exercise_type', { length: 30 }).notNull(),
    videoUrl: varchar('video_url', { length: 500 }).notNull(),
    thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
    durationSeconds: integer('duration_seconds'),
    difficulty: varchar('difficulty', { length: 20 }), // easy, medium, hard
    targetAudience: varchar('target_audience', { length: 50 }),
    viewCount: integer('view_count').default(0),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    exerciseTypeIdx: index('exercise_videos_exercise_type_idx').on(
      table.exerciseType
    )
  })
);

/**
 * 健康评分历史表
 */
export const healthScores = pgTable(
  'health_scores',
  {
    id: serial('id').primaryKey(),
    patientId: integer('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    scoreDate: timestamp('score_date').notNull(),
    cognitiveScore: integer('cognitive_score'),
    trainingScore: integer('training_score'),
    dietScore: integer('diet_score'),
    exerciseScore: integer('exercise_score'),
    overallScore: integer('overall_score'),
    details: jsonb('details'),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    patientIdIdx: index('health_scores_patient_id_idx').on(table.patientId),
    scoreDateIdx: index('health_scores_score_date_idx').on(table.scoreDate)
  })
);

/**
 * 食谱推荐表
 */
export const recipes = pgTable(
  'recipes',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 30 }),
    mindCategories: jsonb('mind_categories'),
    ingredients: jsonb('ingredients'),
    instructions: text('instructions'),
    prepTimeMinutes: integer('prep_time_minutes'),
    cookTimeMinutes: integer('cook_time_minutes'),
    servings: integer('servings'),
    caloriesPerServing: integer('calories_per_serving'),
    imageUrl: varchar('image_url', { length: 500 }),
    videoUrl: varchar('video_url', { length: 500 }),
    difficulty: varchar('difficulty', { length: 20 }),
    isFeatured: boolean('is_featured').default(false),
    viewCount: integer('view_count').default(0),
    likeCount: integer('like_count').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    categoryIdx: index('recipes_category_idx').on(table.category)
  })
);

// 阿尔茨海默健康模块关系定义
export const cognitiveAssessmentsRelations = relations(
  cognitiveAssessments,
  ({ one }) => ({
    patient: one(patients, {
      fields: [cognitiveAssessments.patientId],
      references: [patients.id]
    }),
    assessor: one(users, {
      fields: [cognitiveAssessments.assessorId],
      references: [users.id]
    })
  })
);

export const biomarkerRecordsRelations = relations(
  biomarkerRecords,
  ({ one }) => ({
    patient: one(patients, {
      fields: [biomarkerRecords.patientId],
      references: [patients.id]
    }),
    creator: one(users, {
      fields: [biomarkerRecords.creatorId],
      references: [users.id]
    })
  })
);

export const gameSessionsRelations = relations(gameSessions, ({ one }) => ({
  patient: one(patients, {
    fields: [gameSessions.patientId],
    references: [patients.id]
  }),
  game: one(cognitiveGames, {
    fields: [gameSessions.gameId],
    references: [cognitiveGames.id]
  })
}));

export const dietRecordsRelations = relations(dietRecords, ({ one }) => ({
  patient: one(patients, {
    fields: [dietRecords.patientId],
    references: [patients.id]
  }),
  creator: one(users, {
    fields: [dietRecords.creatorId],
    references: [users.id]
  })
}));

export const exerciseRecordsRelations = relations(
  exerciseRecords,
  ({ one }) => ({
    patient: one(patients, {
      fields: [exerciseRecords.patientId],
      references: [patients.id]
    }),
    creator: one(users, {
      fields: [exerciseRecords.creatorId],
      references: [users.id]
    })
  })
);

export const exercisePlansRelations = relations(exercisePlans, ({ one }) => ({
  patient: one(patients, {
    fields: [exercisePlans.patientId],
    references: [patients.id]
  }),
  creator: one(users, {
    fields: [exercisePlans.creatorId],
    references: [users.id]
  })
}));

export const healthScoresRelations = relations(healthScores, ({ one }) => ({
  patient: one(patients, {
    fields: [healthScores.patientId],
    references: [patients.id]
  })
}));

// ========================================
// 视频上传和分享相关
// ========================================

/**
 * 视频分片上传记录表 - 支持断点续传
 */
export const videoUploadRecords = pgTable(
  'video_upload_records',
  {
    id: serial('id').primaryKey(),
    resumeKey: varchar('resume_key', { length: 255 }).notNull().unique(), // 断点续传标识
    uploadId: varchar('upload_id', { length: 255 }).notNull(), // S3/R2 multipart upload ID
    key: varchar('key', { length: 500 }).notNull(), // R2存储路径
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').notNull(), // 文件总大小(bytes)
    mimeType: varchar('mime_type', { length: 100 }),
    totalParts: integer('total_parts'), // 总分片数
    uploadedParts: jsonb('uploaded_parts').default([]), // 已上传分片信息 [{partNumber, etag, size}]
    status: varchar('status', { length: 20 }).default('uploading'), // uploading, completed, failed, aborted
    expiresAt: timestamp('expires_at'), // 上传过期时间(24h)
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
  },
  (table) => ({
    resumeKeyIdx: index('video_upload_resume_key_idx').on(table.resumeKey),
    userIdIdx: index('video_upload_user_id_idx').on(table.userId),
    statusIdx: index('video_upload_status_idx').on(table.status)
  })
);

/**
 * 分享链接表 - 生成分享链接
 */
export const shareLinks = pgTable(
  'share_links',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    resourceType: varchar('resource_type', { length: 50 }).notNull(), // memory, album, medical_record
    resourceId: integer('resource_id').notNull(), // 目标记录ID
    code: varchar('code', { length: 64 }).notNull().unique(), // 分享码
    password: varchar('password', { length: 20 }), // 访问密码(可选)
    maxViews: integer('max_views'), // 最大查看次数(null=无限)
    viewCount: integer('view_count').default(0),
    expiresAt: timestamp('expires_at'), // 过期时间(null=永不过期)
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow()
  },
  (table) => ({
    codeIdx: index('share_links_code_idx').on(table.code),
    userIdIdx: index('share_links_user_id_idx').on(table.userId)
  })
);
