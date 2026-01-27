'use client';

import React from 'react';
import { Folder, File as FileIcon, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FileItem } from '@/service/api/file';

function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className='py-0'>
      <CardContent className='flex items-center gap-3 px-4 py-4'>
        <div className='bg-muted/50 text-foreground flex h-9 w-9 items-center justify-center rounded-lg border'>
          {icon}
        </div>
        <div className='min-w-0'>
          <div className='text-muted-foreground text-xs'>{label}</div>
          <div className='text-xl leading-tight font-semibold'>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FileStats({ items }: { items: FileItem[] }) {
  const folders = items.filter((i) => i.isFolder).length;
  const files = items.length - folders;

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
      <StatCard
        icon={<Layers className='h-4 w-4' />}
        label='总项目'
        value={items.length}
      />
      <StatCard
        icon={<Folder className='h-4 w-4' />}
        label='文件夹'
        value={folders}
      />
      <StatCard
        icon={<FileIcon className='h-4 w-4' />}
        label='文件'
        value={files}
      />
    </div>
  );
}
