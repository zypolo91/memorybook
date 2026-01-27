'use client';

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export interface ActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export interface DeleteAction {
  title?: string;
  description: string;
  onConfirm: () => void;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  deleteAction?: DeleteAction;
  triggerClassName?: string;
}

export function ActionDropdown({
  actions,
  deleteAction,
  triggerClassName = 'h-8 w-8 p-0 cursor-pointer'
}: ActionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className={triggerClassName}>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.key}
            onClick={action.onClick}
            className={`${action.className} cursor-pointer`}
            disabled={action.disabled}
          >
            <div className='flex items-center'>
              {action.icon ? (
                <span className='flex items-center'>{action.icon}</span>
              ) : null}
              <span>{action.label}</span>
            </div>
          </DropdownMenuItem>
        ))}

        {deleteAction && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className='cursor-pointer'
              >
                删除
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {deleteAction.title || '确认删除'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteAction.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className='cursor-pointer'>
                  取消
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteAction.onConfirm}
                  className='hover:bg-destructive/90 cursor-pointer'
                >
                  删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
