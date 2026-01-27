'use client';

import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NoPermissionProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

export function NoPermission({
  title = '访问受限',
  description = '抱歉，您没有访问此页面的权限',
  showHomeButton = true
}: NoPermissionProps) {
  const router = useRouter();

  return (
    <div className='bg-background flex min-h-[100vh] items-center justify-center'>
      <div className='mx-auto max-w-md px-6 text-center'>
        {/* 图标 */}
        <div className='mb-8'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50'>
            <Shield className='h-10 w-10 text-red-500' />
          </div>
        </div>

        {/* 标题 */}
        <h1 className='mb-4 text-6xl font-bold text-gray-300'>403</h1>

        {/* 副标题 */}
        <h2 className='mb-4 text-2xl font-semibold text-gray-800'>{title}</h2>

        {/* 描述 */}
        <p className='mb-8 leading-relaxed text-gray-600'>{description}</p>

        {/* 附加信息 */}
        <div className='mb-8 rounded-lg border border-red-200 bg-red-50 p-4'>
          <p className='text-sm text-red-700'>
            请联系管理员为您分配相应的权限，或返回到有权限访问的页面。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className='flex flex-col justify-center gap-3 sm:flex-row'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            className='flex items-center gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            返回上一页
          </Button>

          {showHomeButton && (
            <Button
              onClick={() => router.push('/dashboard/overview')}
              className='flex items-center gap-2'
            >
              <Home className='h-4 w-4' />
              回到首页
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
