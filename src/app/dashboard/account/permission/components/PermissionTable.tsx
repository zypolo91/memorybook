import React from 'react';
import { Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem,
  type DeleteAction
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import { Permission, PaginationInfo } from '../types';
import { TABLE_COLUMNS, MESSAGES } from '../constants';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface PermissionTableProps {
  /** 权限数据列表 */
  permissions: Permission[];
  /** 加载状态 */
  loading: boolean;
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 编辑权限回调 */
  onEdit: (permission: Permission) => void;
  /** 删除权限回调 */
  onDelete: (permission: Permission) => void;
  /** 空状态配置 */
  emptyState?: EmptyStateProps;
}

/**
 * 权限表格组件
 * 负责展示权限列表数据和操作按钮
 */
export function PermissionTable({
  permissions,
  loading,
  pagination,
  onEdit,
  onDelete,
  emptyState
}: PermissionTableProps) {
  // 表格列配置
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'index') {
      return {
        ...col,
        render: (value: any, record: Permission, index: number) => {
          // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
          return (pagination.page - 1) * pagination.limit + index + 1;
        }
      };
    }

    if (col.key === 'code') {
      return {
        ...col,
        render: (value: string) => (
          <Badge variant='outline' className='font-mono text-xs'>
            {value}
          </Badge>
        )
      };
    }

    if (col.key === 'createdAt') {
      return {
        ...col,
        render: (value: string) => (
          <span className='font-mono text-sm'>{formatDateTime(value)}</span>
        )
      };
    }

    if (col.key === 'actions') {
      return {
        ...col,
        render: (value: any, record: Permission) => {
          const actions: ActionItem[] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <Edit className='mr-2 h-4 w-4' />,
              onClick: () => onEdit(record)
            }
          ];

          const deleteAction: DeleteAction = {
            description: MESSAGES.CONFIRM.DELETE(record.name),
            onConfirm: () => onDelete(record)
          };

          return (
            <ActionDropdown actions={actions} deleteAction={deleteAction} />
          );
        }
      };
    }

    return col;
  });

  return (
    <DataTable
      columns={columns}
      data={permissions}
      loading={loading}
      emptyText={MESSAGES.EMPTY.PERMISSIONS}
      emptyState={emptyState}
      rowKey='id'
    />
  );
}
