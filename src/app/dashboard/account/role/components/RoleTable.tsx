'use client';

import React from 'react';
import { Edit, Users, Settings, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem,
  type DeleteAction
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import { TABLE_COLUMNS, MESSAGES } from '../constants';
import type { Role, PaginationInfo } from '../types';

interface RoleTableProps {
  data: Role[];
  loading: boolean;
  pagination: PaginationInfo;
  onEdit: (role: Role) => void;
  onPermission: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export function RoleTable({
  data,
  loading,
  pagination,
  onEdit,
  onPermission,
  onDelete
}: RoleTableProps) {
  // 定义表格列
  const columns = TABLE_COLUMNS.map((col) => {
    if (col.key === 'index') {
      return {
        ...col,
        render: (value: any, record: Role, index: number) => {
          // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
          return (pagination.page - 1) * pagination.limit + index + 1;
        }
      };
    }

    if (col.key === 'name') {
      return {
        ...col,
        className: 'font-medium',
        render: (value: any, record: Role) => {
          return record.isSuper ? (
            <Badge
              variant='outline'
              className='border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700'
            >
              <Crown className='mr-1 h-3 w-3' />
              超级管理员
            </Badge>
          ) : (
            <span>{value}</span>
          );
        }
      };
    }

    if (col.key === 'userCount') {
      return {
        ...col,
        render: (value: number) => (
          <Badge variant='outline' className='flex w-fit items-center gap-1'>
            <Users className='h-3 w-3' />
            {value || 0}
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
        render: (_: unknown, record: Role) => {
          const actions: ActionItem[] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <Edit className='mr-2 h-4 w-4' />,
              onClick: () => onEdit(record)
            },
            {
              key: 'permissions',
              label: '权限分配',
              icon: <Settings className='mr-2 h-4 w-4' />,
              onClick: () => onPermission(record)
            }
          ];

          // 超级管理员不能被删除
          const deleteAction: DeleteAction | undefined = record.isSuper
            ? undefined
            : {
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
      data={data}
      loading={loading}
      emptyText={MESSAGES.EMPTY.ROLES}
      rowKey='id'
    />
  );
}
