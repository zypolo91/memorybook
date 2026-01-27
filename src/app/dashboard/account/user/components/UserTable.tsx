import React from 'react';
import { Edit, UserCheck, UserX, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem,
  type DeleteAction
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import { User, PaginationInfo } from '../types';
import { TABLE_COLUMNS, MESSAGES, STATUS_MAP } from '../constants';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

interface UserTableProps {
  /** 用户数据列表 */
  users: User[];
  /** 加载状态 */
  loading: boolean;
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 编辑用户回调 */
  onEdit: (user: User) => void;
  /** 删除用户回调 */
  onDelete: (user: User) => void;
  /** 启用用户回调 */
  onEnable?: (user: User) => void;
  /** 禁用用户回调 */
  onDisable?: (user: User) => void;
  /** 空状态配置 */
  emptyState?: EmptyStateProps;
}

/**
 * 用户表格组件
 * 负责展示用户列表数据和操作按钮
 */
export function UserTable({
  users,
  loading,
  pagination,
  onEdit,
  onDelete,
  onEnable,
  onDisable,
  emptyState
}: UserTableProps) {
  // 表格列配置
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'index') {
      return {
        ...col,
        render: (value: any, record: User, index: number) => {
          // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
          return (pagination.page - 1) * pagination.limit + index + 1;
        }
      };
    }

    if (col.key === 'role') {
      return {
        ...col,
        render: (value: any, record: User) => {
          return record.isSuperAdmin ? (
            <Badge
              variant='outline'
              className='border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700'
            >
              <Crown className='mr-1 h-3 w-3' />
              超级管理员
            </Badge>
          ) : record.role?.name ? (
            <Badge variant='secondary'>{record.role.name}</Badge>
          ) : (
            <span className='text-muted-foreground'>{MESSAGES.EMPTY.ROLE}</span>
          );
        }
      };
    }

    if (col.key === 'status') {
      return {
        ...col,
        render: (value: any, record: User) => {
          const statusInfo = STATUS_MAP[record.status];
          return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
        }
      };
    }

    if (col.key === 'lastLoginAt') {
      return {
        ...col,
        render: (value: string) =>
          value ? (
            <span className='font-mono text-sm'>{formatDateTime(value)}</span>
          ) : (
            <span className='text-muted-foreground text-sm'>
              {MESSAGES.EMPTY.LAST_LOGIN}
            </span>
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
        render: (value: any, record: User) => {
          const actions: ActionItem[] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <Edit className='mr-2 h-4 w-4' />,
              onClick: () => onEdit(record)
            }
          ];

          // 添加启用/禁用操作（超级管理员不能被禁用）
          if (record.status === 'disabled' && onEnable) {
            actions.push({
              key: 'enable',
              label: '启用',
              icon: <UserCheck className='mr-2 h-4 w-4' />,
              onClick: () => onEnable(record)
            });
          } else if (
            record.status === 'active' &&
            onDisable &&
            !record.isSuperAdmin
          ) {
            actions.push({
              key: 'disable',
              label: '禁用',
              icon: <UserX className='mr-2 h-4 w-4' />,
              onClick: () => onDisable(record)
            });
          }

          // 超级管理员不能被删除
          const deleteAction: DeleteAction | undefined = record.isSuperAdmin
            ? undefined
            : {
                description: MESSAGES.CONFIRM.DELETE(record.username),
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
      data={users}
      loading={loading}
      emptyText={MESSAGES.EMPTY.USERS}
      emptyState={emptyState}
      rowKey='id'
    />
  );
}
