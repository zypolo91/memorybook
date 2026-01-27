'use client';

import React from 'react';
import { Download, File as FileIcon, Folder, FolderOpen } from 'lucide-react';
import { DataTable } from '@/components/table/data-table';
import {
  ActionDropdown,
  type ActionItem
} from '@/components/table/action-dropdown';
import { formatDateTime } from '@/components/table/utils';
import type { FileItem } from '@/service/api/file';

function formatBytes(bytes: number | null): string {
  if (bytes == null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

interface FileTableProps {
  data: FileItem[];
  loading?: boolean;
  onOpenFolder: (path: string) => void;
  onDownload: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  canDeleteFile: boolean;
  canDeleteFolder: boolean;
}

export function FileTable({
  data,
  loading = false,
  onOpenFolder,
  onDownload,
  onDelete,
  canDeleteFile,
  canDeleteFolder
}: FileTableProps) {
  const columns = [
    {
      key: 'name',
      title: '名称',
      className: 'min-w-0',
      render: (value: string, record: FileItem) => {
        const Icon = record.isFolder ? Folder : FileIcon;
        return (
          <button
            type='button'
            className={`flex min-w-0 items-center gap-2 text-left ${record.isFolder ? 'hover:text-primary cursor-pointer' : ''}`}
            onClick={() => {
              if (record.isFolder) onOpenFolder(record.path);
            }}
          >
            <Icon className='h-4 w-4 shrink-0' />
            <span className='truncate' title={record.name}>
              {record.name}
            </span>
          </button>
        );
      }
    },
    {
      key: 'size',
      title: '大小',
      className: 'w-[120px] text-right font-mono text-sm',
      render: (value: number | null, record: FileItem) =>
        record.isFolder ? '-' : formatBytes(record.size)
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      className: 'w-[180px] font-mono text-sm',
      render: (value: string | null) => (value ? formatDateTime(value) : '-')
    },
    {
      key: 'actions',
      title: '操作',
      className: 'text-center w-[180px]',
      render: (value: any, record: FileItem) => {
        const actions: ActionItem[] = [];

        if (!record.isFolder) {
          actions.push({
            key: 'download',
            label: '下载',
            icon: <Download className='mr-2 h-4 w-4' />,
            onClick: () => onDownload(record)
          });
        } else {
          actions.push({
            key: 'open',
            label: '打开',
            icon: <FolderOpen className='mr-2 h-4 w-4' />,
            onClick: () => onOpenFolder(record.path)
          });
        }

        return (
          <ActionDropdown
            actions={actions}
            triggerClassName='h-9 w-9 p-0 cursor-pointer'
            deleteAction={
              record.isFolder
                ? canDeleteFolder
                  ? {
                      description: `确认删除文件夹 “${record.name}” 吗？（将递归删除该文件夹下所有内容）`,
                      onConfirm: () => onDelete(record)
                    }
                  : undefined
                : canDeleteFile
                  ? {
                      description: `确认删除文件 “${record.name}” 吗？`,
                      onConfirm: () => onDelete(record)
                    }
                  : undefined
            }
          />
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyText='暂无文件'
      rowKey={(r) => r.path}
    />
  );
}
