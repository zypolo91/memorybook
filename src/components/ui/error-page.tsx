import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  errorCode: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  title: string;
  description: string;
  helpText: string;
  showHomeButton?: boolean;
}

export function ErrorPage({
  errorCode,
  icon: Icon,
  iconColor,
  bgColor,
  borderColor,
  textColor,
  title,
  description,
  helpText,
  showHomeButton = true
}: ErrorPageProps) {
  return (
    <div className='bg-background flex min-h-[100vh] items-center justify-center'>
      <div className='mx-auto max-w-md px-6 text-center'>
        {/* 图标 */}
        <div className='mb-8'>
          <div
            className={`mx-auto mb-4 h-20 w-20 rounded-full ${bgColor} flex items-center justify-center`}
          >
            <Icon className={`h-10 w-10 ${iconColor}`} />
          </div>
        </div>

        {/* 错误码 */}
        <h1 className='mb-4 text-6xl font-bold text-gray-300'>{errorCode}</h1>

        {/* 标题 */}
        <h2 className='mb-4 text-2xl font-semibold text-gray-800'>{title}</h2>

        {/* 描述 */}
        <p className='mb-8 leading-relaxed text-gray-600'>{description}</p>

        {/* 附加信息 */}
        <div className={`${bgColor} border ${borderColor} mb-8 rounded-lg p-4`}>
          <p className={`text-sm ${textColor}`}>{helpText}</p>
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
