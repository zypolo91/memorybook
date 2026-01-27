'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { PermissionForm } from './PermissionForm';
import type { PermissionDialogState, PermissionFormData } from '../types';

interface PermissionDialogsProps {
  /** 对话框状态 */
  dialogState: PermissionDialogState;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 提交表单回调 */
  onSubmit: (data: PermissionFormData) => Promise<void>;
}

/**
 * 权限对话框组件
 * 包含创建和编辑权限的对话框
 */
export function PermissionDialogs({
  dialogState,
  onClose,
  onSubmit
}: PermissionDialogsProps) {
  const { type, permission, open } = dialogState;

  const handleSubmit = async (data: PermissionFormData) => {
    await onSubmit(data);
  };

  const getDialogTitle = () => {
    switch (type) {
      case 'create':
        return '新增权限';
      case 'edit':
        return '编辑权限';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='flex max-w-md flex-col p-0'>
        <DialogHeader className='relative shrink-0 border-b px-6 py-4'>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogClose className='ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none'>
            <X className='h-4 w-4' />
            <span className='sr-only'>关闭</span>
          </DialogClose>
        </DialogHeader>
        <div className='px-6 py-4'>
          <PermissionForm
            initialData={permission || undefined}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
