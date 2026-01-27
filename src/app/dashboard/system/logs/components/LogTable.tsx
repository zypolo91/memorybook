'use client';

import React from 'react';
import { Eye, Info, AlertTriangle, AlertCircle, Bug } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';

import type { LogItem, PaginationInfo } from '../types';
import { LOG_LEVEL_COLORS } from '../constants';

interface LogTableProps {
  /** 日志列表数据 */
  data: LogItem[];
  /** 加载状态 */
  loading?: boolean;
  /** 分页信息 */
  pagination: PaginationInfo;
  /** 查看详情操作 */
  onView: (log: LogItem) => void;
}

const levelIcons = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  debug: Bug
};

export function LogTable({
  data,
  loading = false,
  pagination,
  onView
}: LogTableProps) {
  // 定义表格列
  const columns = [
    {
      key: 'index',
      title: 'ID',
      className: 'text-center w-[60px] font-mono text-sm',
      render: (value: string, record: LogItem, index: number) => {
        // 计算全局序号：(当前页 - 1) * 每页大小 + 当前索引 + 1
        const globalIndex =
          (pagination.page - 1) * pagination.limit + index + 1;
        return <span className='font-mono text-sm'>{globalIndex}</span>;
      }
    },
    {
      key: 'level',
      title: '级别',
      className: 'w-[80px]',
      render: (value: string) => {
        const LevelIcon = levelIcons[value as keyof typeof levelIcons] || Info;
        return (
          <div className='flex items-center gap-2'>
            <LevelIcon className='h-4 w-4' />
            <Badge
              className={
                LOG_LEVEL_COLORS[value as keyof typeof LOG_LEVEL_COLORS]
              }
            >
              {value.toUpperCase()}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'module',
      title: '模块',
      className: 'w-[100px] font-medium'
    },
    {
      key: 'action',
      title: '操作',
      className: 'w-[120px] font-medium'
    },
    {
      key: 'message',
      title: '消息',
      className: 'min-w-0 flex-1',
      render: (value: string) => (
        <div className='max-w-md truncate' title={value}>
          {value}
        </div>
      )
    },
    {
      key: 'username',
      title: '用户',
      className: 'w-[100px] font-medium',
      render: (value: string) => value || '-'
    },
    {
      key: 'createdAt',
      title: '时间',
      className: 'w-[160px]',
      render: (value: string) => (
        <span className='font-mono text-sm'>{formatDateTime(value)}</span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      className: 'text-center w-[80px]',
      render: (value: any, record: LogItem) => {
        const actions: ActionItem[] = [
          {
            key: 'view',
            label: '查看详情',
            icon: <Eye className='mr-2 h-4 w-4' />,
            onClick: () => onView(record)
          }
        ];

        return <ActionDropdown actions={actions} />;
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyText='暂无日志数据'
      rowKey='id'
    />
  );
}
