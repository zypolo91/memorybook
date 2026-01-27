import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { UserForm } from './UserForm';
import { UserFormData, UserDialogState } from '../types';

interface UserDialogsProps {
  /** 对话框状态 */
  dialogState: UserDialogState;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 创建用户回调 */
  onCreateUser: (data: UserFormData) => Promise<void>;
  /** 更新用户回调 */
  onUpdateUser: (data: UserFormData) => Promise<void>;
}

/**
 * 用户对话框组件
 * 负责管理新增和编辑用户的对话框
 */
export function UserDialogs({
  dialogState,
  onClose,
  onCreateUser,
  onUpdateUser
}: UserDialogsProps) {
  const { type, user, open } = dialogState;

  /**
   * 处理表单提交
   */
  const handleSubmit = async (data: UserFormData) => {
    if (type === 'create') {
      await onCreateUser(data);
    } else if (type === 'edit' && user) {
      await onUpdateUser(data);
    }
  };

  /**
   * 获取对话框标题
   */
  const getDialogTitle = () => {
    switch (type) {
      case 'create':
        return '新增用户';
      case 'edit':
        return '编辑用户';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='flex max-w-lg flex-col p-0'>
        <DialogHeader className='relative shrink-0 border-b px-6 py-4'>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogClose className='ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none'>
            <X className='h-4 w-4' />
            <span className='sr-only'>关闭</span>
          </DialogClose>
        </DialogHeader>

        <div className='px-6 py-4'>
          {open && (
            <UserForm
              initialData={type === 'edit' ? user : undefined}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
