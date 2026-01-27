'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  };
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  action,
  children
}: PageHeaderProps) {
  return (
    <div className='flex items-center justify-between'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        {description && (
          <p className='text-muted-foreground mt-2'>{description}</p>
        )}
      </div>
      {action && (
        <Button
          onClick={action.onClick}
          disabled={action.disabled}
          className='cursor-pointer'
        >
          {action.icon || <Plus className='mr-2 h-4 w-4' />}
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
