import { apiRequest } from './base';

// 认证相关 API
export class AuthAPI {
  // 用户登录
  static async login(credentials: { email: string; password: string }) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // 用户退出
  static async logout() {
    return apiRequest('/auth/logout', {
      method: 'POST'
    });
  }

  // 用户注册
  static async register(payload: {
    email: string;
    password: string;
    username: string;
  }) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // 获取当前用户会话
  static async getSession() {
    return apiRequest('/auth/session');
  }

  // 获取用户权限
  static async getPermissions() {
    return apiRequest('/auth/permissions');
  }
}
