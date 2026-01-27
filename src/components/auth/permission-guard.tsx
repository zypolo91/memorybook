'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/hooks/use-auth';
import { PermissionSkeleton } from '@/components/ui/permission-skeleton';
import { NoPermission } from '@/components/ui/no-permission';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: string | string[];
  requireAll?: boolean; // true: 需要所有权限, false: 需要任意一个权限
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback
}: PermissionGuardProps) {
  const { session, hasHydrated } = useAuth();
  const { loading, hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissions();
  const router = useRouter();

  // 检查权限
  const checkPermission = (): boolean => {
    if (!session?.user) return false;

    const requiredPermissions = Array.isArray(permissions)
      ? permissions
      : [permissions];

    if (requireAll) {
      // 需要所有权限
      return hasAllPermissions(requiredPermissions);
    } else {
      // 需要任意一个权限
      return hasAnyPermission(requiredPermissions);
    }
  };

  // 加载中状态（包括水合）
  if (loading || !hasHydrated) {
    return <PermissionSkeleton />;
  }

  // 未登录
  if (!session?.user) {
    router.push('/login');
    return null;
  }

  // 没有权限
  if (!checkPermission()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return <NoPermission />;
  }

  return <>{children}</>;
}

/**
 * 权限保护的高阶组件
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissions: string | string[],
  options?: {
    requireAll?: boolean;
    fallback?: React.ReactNode;
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <PermissionGuard
        permissions={permissions}
        requireAll={options?.requireAll}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };

  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
