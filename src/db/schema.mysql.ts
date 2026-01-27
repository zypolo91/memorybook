import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  boolean,
  text,
  json,
  unique,
  decimal,
  date
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 255 }).default('/avatars/default.jpg'),
  roleId: int('role_id').notNull(),
  isSuperAdmin: boolean('is_super_admin').default(false),
  status: varchar('status', { length: 20 }).default('active'), // active, disabled
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  isSuper: boolean('is_super').default(false),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 权限表
export const permissions = mysqlTable('permissions', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 100 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  parentId: int('parent_id'), // 父权限ID，null表示顶级权限
  sortOrder: int('sort_order').default(0), // 排序字段
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 角色-权限关联表
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    id: int('id').primaryKey().autoincrement(),
    roleId: int('role_id').notNull(),
    permissionId: int('permission_id').notNull(),
    createdAt: timestamp('created_at').defaultNow()
  },
  (t) => ({
    unq: unique('role_permission_unique').on(t.roleId, t.permissionId)
  })
);

// 系统日志表
export const systemLogs = mysqlTable('system_logs', {
  id: int('id').primaryKey().autoincrement(),
  level: varchar('level', { length: 20 }).notNull(), // info, warn, error, debug
  action: varchar('action', { length: 100 }).notNull(), // 操作类型
  module: varchar('module', { length: 50 }).notNull(), // 模块名称
  message: text('message').notNull(), // 日志消息
  details: json('details'), // 详细信息 JSON
  userId: int('user_id'), // 操作用戶ID
  userAgent: varchar('user_agent', { length: 500 }), // 用户代理
  ip: varchar('ip', { length: 45 }), // IP地址
  requestId: varchar('request_id', { length: 100 }), // 请求ID
  duration: int('duration'), // 执行时间(毫秒)
  createdAt: timestamp('created_at').defaultNow()
});

// 系统日志关系
export const systemLogsRelations = relations(systemLogs, ({ one }) => ({
  user: one(users, {
    fields: [systemLogs.userId],
    references: [users.id]
  })
}));

// 定义表关系
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

