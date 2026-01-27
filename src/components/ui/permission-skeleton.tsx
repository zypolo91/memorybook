import { Skeleton } from '@/components/ui/skeleton';

export function PermissionSkeleton() {
  return (
    <div className='space-y-6 p-6'>
      {/* 页面标题骨架 */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
      </div>

      {/* 操作栏骨架 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
        </div>
        <Skeleton className='h-10 w-24' />
      </div>

      {/* 表格骨架 */}
      <div className='rounded-md border'>
        {/* 表头 */}
        <div className='border-b p-4'>
          <div className='flex items-center space-x-4'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-4 w-28' />
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-16' />
          </div>
        </div>

        {/* 表格行 */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='border-b p-4 last:border-b-0'>
            <div className='flex items-center space-x-4'>
              <Skeleton className='h-4 w-4' />
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-16' />
            </div>
          </div>
        ))}
      </div>

      {/* 分页骨架 */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-4 w-32' />
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
          <Skeleton className='h-8 w-8' />
        </div>
      </div>
    </div>
  );
}

export function SimplePermissionSkeleton() {
  return (
    <div className='space-y-4 p-6'>
      <div className='space-y-2'>
        <Skeleton className='h-6 w-48' />
        <Skeleton className='h-4 w-72' />
      </div>
      <div className='grid gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-20 w-full' />
        ))}
      </div>
    </div>
  );
}
