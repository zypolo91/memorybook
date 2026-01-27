import { apiRequest, buildSearchParams } from './base';

// 权限相关 API
export class PermissionAPI {
  // 获取权限列表
  static async getPermissions(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parentId?: number;
  }) {
    const searchParams = buildSearchParams(params || {});
    return apiRequest(`/permissions${searchParams ? `?${searchParams}` : ''}`);
  }

  // 获取权限树结构
  static async getPermissionTree() {
    return apiRequest('/permissions/tree');
  }

  // 获取权限详情
  static async getPermission(id: number) {
    return apiRequest(`/permissions/${id}`);
  }

  // 创建权限
  static async createPermission(permissionData: any) {
    return apiRequest('/permissions', {
      method: 'POST',
      body: JSON.stringify(permissionData)
    });
  }

  // 更新权限
  static async updatePermission(id: number, permissionData: any) {
    return apiRequest(`/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(permissionData)
    });
  }

  // 删除权限
  static async deletePermission(id: number) {
    return apiRequest(`/permissions/${id}`, {
      method: 'DELETE'
    });
  }

  // 获取权限子节点
  static async getPermissionChildren(parentId: number) {
    return apiRequest(`/permissions/${parentId}/children`);
  }

  // 获取所有权限（用于下拉选择）
  static async getAllPermissions() {
    return apiRequest('/permissions/all');
  }
}
