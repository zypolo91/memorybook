'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Shield,
  Key
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  sortOrder?: number;
  children?: Permission[];
}

interface PermissionTreeProps {
  permissions: Permission[];
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

interface PermissionNodeProps {
  permission: Permission;
  level: number;
  selectedIds: number[];
  onSelectionChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

function PermissionNode({
  permission,
  level,
  selectedIds,
  onSelectionChange,
  disabled = false
}: PermissionNodeProps) {
  const hasChildren = permission.children && permission.children.length > 0;
  const isLeaf = !hasChildren;

  // 检查当前节点或其子节点是否有被选中的权限
  const hasSelectedDescendants = useCallback(
    (perm: Permission): boolean => {
      if (selectedIds.includes(perm.id)) {
        return true;
      }
      if (perm.children) {
        return perm.children.some((child) => hasSelectedDescendants(child));
      }
      return false;
    },
    [selectedIds]
  );

  // 如果当前节点或其子节点有被选中的权限，则默认展开
  const shouldExpand = hasChildren && hasSelectedDescendants(permission);
  const [isExpanded, setIsExpanded] = useState(shouldExpand);

  // 当selectedIds变化时，重新计算是否应该展开
  useEffect(() => {
    if (hasChildren) {
      const shouldExpandNow = hasSelectedDescendants(permission);
      setIsExpanded(shouldExpandNow);
    }
  }, [selectedIds, hasChildren, permission, hasSelectedDescendants]);

  // 获取当前权限的所有后代权限ID（不包含自身）
  const getChildrenIds = useCallback((perm: Permission): number[] => {
    let ids: number[] = [];
    if (perm.children) {
      perm.children.forEach((child) => {
        ids.push(child.id);
        ids = ids.concat(getChildrenIds(child));
      });
    }
    return ids;
  }, []);

  // 计算选中状态
  const checkState = useMemo(() => {
    const isSelected = selectedIds.includes(permission.id);

    if (!hasChildren) {
      // 叶子节点，直接返回是否被选中
      return { checked: isSelected, indeterminate: false };
    }

    // 父节点，检查子权限的选中情况
    const childrenIds = getChildrenIds(permission);
    const selectedChildren = childrenIds.filter((id) =>
      selectedIds.includes(id)
    );

    if (selectedChildren.length === 0) {
      // 没有子权限被选中，检查自身是否被选中
      return { checked: isSelected, indeterminate: false };
    } else if (selectedChildren.length === childrenIds.length) {
      // 所有子权限都被选中，父权限也应该被选中
      return { checked: true, indeterminate: false };
    } else {
      // 部分子权限被选中，显示为半选中状态
      return { checked: false, indeterminate: true };
    }
  }, [permission, selectedIds, hasChildren, getChildrenIds]);

  const handleToggle = useCallback(
    (checked: boolean | 'indeterminate') => {
      const childrenIds = getChildrenIds(permission);
      let newSelectedIds = [...selectedIds];

      if (checked === true || checked === 'indeterminate') {
        // 选中：添加当前权限及所有子权限
        if (!newSelectedIds.includes(permission.id)) {
          newSelectedIds.push(permission.id);
        }
        childrenIds.forEach((id) => {
          if (!newSelectedIds.includes(id)) {
            newSelectedIds.push(id);
          }
        });
      } else {
        // 取消选中：移除当前权限及所有子权限
        newSelectedIds = newSelectedIds.filter(
          (id) => id !== permission.id && !childrenIds.includes(id)
        );
      }

      onSelectionChange(newSelectedIds);
    },
    [permission, selectedIds, onSelectionChange, getChildrenIds]
  );

  const handleExpand = useCallback(() => {
    if (!hasChildren) return;
    setIsExpanded(!isExpanded);
  }, [hasChildren, isExpanded]);

  return (
    <div className='permission-node'>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border px-2 py-1.5 transition-all duration-200',
          'hover:bg-muted/50',
          checkState.checked && 'bg-primary/5 border-primary/20',
          checkState.indeterminate && 'bg-amber/5 border-amber/20',
          !checkState.checked &&
            !checkState.indeterminate &&
            'border-transparent',
          level > 0 && 'ml-4'
        )}
      >
        {/* 展开/折叠按钮 */}
        <button
          onClick={handleExpand}
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded transition-colors',
            'hover:bg-muted',
            !hasChildren && 'invisible'
          )}
          disabled={disabled}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className='text-muted-foreground h-3 w-3' />
            ) : (
              <ChevronRight className='text-muted-foreground h-3 w-3' />
            ))}
        </button>

        {/* 权限图标 */}
        <div className='flex h-4 w-4 items-center justify-center'>
          {isLeaf ? (
            <Key className='text-primary h-3 w-3' />
          ) : isExpanded ? (
            <FolderOpen className='h-3 w-3 text-amber-600' />
          ) : (
            <Folder className='h-3 w-3 text-amber-600' />
          )}
        </div>

        {/* 复选框 */}
        <Checkbox
          id={`permission-${permission.id}`}
          checked={
            checkState.indeterminate ? 'indeterminate' : checkState.checked
          }
          onCheckedChange={handleToggle}
          disabled={disabled}
          className={cn(
            'transition-all duration-200',
            checkState.indeterminate &&
              'data-[state=indeterminate]:border-amber-500 data-[state=indeterminate]:bg-amber-500'
          )}
        />

        {/* 权限信息 */}
        <div className='min-w-0 flex-1'>
          <label
            htmlFor={`permission-${permission.id}`}
            className={cn(
              'block cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className='flex items-center gap-1.5'>
              <span
                className={cn(
                  'truncate text-sm font-medium',
                  checkState.checked && 'text-primary',
                  checkState.indeterminate && 'text-amber-700'
                )}
              >
                {permission.name}
              </span>
              <Badge
                variant='outline'
                className={cn(
                  'h-4 px-1 py-0 font-mono text-xs text-[10px]',
                  checkState.checked &&
                    'border-primary/30 bg-primary/10 text-primary',
                  checkState.indeterminate &&
                    'border-amber/30 bg-amber/10 text-amber-700'
                )}
              >
                {permission.code}
              </Badge>
            </div>
            {permission.description && (
              <div className='text-muted-foreground mt-0.5 line-clamp-1 text-xs'>
                {permission.description}
              </div>
            )}
          </label>
        </div>

        {/* 权限计数 */}
        {hasChildren && (
          <Badge
            variant='secondary'
            className={cn(
              'h-4 px-1.5 text-xs text-[10px]',
              checkState.checked && 'bg-primary/20 text-primary',
              checkState.indeterminate && 'bg-amber/20 text-amber-700'
            )}
          >
            {permission.children!.length}
          </Badge>
        )}
      </div>

      {/* 子权限 */}
      {hasChildren && isExpanded && (
        <div className='permission-children mt-1 space-y-1'>
          {permission.children!.map((child) => (
            <PermissionNode
              key={child.id}
              permission={child}
              level={level + 1}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PermissionTree({
  permissions,
  selectedIds,
  onSelectionChange,
  disabled = false
}: PermissionTreeProps) {
  // 构建树形结构
  const treeData = useMemo(() => {
    const permMap = new Map<number, Permission>();
    const rootPerms: Permission[] = [];

    // 先创建所有权限的映射，并初始化children数组
    permissions.forEach((perm) => {
      permMap.set(perm.id, { ...perm, children: [] });
    });

    // 构建树形结构
    permissions.forEach((perm) => {
      const permNode = permMap.get(perm.id)!;

      if (perm.parentId && permMap.has(perm.parentId)) {
        // 有父权限，添加到父权限的children中
        const parent = permMap.get(perm.parentId)!;
        parent.children!.push(permNode);
      } else {
        // 没有父权限，是根节点
        rootPerms.push(permNode);
      }
    });

    // 对每个级别进行排序
    const sortPerms = (perms: Permission[]) => {
      perms.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      perms.forEach((perm) => {
        if (perm.children && perm.children.length > 0) {
          sortPerms(perm.children);
        }
      });
    };

    sortPerms(rootPerms);
    return rootPerms;
  }, [permissions]);

  // 智能的权限选择逻辑：确保半选状态的父权限也被包含在selectedIds中
  const handleSelectionChange = useCallback(
    (newSelectedIds: number[]) => {
      const permissionMap = new Map<number, Permission>();
      const addToMap = (perms: Permission[]) => {
        perms.forEach((perm) => {
          permissionMap.set(perm.id, perm);
          if (perm.children) {
            addToMap(perm.children);
          }
        });
      };
      addToMap(treeData);

      // 获取权限的所有子权限ID
      const getChildrenIds = (permId: number): number[] => {
        const perm = permissionMap.get(permId);
        if (!perm?.children) return [];

        const childIds: number[] = [];
        const collectIds = (children: Permission[]) => {
          children.forEach((child) => {
            childIds.push(child.id);
            if (child.children) {
              collectIds(child.children);
            }
          });
        };
        collectIds(perm.children);
        return childIds;
      };

      // 智能添加半选状态的父权限
      const finalSelectedIds = new Set(newSelectedIds);

      // 检查每个有子权限的权限，如果有子权限被选中，父权限也应该被加入
      permissionMap.forEach((permission) => {
        if (!permission.children || permission.children.length === 0) return;

        const childrenIds = getChildrenIds(permission.id);
        const selectedChildren = childrenIds.filter((id) =>
          finalSelectedIds.has(id)
        );

        // 如果有任何子权限被选中，父权限也应该被包含
        if (selectedChildren.length > 0) {
          finalSelectedIds.add(permission.id);
        }
      });

      onSelectionChange(Array.from(finalSelectedIds));
    },
    [treeData, onSelectionChange]
  );

  if (treeData.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Shield className='text-muted-foreground mb-3 h-12 w-12' />
        <p className='text-muted-foreground'>暂无权限数据</p>
      </div>
    );
  }

  return (
    <div className='permission-tree space-y-2'>
      {treeData.map((rootPermission) => (
        <PermissionNode
          key={rootPermission.id}
          permission={rootPermission}
          level={0}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
