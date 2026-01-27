'use client';

import { useAuthStore } from '@/stores/auth';

/**
 * 客户端权限检查hook
 */
export function usePermissions() {
  const {
    permissions,
    loading,
    permissionsLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  } = useAuthStore();

  return {
    permissions,
    loading: loading || permissionsLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  };
}
