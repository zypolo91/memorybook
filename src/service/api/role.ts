import { apiRequest, buildSearchParams } from './base';

// 角色相关 API
export class RoleAPI {
  // 获取角色列表
  static async getRoles(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) {
    const searchParams = buildSearchParams(params || {});
    return apiRequest(`/roles${searchParams ? `?${searchParams}` : ''}`);
  }

  // 获取角色详情
  static async getRole(id: number) {
    return apiRequest(`/roles/${id}`);
  }

  // 创建角色
  static async createRole(roleData: any) {
    return apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  }

  // 更新角色
  static async updateRole(id: number, roleData: any) {
    return apiRequest(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    });
  }

  // 删除角色
  static async deleteRole(id: number) {
    return apiRequest(`/roles/${id}`, {
      method: 'DELETE'
    });
  }

  // 获取角色权限
  static async getRolePermissions(id: number) {
    return apiRequest(`/roles/${id}/permissions`);
  }

  // 更新角色权限
  static async updateRolePermissions(id: number, permissionIds: number[]) {
    return apiRequest(`/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds })
    });
  }

  // 获取所有角色（用于下拉选择）
  static async getAllRoles() {
    return apiRequest('/roles/label');
  }
}
