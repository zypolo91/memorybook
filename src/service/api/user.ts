import { apiRequest, buildSearchParams } from './base';

// 用户相关 API
export class UserAPI {
  // 获取用户列表
  static async getUsers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const searchParams = buildSearchParams(params || {});
    return apiRequest(`/users${searchParams ? `?${searchParams}` : ''}`);
  }

  // 获取用户详情
  static async getUser(id: number) {
    return apiRequest(`/users/${id}`);
  }

  // 创建用户
  static async createUser(userData: any) {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // 更新用户
  static async updateUser(id: number, userData: any) {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // 删除用户
  static async deleteUser(id: number) {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  }
}
