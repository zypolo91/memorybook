'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onCreate
}: NewFolderDialogProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建文件夹</DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='请输入文件夹名称'
          />
          <p className='text-muted-foreground text-xs'>
            支持多级路径：例如 <span className='font-mono'>images/2026</span>
          </p>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            className='cursor-pointer'
          >
            取消
          </Button>
          <Button
            onClick={() => {
              onCreate(name);
              onOpenChange(false);
            }}
            className='cursor-pointer'
          >
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
