import type { LogFilters, PaginationInfo } from './types';

/**
 * 默认分页配置
 */
export const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
};

/**
 * 分页大小选项
 */
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS: LogFilters = {
  level: 'all',
  module: '',
  action: '',
  search: '',
  dateRange: undefined,
  page: 1,
  limit: 20
};

/**
 * 日志级别选项
 */
export const LOG_LEVEL_OPTIONS = [
  { label: '全部级别', value: 'all' },
  { label: '信息', value: 'info' },
  { label: '警告', value: 'warn' },
  { label: '错误', value: 'error' },
  { label: '调试', value: 'debug' }
];

/**
 * 日志级别颜色映射
 */
export const LOG_LEVEL_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  debug: 'bg-gray-100 text-gray-800'
};

/**
 * 消息提示
 */
export const MESSAGES = {
  SUCCESS: {
    REFRESH: '数据刷新成功'
  },
  ERROR: {
    FETCH_LOGS: '获取日志列表失败',
    FETCH_STATS: '获取统计信息失败'
  }
};
