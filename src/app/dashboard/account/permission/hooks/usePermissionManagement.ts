'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { PermissionAPI } from '@/service/request';
import {
  Permission,
  PermissionFilters,
  PermissionFormData,
  PaginationInfo,
  PermissionDialogState
} from '../types';
import { DEFAULT_PAGINATION, MESSAGES } from '../constants';

export function usePermissionManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] =
    useState<PaginationInfo>(DEFAULT_PAGINATION);
  const [dialogState, setDialogState] = useState<PermissionDialogState>({
    type: null,
    permission: null,
    open: false
  });

  // 获取权限列表
  const fetchPermissions = useCallback(async (filters: PermissionFilters) => {
    try {
      setLoading(true);

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

      const res = await PermissionAPI.getPermissions(params);
      if (res.code === 0) {
        setPermissions(res.data || []);

        // 处理分页信息
        if (res.pager) {
          setPagination({
            page: res.pager.page || 1,
            limit: res.pager.limit || 10,
            total: res.pager.total || 0,
            totalPages: res.pager.totalPages || 0
          });
        } else {
          // 如果API没有返回分页信息，手动计算
          const total = Array.isArray(res.data) ? res.data.length : 0;
          setPagination({
            page: 1,
            limit: total,
            total,
            totalPages: 1
          });
        }
      } else {
        toast.error(res.message || MESSAGES.ERROR.FETCH_PERMISSIONS);
        setPermissions([]);
      }
    } catch (error) {
      toast.error(MESSAGES.ERROR.FETCH_PERMISSIONS);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建权限
  const createPermission = useCallback(
    async (data: PermissionFormData): Promise<boolean> => {
      try {
        const res = await PermissionAPI.createPermission(data);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.CREATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.CREATE);
          return false;
        }
      } catch (error) {
        toast.error(MESSAGES.ERROR.CREATE);
        return false;
      }
    },
    []
  );

  // 更新权限
  const updatePermission = useCallback(
    async (id: number, data: PermissionFormData): Promise<boolean> => {
      try {
        const res = await PermissionAPI.updatePermission(id, data);
        if (res.code === 0) {
          toast.success(MESSAGES.SUCCESS.UPDATE);
          return true;
        } else {
          toast.error(res.message || MESSAGES.ERROR.UPDATE);
          return false;
        }
      } catch (error) {
        toast.error(MESSAGES.ERROR.UPDATE);
        return false;
      }
    },
    []
  );

  // 删除权限
  const deletePermission = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await PermissionAPI.deletePermission(id);
      if (res.code === 0) {
        toast.success(MESSAGES.SUCCESS.DELETE);
        return true;
      } else {
        toast.error(res.message || MESSAGES.ERROR.DELETE);
        return false;
      }
    } catch (error) {
      toast.error(MESSAGES.ERROR.DELETE);
      return false;
    }
  }, []);

  // 打开创建对话框
  const openCreateDialog = useCallback(() => {
    setDialogState({
      type: 'create',
      permission: null,
      open: true
    });
  }, []);

  // 打开编辑对话框
  const openEditDialog = useCallback((permission: Permission) => {
    setDialogState({
      type: 'edit',
      permission,
      open: true
    });
  }, []);

  // 关闭对话框
  const closeDialog = useCallback(() => {
    setDialogState({
      type: null,
      permission: null,
      open: false
    });
  }, []);

  return {
    // 状态
    permissions,
    loading,
    pagination,
    dialogState,

    // 操作
    fetchPermissions,
    createPermission,
    updatePermission,
    deletePermission,
    openCreateDialog,
    openEditDialog,
    closeDialog
  };
}
