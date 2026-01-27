'use client';

import React, { Fragment, useMemo } from 'react';
import { ArrowUp, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Slash } from 'lucide-react';

interface FilePathBarProps {
  path: string;
  onNavigate: (path: string) => void;
  onUp: () => void;
}

export function FilePathBar({ path, onNavigate, onUp }: FilePathBarProps) {
  const segments = useMemo(() => {
    const parts = path.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; path: string }> = [];
    parts.forEach((label, idx) => {
      crumbs.push({
        label,
        path: parts.slice(0, idx + 1).join('/')
      });
    });
    return crumbs;
  }, [path]);

  const canUp = segments.length > 0;

  return (
    <div className='flex items-center gap-3'>
      <Button
        variant='outline'
        size='sm'
        onClick={onUp}
        disabled={!canUp}
        className='cursor-pointer'
      >
        <ArrowUp className='mr-2 h-4 w-4' />
        上级
      </Button>

      <div className='min-w-0 flex-1'>
        <Breadcrumb>
          <BreadcrumbList>
            {segments.length === 0 ? (
              <BreadcrumbItem>
                <BreadcrumbPage className='flex items-center gap-2'>
                  <FolderOpen className='h-4 w-4' />
                  根目录
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className='cursor-pointer'
                    onClick={() => onNavigate('')}
                  >
                    <span className='flex items-center gap-2'>
                      <FolderOpen className='h-4 w-4' />
                      根目录
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <Slash className='h-4 w-4' />
                </BreadcrumbSeparator>

                {segments.map((seg, idx) => (
                  <Fragment key={seg.path}>
                    {idx !== segments.length - 1 ? (
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          asChild
                          className='cursor-pointer'
                          onClick={() => onNavigate(seg.path)}
                        >
                          <span className='truncate'>{seg.label}</span>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage className='truncate'>
                          {seg.label}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                    {idx < segments.length - 1 && (
                      <BreadcrumbSeparator>
                        <Slash className='h-4 w-4' />
                      </BreadcrumbSeparator>
                    )}
                  </Fragment>
                ))}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
}
