'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { X, Shield, CheckCircle2, Settings } from 'lucide-react';
import {
  PermissionTree,
  type Permission as TreePermission
} from '@/components/shared/permission-tree';
import type { PermissionDialogState } from '../types';
import { MESSAGES } from '../constants';

interface RolePermissionDialogProps {
  dialogState: PermissionDialogState;
  onClose: () => void;
  onPermissionsChange: (permissionIds: number[]) => void;
  onSave: () => Promise<boolean>;
  loading?: boolean;
}

export function RolePermissionDialog({
  dialogState,
  onClose,
  onPermissionsChange,
  onSave,
  loading = false
}: RolePermissionDialogProps) {
  // 现在selectedIds已经包含了所有应该被计算的权限（包括半选状态的父权限）
  const selectedCount = dialogState.selectedPermissions.length;

  const handlePermissionChange = (newIds: number[]) => {
    onPermissionsChange(newIds);
  };

  const handleSave = async () => {
    const success = await onSave();
    if (success) {
      onClose();
    }
  };

  return (
    <Dialog open={dialogState.open} onOpenChange={onClose}>
      <DialogContent className='flex max-h-[90vh] max-w-[95vw] flex-col overflow-hidden p-0 sm:max-h-[80vh] sm:max-w-4xl'>
        <DialogHeader className='relative shrink-0 border-b px-4 py-3 sm:px-6 sm:py-4'>
          <DialogTitle className='flex items-center gap-2 sm:gap-3'>
            <div className='bg-primary/10 flex h-6 w-6 items-center justify-center rounded-md sm:h-8 sm:w-8 sm:rounded-lg'>
              <Settings className='text-primary h-3 w-3 sm:h-4 sm:w-4' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='text-base font-semibold sm:text-lg'>权限分配</div>
              <div className='text-muted-foreground truncate text-xs font-normal sm:text-sm'>
                为角色 "{dialogState.role?.name}" 分配权限
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-1 flex-col space-y-2 overflow-hidden px-3 py-2 sm:space-y-3 sm:px-6 sm:py-3'>
          {/* 移动端提示信息 */}
          <div className='block sm:hidden'>
            <div className='flex items-center gap-2 rounded-md border border-amber-200/60 bg-amber-50/80 px-3 py-2'>
              <Shield className='h-3 w-3 shrink-0 text-amber-600' />
              <p className='text-xs text-amber-700'>
                选中父权限将自动选中所有子权限
              </p>
            </div>
          </div>

          {/* PC端提示信息 */}
          <div className='hidden sm:block'>
            <div className='flex items-center gap-2 rounded-md border border-amber-200/60 bg-amber-50/80 px-3 py-2'>
              <Shield className='h-4 w-4 text-amber-600' />
              <p className='text-sm text-amber-700'>
                选中父权限将自动选中所有子权限，取消父权限将自动取消所有子权限
              </p>
            </div>
          </div>

          {/* 权限树容器 */}
          <Card className='flex-1 overflow-hidden'>
            <CardContent className='h-full overflow-y-auto p-4'>
              {dialogState.permissions.length > 0 ? (
                <PermissionTree
                  permissions={dialogState.permissions as TreePermission[]}
                  selectedIds={dialogState.selectedPermissions}
                  onSelectionChange={handlePermissionChange}
                  disabled={loading}
                />
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <Shield className='text-muted-foreground mb-3 h-12 w-12' />
                  <p className='text-muted-foreground'>
                    {MESSAGES.EMPTY.PERMISSIONS}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className='shrink-0 border-t px-3 py-3 sm:px-6 sm:py-4'>
          {/* 移动端布局 */}
          <div className='flex w-full flex-col gap-3 sm:hidden'>
            <div className='flex items-center justify-center gap-2'>
              {selectedCount > 0 ? (
                <>
                  <CheckCircle2 className='h-3 w-3 text-green-500' />
                  <span className='text-muted-foreground text-xs'>已选择</span>
                  <Badge
                    variant='secondary'
                    className='h-5 bg-green-100 text-xs text-green-700'
                  >
                    {selectedCount} 个权限
                  </Badge>
                </>
              ) : (
                <>
                  <Shield className='text-muted-foreground h-3 w-3' />
                  <span className='text-muted-foreground text-xs'>
                    尚未选择任何权限
                  </span>
                </>
              )}
            </div>
            <div className='flex w-full gap-2'>
              <Button
                variant='outline'
                onClick={onClose}
                disabled={loading}
                className='h-9 flex-1 cursor-pointer text-sm'
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || selectedCount === 0}
                className='h-9 flex-1 cursor-pointer text-sm'
              >
                {loading ? (
                  '保存中...'
                ) : (
                  <>
                    <CheckCircle2 className='mr-1 h-3 w-3' />
                    保存权限
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* PC端布局 */}
          <div className='hidden w-full items-center justify-between sm:flex'>
            <div className='flex items-center gap-2'>
              {selectedCount > 0 ? (
                <>
                  <CheckCircle2 className='h-4 w-4 text-green-500' />
                  <span className='text-muted-foreground text-sm'>已选择</span>
                  <Badge
                    variant='secondary'
                    className='bg-green-100 text-green-700'
                  >
                    {selectedCount} 个权限
                  </Badge>
                </>
              ) : (
                <>
                  <Shield className='text-muted-foreground h-4 w-4' />
                  <span className='text-muted-foreground text-sm'>
                    尚未选择任何权限
                  </span>
                </>
              )}
            </div>
            <div className='flex gap-3'>
              <Button
                variant='outline'
                onClick={onClose}
                disabled={loading}
                className='min-w-20 cursor-pointer'
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || selectedCount === 0}
                className='min-w-24 cursor-pointer'
              >
                {loading ? (
                  '保存中...'
                ) : (
                  <>
                    <CheckCircle2 className='mr-2 h-4 w-4' />
                    保存权限
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
