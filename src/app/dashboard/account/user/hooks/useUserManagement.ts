import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  User,
  Role,
  UserFilters,
  PaginationInfo,
  UserFormData
} from '../types';
import { DEFAULT_PAGINATION, MESSAGES } from '../constants';
import { RoleAPI, UserAPI } from '@/service/request';

/**
 * 用户管理业务逻辑 Hook
 * 负责用户数据的增删改查和角色数据获取
 */
export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] =
    useState<PaginationInfo>(DEFAULT_PAGINATION);

  /**
   * 获取角色列表
   */
  const fetchRoles = useCallback(async () => {
    try {
      const res = await RoleAPI.getAllRoles();
      if (res.code === 0) {
        setRoles(res.data || []);
      } else {
        toast.error(res.message || MESSAGES.ERROR.FETCH_ROLES);
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      toast.error(MESSAGES.ERROR.FETCH_ROLES);
    }
  }, []);

  /**
   * 获取用户列表
   */
  const fetchUsers = useCallback(async (filters: UserFilters) => {
    try {
      setLoading(true);

      // 构建查询参数
      const params: Record<string, any> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'dateRange' && value) {
          // 处理日期范围
          const dateRange = value as { from: Date; to: Date };
          if (dateRange.from && dateRange.to) {
            const startDateStr = dateRange.from.toISOString().split('T')[0];
            const endDateStr = dateRange.to.toISOString().split('T')[0];
            params.startDate = startDateStr;
            params.endDate = endDateStr;
          }
        } else if (value !== undefined && value !== null && value !== '') {
          params[key] = value;
        }
      });

      const res = await UserAPI.getUsers(params);
      if (res.code === 0) {
        setUsers(res.data || []);
        setPagination({
          page: res.pager?.page || 1,
          limit: res.pager?.limit || 10,
          total: res.pager?.total || 0,
          totalPages: res.pager?.totalPages || 0
        });
      } else {
        toast.error(res.message || MESSAGES.ERROR.FETCH_USERS);
        setUsers([]);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error(MESSAGES.ERROR.FETCH_USERS);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 创建用户
   */
  const createUser = useCallback(
    async (data: UserFormData): Promise<boolean> => {
      try {
        const res = await UserAPI.createUser(data);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.CREATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.CREATE);
          return false;
        }
      } catch (error) {
        console.error('创建用户失败:', error);
        toast.error(MESSAGES.ERROR.CREATE);
        return false;
      }
    },
    []
  );

  /**
   * 更新用户
   */
  const updateUser = useCallback(
    async (id: number, data: Partial<UserFormData>): Promise<boolean> => {
      try {
        const res = await UserAPI.updateUser(id, data);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.UPDATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.UPDATE);
          return false;
        }
      } catch (error) {
        console.error('更新用户失败:', error);
        toast.error(MESSAGES.ERROR.UPDATE);
        return false;
      }
    },
    []
  );

  /**
   * 删除用户
   */
  const deleteUser = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await UserAPI.deleteUser(id);
      if (res.code === 0) {
        toast.success(MESSAGES.SUCCESS.DELETE);
        return true;
      } else {
        toast.error(res.message || MESSAGES.ERROR.DELETE);
        return false;
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error(MESSAGES.ERROR.DELETE);
      return false;
    }
  }, []);

  // 初始化时获取角色列表
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    // 状态
    users,
    roles,
    loading,
    pagination,

    // 方法
    fetchUsers,
    fetchRoles,
    createUser,
    updateUser,
    deleteUser
  };
}
