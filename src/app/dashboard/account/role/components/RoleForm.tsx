'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { RoleFormData } from '../types';

interface RoleFormProps {
  data: RoleFormData;
  onChange: (data: RoleFormData) => void;
  errors?: Partial<Record<keyof RoleFormData, string>>;
}

export function RoleForm({ data, onChange, errors = {} }: RoleFormProps) {
  const handleChange = (field: keyof RoleFormData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label htmlFor='name' className='text-sm font-medium'>
          角色名称 <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='name'
          placeholder='请输入角色名称'
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`h-9 cursor-pointer ${errors.name ? 'border-destructive' : ''}`}
        />
        {errors.name && (
          <p className='text-destructive text-sm'>{errors.name}</p>
        )}
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description' className='text-sm font-medium'>
          描述
        </Label>
        <Textarea
          id='description'
          placeholder='请输入角色描述'
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className={`cursor-pointer resize-none ${errors.description ? 'border-destructive' : ''}`}
        />
        {errors.description && (
          <p className='text-destructive text-sm'>{errors.description}</p>
        )}
      </div>
    </div>
  );
}
