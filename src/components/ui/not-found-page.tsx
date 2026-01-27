import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
}

export function NotFoundPage({
  title = '页面未找到',
  description = '抱歉，您访问的页面不存在或已被移除',
  showHomeButton = true
}: NotFoundPageProps) {
  return (
    <div className='bg-background flex min-h-[100vh] items-center justify-center'>
      <div className='mx-auto max-w-md px-6 text-center'>
        {/* 图标 */}
        <div className='mb-8'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50'>
            <FileQuestion className='h-10 w-10 text-blue-500' />
          </div>
        </div>

        {/* 标题 */}
        <h1 className='mb-4 text-6xl font-bold text-gray-300'>404</h1>

        {/* 副标题 */}
        <h2 className='mb-4 text-2xl font-semibold text-gray-800'>{title}</h2>

        {/* 描述 */}
        <p className='mb-8 leading-relaxed text-gray-600'>{description}</p>

        {/* 附加信息 */}
        <div className='mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4'>
          <p className='text-sm text-blue-700'>
            请检查网址是否正确，或者尝试从导航菜单重新访问所需页面。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className='flex flex-col justify-center gap-3 sm:flex-row'>
          <Button variant='outline' asChild className='flex items-center gap-2'>
            <Link href='javascript:history.back()'>
              <ArrowLeft className='h-4 w-4' />
              返回上一页
            </Link>
          </Button>

          {showHomeButton && (
            <Button asChild className='flex items-center gap-2'>
              <Link href='/dashboard/overview'>
                <Home className='h-4 w-4' />
                回到首页
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
