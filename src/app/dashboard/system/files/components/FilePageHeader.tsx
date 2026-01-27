'use client';

import React from 'react';
import { FolderPlus, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/table/page-header';

interface FilePageHeaderProps {
  onUpload: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  canUpload: boolean;
  canCreateFolder: boolean;
  loading?: boolean;
}

export function FilePageHeader({
  onUpload,
  onNewFolder,
  onRefresh,
  canUpload,
  canCreateFolder,
  loading = false
}: FilePageHeaderProps) {
  return (
    <PageHeader
      title='文件管理'
      description='基于 Supabase Storage 的文件管理'
      action={{
        label: '上传文件',
        onClick: onUpload,
        icon: <Upload className='mr-2 h-4 w-4' />,
        disabled: !canUpload
      }}
    >
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          onClick={onNewFolder}
          disabled={!canCreateFolder}
          className='cursor-pointer'
        >
          <FolderPlus className='mr-2 h-4 w-4' />
          新建文件夹
        </Button>
        <Button
          variant='outline'
          onClick={onRefresh}
          disabled={loading}
          className='cursor-pointer'
        >
          <RefreshCw className='mr-2 h-4 w-4' />
          刷新
        </Button>
      </div>
    </PageHeader>
  );
}
