'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Permission, PermissionFormData } from '../types';

interface PermissionFormProps {
  /** 初始数据（编辑时） */
  initialData?: Permission;
  /** 提交回调 */
  onSubmit: (values: PermissionFormData) => void;
  /** 取消回调 */
  onCancel?: () => void;
}

/**
 * 权限表单组件
 * 用于创建和编辑权限
 */
export function PermissionForm({
  initialData,
  onSubmit,
  onCancel
}: PermissionFormProps) {
  const [formData, setFormData] = useState<PermissionFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    description: initialData?.description || ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='grid gap-2'>
        <Label htmlFor='name'>权限名称</Label>
        <Input
          id='name'
          name='name'
          value={formData.name}
          onChange={handleChange}
          placeholder='请输入权限名称'
          className='h-9'
          required
        />
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='code'>权限标识</Label>
        <Input
          id='code'
          name='code'
          value={formData.code}
          onChange={handleChange}
          placeholder='请输入权限标识，如：user:create'
          className='h-9 font-mono'
          required
        />
      </div>
      <div className='grid gap-2'>
        <Label htmlFor='description'>描述</Label>
        <Textarea
          id='description'
          name='description'
          value={formData.description}
          onChange={handleChange}
          placeholder='请输入权限描述'
          className='min-h-[80px] resize-none'
        />
      </div>
      <div className='flex justify-end gap-2'>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            className='cursor-pointer'
            onClick={onCancel}
          >
            取消
          </Button>
        )}
        <Button type='submit' className='cursor-pointer'>
          提交
        </Button>
      </div>
    </form>
  );
}
