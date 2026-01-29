import { getDatabaseDialect } from './dialect';
import * as mysqlSchema from './schema.mysql';
import * as pgSchema from './schema.pg';
import * as memorybookSchema from './schema.memorybook';

const dialect = getDatabaseDialect();
const schema = dialect === 'postgres' ? pgSchema : mysqlSchema;

// MemoryBook 核心表 - 用户管理
export const users = schema.users as any;
export const roles = schema.roles as any;
export const permissions = schema.permissions as any;
export const rolePermissions = schema.rolePermissions as any;
export const systemLogs = schema.systemLogs as any;

// 核心关系
export const systemLogsRelations = schema.systemLogsRelations as any;
export const usersRelations = schema.usersRelations as any;
export const rolesRelations = schema.rolesRelations as any;
export const permissionsRelations = schema.permissionsRelations as any;
export const rolePermissionsRelations = schema.rolePermissionsRelations as any;

// ========================================
// MemoryBook 业务表
// ========================================

// 记忆相关
export const memories = memorybookSchema.memories;
export const memoryMedia = memorybookSchema.memoryMedia;
export const tags = memorybookSchema.tags;
export const memoryTags = memorybookSchema.memoryTags;

// 相册相关
export const albums = memorybookSchema.albums;
export const albumMemories = memorybookSchema.albumMemories;

// 家庭圈相关
export const familyCircles = memorybookSchema.familyCircles;
export const familyMembers = memorybookSchema.familyMembers;
export const familyMessages = memorybookSchema.familyMessages;
export const patients = memorybookSchema.patients;

// 互动相关
export const memoryComments = memorybookSchema.memoryComments;
export const memoryLikes = memorybookSchema.memoryLikes;
export const memoryFavorites = memorybookSchema.memoryFavorites;
export const notifications = memorybookSchema.notifications;
export const locationPermissions = memorybookSchema.locationPermissions;

// 提醒相关
export const memoryReminders = memorybookSchema.memoryReminders;
export const healthRecords = memorybookSchema.healthRecords;
export const healthGuides = memorybookSchema.healthGuides;

// MemoryBook 关系
export const memoriesRelations = memorybookSchema.memoriesRelations;
export const memoryMediaRelations = memorybookSchema.memoryMediaRelations;
export const tagsRelations = memorybookSchema.tagsRelations;
export const memoryTagsRelations = memorybookSchema.memoryTagsRelations;
export const albumsRelations = memorybookSchema.albumsRelations;
export const albumMemoriesRelations = memorybookSchema.albumMemoriesRelations;
export const familyCirclesRelations = memorybookSchema.familyCirclesRelations;
export const familyMembersRelations = memorybookSchema.familyMembersRelations;
export const patientsRelations = memorybookSchema.patientsRelations;
export const memoryCommentsRelations = memorybookSchema.memoryCommentsRelations;
export const memoryLikesRelations = memorybookSchema.memoryLikesRelations;
export const memoryFavoritesRelations =
  memorybookSchema.memoryFavoritesRelations;
export const memoryRemindersRelations =
  memorybookSchema.memoryRemindersRelations;
export const healthRecordsRelations = memorybookSchema.healthRecordsRelations;