export const jewelryCategories = mysqlTable('jewelry_categories', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  sortOrder: int('sort_order').default(0),
  isSystem: boolean('is_system').default(false),
  userId: int('user_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const purchaseChannels = mysqlTable('purchase_channels', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  sortOrder: int('sort_order').default(0),
  isSystem: boolean('is_system').default(false),
  userId: int('user_id'),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jewelries = mysqlTable('jewelries', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  categoryId: int('category_id').notNull(),
  images: json('images').$type<string[]>(),
  coverImage: varchar('cover_image', { length: 500 }),
  purchasePrice: decimal('purchase_price', {
    precision: 12,
    scale: 2
  }).notNull(),
  purchaseDate: date('purchase_date').notNull(),
  channelId: int('channel_id').notNull(),
  sellerName: varchar('seller_name', { length: 100 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  valueUpdatedAt: timestamp('value_updated_at'),
  specifications: json('specifications').$type<Record<string, string>>(),
  qualityGrade: varchar('quality_grade', { length: 20 }),
  certificateNo: varchar('certificate_no', { length: 100 }),
  certificateImages: json('certificate_images').$type<string[]>(),
  status: varchar('status', { length: 20 }).default('collected'),
  remark: text('remark'),
  extraData: json('extra_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const jewelryValueHistory = mysqlTable('jewelry_value_history', {
  id: int('id').primaryKey().autoincrement(),
  jewelryId: int('jewelry_id').notNull(),
  value: decimal('value', { precision: 12, scale: 2 }).notNull(),
  source: varchar('source', { length: 50 }),
  remark: text('remark'),
  createdAt: timestamp('created_at').defaultNow()
});

export const jewelryCategoriesRelations = relations(
  jewelryCategories,
  ({ many }) => ({
    jewelries: many(jewelries)
  })
);

export const purchaseChannelsRelations = relations(
  purchaseChannels,
  ({ many }) => ({
    jewelries: many(jewelries)
  })
);

export const jewelriesRelations = relations(jewelries, ({ one, many }) => ({
  category: one(jewelryCategories, {
    fields: [jewelries.categoryId],
    references: [jewelryCategories.id]
  }),
  channel: one(purchaseChannels, {
    fields: [jewelries.channelId],
    references: [purchaseChannels.id]
  }),
  valueHistory: many(jewelryValueHistory)
}));

export const jewelryValueHistoryRelations = relations(
  jewelryValueHistory,
  ({ one }) => ({
    jewelry: one(jewelries, {
      fields: [jewelryValueHistory.jewelryId],
      references: [jewelries.id]
    })
  })
);

// 藏品图片标签表
export const jewelryImageTags = mysqlTable('jewelry_image_tags', {
  id: int('id').primaryKey().autoincrement(),
  jewelryId: int('jewelry_id').notNull(),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  tagIds: json('tag_ids').$type<string[]>().notNull(),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

export const jewelryImageTagsRelations = relations(
  jewelryImageTags,
  ({ one }) => ({
    jewelry: one(jewelries, {
      fields: [jewelryImageTags.jewelryId],
      references: [jewelries.id]
    })
  })
);

// VIP等级表
export const vipLevels = mysqlTable('vip_levels', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  level: int('level').notNull().default(0),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  duration: int('duration').default(30),
  maxJewelries: int('max_jewelries').default(50),
  maxCategories: int('max_categories').default(10),
  maxChannels: int('max_channels').default(10),
  features: json('features').$type<string[]>(),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 用户VIP记录表
export const userVip = mysqlTable('user_vip', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  vipLevelId: int('vip_level_id').notNull(),
  startAt: timestamp('start_at').notNull(),
  expireAt: timestamp('expire_at').notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  orderNo: varchar('order_no', { length: 100 }),
  payAmount: decimal('pay_amount', { precision: 10, scale: 2 }),
  payMethod: varchar('pay_method', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// VIP等级关系
export const vipLevelsRelations = relations(vipLevels, ({ many }) => ({
  userVips: many(userVip)
}));

// 用户VIP关系
export const userVipRelations = relations(userVip, ({ one }) => ({
  vipLevel: one(vipLevels, {
    fields: [userVip.vipLevelId],
    references: [vipLevels.id]
  })
}));

// ==================== V2.0 新增表 ====================

// 成就定义表
export const achievements = mysqlTable('achievements', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  category: varchar('category', { length: 50 }).notNull(),
  conditionType: varchar('condition_type', { length: 50 }).notNull(),
  conditionValue: int('condition_value').notNull(),
  conditionExtra: json('condition_extra'),
  points: int('points').default(10),
  rarity: varchar('rarity', { length: 20 }).default('common'),
  isHidden: boolean('is_hidden').default(false),
  sortOrder: int('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户成就记录表
export const userAchievements = mysqlTable('user_achievements', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  achievementId: int('achievement_id').notNull(),
  progress: int('progress').default(0),
  unlockedAt: timestamp('unlocked_at'),
  isClaimed: boolean('is_claimed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 用户等级表
export const userLevels = mysqlTable('user_levels', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().unique(),
  level: int('level').default(1),
  exp: int('exp').default(0),
  totalPoints: int('total_points').default(0),
  title: varchar('title', { length: 50 }).default('收藏新手'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 等级配置表
export const levelConfig = mysqlTable('level_config', {
  level: int('level').primaryKey(),
  title: varchar('title', { length: 50 }).notNull(),
  expRequired: int('exp_required').notNull(),
  privileges: json('privileges')
});

// AI估价记录表
export const aiValuations = mysqlTable('ai_valuations', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  jewelryId: int('jewelry_id'),
  imageUrl: varchar('image_url', { length: 500 }).notNull(),
  category: varchar('category', { length: 50 }),
  material: varchar('material', { length: 100 }),
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
  estimatedMin: decimal('estimated_min', { precision: 12, scale: 2 }),
  estimatedMax: decimal('estimated_max', { precision: 12, scale: 2 }),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  analysis: json('analysis'),
  modelVersion: varchar('model_version', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
});

// AI鉴定记录表
export const aiAuthentications = mysqlTable('ai_authentications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  jewelryId: int('jewelry_id'),
  imageUrls: json('image_urls').$type<string[]>().notNull(),
  result: varchar('result', { length: 20 }).notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  issues: json('issues'),
  suggestions: text('suggestions'),
  modelVersion: varchar('model_version', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
});

// AI对话记录表
export const aiChats = mysqlTable('ai_chats', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// AI配额表
export const aiQuotas = mysqlTable('ai_quotas', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  quotaType: varchar('quota_type', { length: 50 }).notNull(),
  totalQuota: int('total_quota').notNull(),
  usedQuota: int('used_quota').default(0),
  resetDate: date('reset_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 话题表
export const topics = mysqlTable('topics', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 20 }),
  postCount: int('post_count').default(0),
  isHot: boolean('is_hot').default(false),
  sortOrder: int('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// 社区动态表
export const posts = mysqlTable('posts', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  content: text('content').notNull(),
  images: json('images').$type<string[]>(),
  jewelryIds: json('jewelry_ids').$type<number[]>(),
  topicId: int('topic_id'),
  type: varchar('type', { length: 20 }).default('normal'),
  visibility: varchar('visibility', { length: 20 }).default('public'),
  likeCount: int('like_count').default(0),
  commentCount: int('comment_count').default(0),
  shareCount: int('share_count').default(0),
  favoriteCount: int('favorite_count').default(0),
  isPinned: boolean('is_pinned').default(false),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 评论表
export const comments = mysqlTable('comments', {
  id: int('id').primaryKey().autoincrement(),
  postId: int('post_id').notNull(),
  userId: int('user_id').notNull(),
  parentId: int('parent_id'),
  content: text('content').notNull(),
  likeCount: int('like_count').default(0),
  status: varchar('status', { length: 20 }).default('active'),
  createdAt: timestamp('created_at').defaultNow()
});

// 点赞表
export const likes = mysqlTable('likes', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  targetType: varchar('target_type', { length: 20 }).notNull(),
  targetId: int('target_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 关注关系表
export const follows = mysqlTable('follows', {
  id: int('id').primaryKey().autoincrement(),
  followerId: int('follower_id').notNull(),
  followingId: int('following_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 收藏表
export const favorites = mysqlTable('favorites', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  postId: int('post_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 私信表
export const messages = mysqlTable('messages', {
  id: int('id').primaryKey().autoincrement(),
  senderId: int('sender_id').notNull(),
  receiverId: int('receiver_id').notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).default('text'), // text, image, emoji, file, collection, poke, quote
  isRead: boolean('is_read').default(false),
  replyToId: int('reply_to_id'), // 引用消息ID
  fileUrl: varchar('file_url', { length: 500 }), // 文件/图片URL
  fileName: varchar('file_name', { length: 255 }), // 文件名
  fileSize: int('file_size'), // 文件大小(bytes)
  collectionId: int('collection_id'), // 藏品ID
  isDeleted: boolean('is_deleted').default(false), // 软删除
  isRecalled: boolean('is_recalled').default(false), // 是否撤回
  recalledAt: timestamp('recalled_at'), // 撤回时间
  createdAt: timestamp('created_at').defaultNow()
});

// 提醒配置表
export const reminders = mysqlTable('reminders', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  jewelryId: int('jewelry_id'),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message'),
  triggerDate: date('trigger_date'),
  repeatType: varchar('repeat_type', { length: 20 }),
  isEnabled: boolean('is_enabled').default(true),
  lastTriggered: timestamp('last_triggered'),
  createdAt: timestamp('created_at').defaultNow()
});

// 通知表
export const notifications = mysqlTable('notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  data: json('data'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

// 主题皮肤表
export const themes = mysqlTable('themes', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  preview: varchar('preview', { length: 255 }),
  colors: json('colors'),
  isVip: boolean('is_vip').default(false),
  isPremium: boolean('is_premium').default(false),
  price: decimal('price', { precision: 10, scale: 2 }).default('0'),
  sortOrder: int('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户主题表
export const userThemes = mysqlTable('user_themes', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  themeId: int('theme_id').notNull(),
  isActive: boolean('is_active').default(false),
  purchasedAt: timestamp('purchased_at').defaultNow()
});

// 用户设置表
export const userSettings = mysqlTable('user_settings', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().unique(),
  appLockEnabled: boolean('app_lock_enabled').default(false),
  appLockType: varchar('app_lock_type', { length: 20 }),
  appLockPin: varchar('app_lock_pin', { length: 255 }),
  privacyMode: boolean('privacy_mode').default(false),
  watermarkEnabled: boolean('watermark_enabled').default(false),
  notificationEnabled: boolean('notification_enabled').default(true),
  dailyReminderTime: varchar('daily_reminder_time', { length: 10 }),
  language: varchar('language', { length: 10 }).default('zh'),
  currency: varchar('currency', { length: 10 }).default('CNY'),
  extraSettings: json('extra_settings'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 每日签到表
export const dailyCheckins = mysqlTable('daily_checkins', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  checkinDate: date('checkin_date').notNull(),
  streak: int('streak').default(1),
  points: int('points').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户拉黑表
export const blocks = mysqlTable('blocks', {
  id: int('id').primaryKey().autoincrement(),
  blockerId: int('blocker_id').notNull(),
  blockedId: int('blocked_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// 搜索关键词统计表
export const searchKeywords = mysqlTable('search_keywords', {
  id: int('id').primaryKey().autoincrement(),
  keyword: varchar('keyword', { length: 100 }).notNull().unique(),
  searchCount: int('search_count').default(1),
  lastSearchedAt: timestamp('last_searched_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

// 用户偏好表（用于推荐算法和减少推送）
export const userPreferences = mysqlTable('user_preferences', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().unique(),
  reducedCategories: json('reduced_categories').default([]),
  reducedTopics: json('reduced_topics').default([]),
  blockedUsers: json('blocked_users').default([]),
  notInterestedPosts: json('not_interested_posts').default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// 用户浏览历史表（用于推荐算法）
export const userViewHistory = mysqlTable('user_view_history', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  postId: int('post_id').notNull(),
  viewDuration: int('view_duration').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

// ==================== V2.0 表关系 ====================

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id]
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id]
    })
  })
);

export const userLevelsRelations = relations(userLevels, ({ one }) => ({
  user: one(users, { fields: [userLevels.userId], references: [users.id] })
}));

export const aiValuationsRelations = relations(aiValuations, ({ one }) => ({
  user: one(users, { fields: [aiValuations.userId], references: [users.id] }),
  jewelry: one(jewelries, {
    fields: [aiValuations.jewelryId],
    references: [jewelries.id]
  })
}));

export const aiAuthenticationsRelations = relations(
  aiAuthentications,
  ({ one }) => ({
    user: one(users, {
      fields: [aiAuthentications.userId],
      references: [users.id]
    }),
    jewelry: one(jewelries, {
      fields: [aiAuthentications.jewelryId],
      references: [jewelries.id]
    })
  })
);

export const topicsRelations = relations(topics, ({ many }) => ({
  posts: many(posts)
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  topic: one(topics, { fields: [posts.topicId], references: [topics.id] }),
  comments: many(comments),
  favorites: many(favorites)
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  post: one(posts, { fields: [favorites.postId], references: [posts.id] })
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id]
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id]
  })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id]
  })
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id]
  })
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
  jewelry: one(jewelries, {
    fields: [reminders.jewelryId],
    references: [jewelries.id]
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] })
}));

export const themesRelations = relations(themes, ({ many }) => ({
  userThemes: many(userThemes)
}));

export const userThemesRelations = relations(userThemes, ({ one }) => ({
  user: one(users, { fields: [userThemes.userId], references: [users.id] }),
  theme: one(themes, { fields: [userThemes.themeId], references: [themes.id] })
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] })
}));

export const blocksRelations = relations(blocks, ({ one }) => ({
  blocker: one(users, { fields: [blocks.blockerId], references: [users.id] }),
  blocked: one(users, { fields: [blocks.blockedId], references: [users.id] })
}));

// ==================== 证书机构相关表 ====================

// 证书鉴定机构表
export const certInstitutions = mysqlTable('cert_institutions', {
  id: int('id').primaryKey().autoincrement(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  country: varchar('country', { length: 50 }),
  region: varchar('region', { length: 50 }),
  logo: varchar('logo', { length: 500 }),
  website: varchar('website', { length: 255 }),
  verifyUrl: varchar('verify_url', { length: 500 }),
  description: text('description'),
  features: json('features'),
  certTypes: json('cert_types'), // 证书类型 [{code, name, description}]
  pricing: json('pricing'), // 价格信息 [{type, price, currency, description}]
  certifications: json('certifications'), // 机构认证 [CMA, CNAS, CAL]
  branches: json('branches'), // 分支机构 [{city, address, phone}]
  sampleImages: json('sample_images'), // 证书样本图片 [url1, url2]
  recognitionFeatures: json('recognition_features'), // 识别特征 {watermark, qrCode, hologram, ...}
  avgProcessingDays: int('avg_processing_days'), // 平均出证天数
  authority: int('authority').default(5), // 权威度评分 1-10
  isActive: boolean('is_active').default(true),
  sortOrder: int('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 证书知识库表
export const certKnowledge = mysqlTable('cert_knowledge', {
  id: int('id').primaryKey().autoincrement(),
  category: varchar('category', { length: 50 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  summary: text('summary'),
  content: text('content').notNull(),
  tags: json('tags'),
  images: json('images'),
  relatedInstitutions: json('related_institutions'),
  viewCount: int('view_count').default(0),
  isPublished: boolean('is_published').default(true),
  sortOrder: int('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 证书验证记录表
export const certVerifications = mysqlTable('cert_verifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id'),
  institutionId: int('institution_id'),
  certNumber: varchar('cert_number', { length: 100 }).notNull(),
  verifyResult: varchar('verify_result', { length: 20 }),
  resultData: json('result_data'),
  imageUrl: varchar('image_url', { length: 500 }),
  aiAnalysis: text('ai_analysis'),
  createdAt: timestamp('created_at').defaultNow()
});

// 证书图像特征表
export const certImageFeatures = mysqlTable('cert_image_features', {
  id: int('id').primaryKey().autoincrement(),
  institutionId: int('institution_id').notNull(),
  featureType: varchar('feature_type', { length: 50 }).notNull(),
  featureName: varchar('feature_name', { length: 100 }).notNull(),
  description: text('description'),
  sampleImage: varchar('sample_image', { length: 500 }),
  position: json('position'),
  colorPattern: json('color_pattern'),
  isRequired: boolean('is_required').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// ==================== 直播间相关表 ====================

// 直播间表
export const liveRooms = mysqlTable('live_rooms', {
  id: int('id').primaryKey().autoincrement(),
  uniqueId: varchar('unique_id', { length: 100 }).notNull(),
  userId: int('user_id').notNull(),
  platform: varchar('platform', { length: 20 }).notNull(),
  roomId: varchar('room_id', { length: 100 }).notNull(),
  anchorName: varchar('anchor_name', { length: 100 }).notNull(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  originalUrl: text('original_url'),
  category: varchar('category', { length: 50 }),
  note: text('note'),
  notificationEnabled: boolean('notification_enabled').default(true),
  sortOrder: int('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 直播状态缓存表
export const liveStatusCache = mysqlTable('live_status_cache', {
  id: int('id').primaryKey().autoincrement(),
  liveRoomId: int('live_room_id').notNull(),
  isLive: boolean('is_live').default(false),
  startTime: timestamp('start_time'),
  viewerCount: int('viewer_count'),
  title: varchar('title', { length: 255 }),
  coverUrl: varchar('cover_url', { length: 500 }),
  lastCheckedAt: timestamp('last_checked_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow()
});

// 直播历史记录表
export const liveHistory = mysqlTable('live_history', {
  id: int('id').primaryKey().autoincrement(),
  liveRoomId: int('live_room_id').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: int('duration'),
  peakViewers: int('peak_viewers'),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow()
});

// 直播间关系
export const liveRoomsRelations = relations(liveRooms, ({ one, many }) => ({
  user: one(users, {
    fields: [liveRooms.userId],
    references: [users.id]
  }),
  statusCache: one(liveStatusCache, {
    fields: [liveRooms.id],
    references: [liveStatusCache.liveRoomId]
  }),
  history: many(liveHistory)
}));

export const liveStatusCacheRelations = relations(
  liveStatusCache,
  ({ one }) => ({
    liveRoom: one(liveRooms, {
      fields: [liveStatusCache.liveRoomId],
      references: [liveRooms.id]
    })
  })
);

export const liveHistoryRelations = relations(liveHistory, ({ one }) => ({
  liveRoom: one(liveRooms, {
    fields: [liveHistory.liveRoomId],
    references: [liveRooms.id]
  })
}));
