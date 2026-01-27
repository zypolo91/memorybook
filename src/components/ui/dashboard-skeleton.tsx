import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className='flex h-[calc(100vh-8rem)] w-full flex-col space-y-6 overflow-y-auto'>
      {/* 页面头部骨架 */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-80' />
          <Skeleton className='h-4 w-96' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>

      {/* 统计卡片骨架 */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-6 w-16 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-2 h-8 w-24' />
              <Skeleton className='mb-1 h-3 w-32' />
              <Skeleton className='h-3 w-28' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表区域骨架 */}
      <Card className='col-span-full'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-6 w-32' />
              <Skeleton className='h-4 w-48' />
            </div>
            <div className='flex space-x-1'>
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-8 w-20' />
              <Skeleton className='h-8 w-20' />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='h-[400px] space-y-4'>
            {/* 图表Y轴 */}
            <div className='flex h-full'>
              <div className='mr-4 flex w-12 flex-col justify-between'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className='h-3 w-8' />
                ))}
              </div>
              {/* 图表主体 */}
              <div className='flex-1 space-y-2'>
                <div className='flex h-80 items-end justify-between px-2'>
                  {Array.from({ length: 12 }).map((_, i) => {
                    // 使用固定的高度模拟图表数据，避免 SSR 不一致
                    const heights = [
                      60, 120, 80, 150, 90, 180, 110, 200, 70, 140, 100, 160
                    ];
                    return (
                      <div
                        key={i}
                        className='flex flex-col items-center space-y-2'
                      >
                        <Skeleton
                          className='from-primary/20 to-primary/5 w-6 bg-gradient-to-t'
                          style={{ height: `${heights[i]}px` }}
                        />
                        <Skeleton className='h-3 w-8' />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 底部其他区域骨架 */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-24' />
          </CardHeader>
          <CardContent className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-center space-x-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-48' />
                </div>
                <Skeleton className='h-3 w-16' />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-24' />
          </CardHeader>
          <CardContent className='space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Skeleton className='h-3 w-3 rounded-full' />
                  <Skeleton className='h-4 w-20' />
                </div>
                <Skeleton className='h-4 w-16' />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SimpleDashboardSkeleton() {
  return (
    <div className='space-y-6 p-6'>
      {/* 简化版页面头部 */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-80' />
      </div>

      {/* 简化版统计卡片 */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='space-y-3 rounded-lg border p-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-12 rounded' />
            </div>
            <Skeleton className='h-7 w-16' />
            <Skeleton className='h-3 w-32' />
          </div>
        ))}
      </div>

      {/* 简化版图表 */}
      <div className='space-y-4 rounded-lg border p-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-32' />
          <div className='flex space-x-2'>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-8 w-16' />
            <Skeleton className='h-8 w-16' />
          </div>
        </div>
        <Skeleton className='h-80 w-full' />
      </div>
    </div>
  );
}
