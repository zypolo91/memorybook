import { apiRequest } from './base';

// 仪表板相关 API
export class DashboardAPI {
  // 获取仪表板统计数据
  static async getStats() {
    return apiRequest('/dashboard/stats');
  }
}
