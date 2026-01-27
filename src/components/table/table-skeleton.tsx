'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  showHeader?: boolean;
}

export function TableSkeleton({
  columnCount = 6,
  rowCount = 5,
  showHeader = true
}: TableSkeletonProps) {
  return (
    <div className='min-h-0 flex-1 overflow-auto rounded-md border'>
      <Table>
        {showHeader && (
          <TableHeader>
            <TableRow className='bg-muted/50'>
              {Array.from({ length: columnCount }).map((_, index) => (
                <TableHead key={index}>
                  <Skeleton className='h-4 w-20' />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className='h-4 w-full' />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
