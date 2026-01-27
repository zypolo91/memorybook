/**
 * 日志项接口
 */
export interface LogItem {
  id: number;
  level: string;
  action: string;
  module: string;
  message: string;
  details?: any;
  userId?: number;
  username?: string;
  userAgent?: string;
  ip?: string;
  requestId?: string;
  duration?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * 日志筛选条件
 */
export interface LogFilters {
  level?: string;
  module?: string;
  action?: string;
  search?: string;
  dateRange?: { from: Date; to: Date } | undefined;
  page?: number;
  limit?: number;
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 日志统计信息
 */
export interface LogStats {
  overview: {
    total: number;
    today: number;
    week: number;
  };
  levelStats: Array<{
    level: string;
    count: number;
  }>;
  moduleStats: Array<{
    module: string;
    count: number;
  }>;
}

/**
 * 日志对话框状态
 */
export interface LogDialogState {
  type: 'detail' | null;
  log: LogItem | null;
  open: boolean;
}
