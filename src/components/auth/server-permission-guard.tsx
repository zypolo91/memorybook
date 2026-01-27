import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasAnyPermission, hasAllPermissions } from '@/lib/server-permissions';
import { ServerNoPermission } from '@/components/ui/server-no-permission';

interface ServerPermissionGuardProps {
  children: React.ReactNode;
  permissions: string | string[];
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export async function ServerPermissionGuard({
  children,
  permissions,
  requireAll = false,
  redirectTo,
  fallback
}: ServerPermissionGuardProps) {
  // 检查登录状态
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // 检查权限
  const permissionCodes = Array.isArray(permissions)
    ? permissions
    : [permissions];
  let hasRequiredPermission = false;

  if (requireAll) {
    hasRequiredPermission = await hasAllPermissions(
      permissionCodes,
      session.user.id
    );
  } else {
    hasRequiredPermission = await hasAnyPermission(
      permissionCodes,
      session.user.id
    );
  }

  // 如果没有权限
  if (!hasRequiredPermission) {
    // 如果指定了重定向路径
    if (redirectTo) {
      redirect(redirectTo);
    }

    // 如果有自定义fallback
    if (fallback) {
      return <>{fallback}</>;
    }

    // 默认的无权限页面
    return <ServerNoPermission />;
  }

  return <>{children}</>;
}

/**
 * 服务端权限检查的工具函数
 */
export async function checkPagePermission(
  permissions: string | string[],
  requireAll = false
): Promise<boolean> {
  const session = await auth();

  if (!session?.user) {
    return false;
  }

  const permissionCodes = Array.isArray(permissions)
    ? permissions
    : [permissions];

  if (requireAll) {
    return await hasAllPermissions(permissionCodes, session.user.id);
  } else {
    return await hasAnyPermission(permissionCodes, session.user.id);
  }
}
