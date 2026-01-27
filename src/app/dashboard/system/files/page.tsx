'use client';

import React, { useEffect, useRef, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/lib/permissions';
import {
  FilePageHeader,
  FilePathBar,
  FileStats,
  FileTable,
  NewFolderDialog
} from './components';
import { useFileManagement } from './hooks';

export default function FilesPage() {
  const { hasPermission } = usePermissions();
  const {
    path,
    items,
    loading,
    fetchList,
    refresh,
    openFolder,
    goUp,
    upload,
    createFolder,
    deleteItem,
    download
  } = useFileManagement();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canUpload = hasPermission(PERMISSIONS.FILE.UPLOAD);
  const canCreateFolder = hasPermission(PERMISSIONS.FILE.FOLDER_CREATE);
  const canDeleteFile = hasPermission(PERMISSIONS.FILE.DELETE);
  const canDeleteFolder = hasPermission(PERMISSIONS.FILE.FOLDER_DELETE);

  useEffect(() => {
    fetchList('');
  }, [fetchList]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    await upload(files);
  };

  return (
    <PermissionGuard permissions={PERMISSIONS.FILE.READ}>
      <PageContainer scrollable={false}>
        <div className='flex h-[calc(100vh-8rem)] w-full flex-col space-y-4'>
          <FilePageHeader
            onUpload={handleUploadClick}
            onNewFolder={() => setNewFolderOpen(true)}
            onRefresh={refresh}
            loading={loading}
            canUpload={canUpload}
            canCreateFolder={canCreateFolder}
          />

          <FileStats items={items} />

          <div className='flex items-center justify-between gap-3'>
            <div className='bg-muted/20 w-full rounded-lg border p-3'>
              <FilePathBar path={path} onNavigate={openFolder} onUp={goUp} />
            </div>
          </div>

          <div className='flex min-h-0 flex-1 flex-col'>
            <FileTable
              data={items}
              loading={loading}
              onOpenFolder={openFolder}
              onDownload={download}
              onDelete={deleteItem}
              canDeleteFile={canDeleteFile}
              canDeleteFolder={canDeleteFolder}
            />
          </div>

          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='hidden'
            onChange={handleFilesSelected}
            disabled={!canUpload}
          />

          <NewFolderDialog
            open={newFolderOpen}
            onOpenChange={setNewFolderOpen}
            onCreate={createFolder}
          />
        </div>
      </PageContainer>
    </PermissionGuard>
  );
}
