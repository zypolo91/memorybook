import Image from 'next/image';
import { LoginForm } from './components/login-form';
import { siteConfig } from '@/config/site';

export default function Page() {
  return (
    <div className='from-background via-background to-muted/50 flex min-h-screen bg-gradient-to-br'>
      {/* 背景装饰 */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='bg-primary/5 absolute -top-40 -right-40 h-80 w-80 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/5 blur-3xl' />
        <div className='absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-purple-500/3 blur-3xl' />
      </div>

      {/* 主要内容区域 */}
      <div className='relative z-10 flex w-full items-center justify-center p-6 md:p-10'>
        <div className='w-full max-w-md'>
          {/* Logo 和品牌区域 */}
          <div className='mb-8 text-center'>
            <div className='mb-4 flex items-center justify-center gap-3'>
              <div className='relative'>
                <div className='bg-primary/10 absolute inset-0 rounded-lg blur-sm' />
                <div className='bg-background relative rounded-lg border p-3 shadow-lg'>
                  <Image
                    src='/logo.png'
                    alt='N-Admin Logo'
                    width={32}
                    height={32}
                    className='dark:invert'
                  />
                </div>
              </div>
              <div>
                <h1 className='from-foreground to-foreground/80 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent'>
                  {siteConfig.name}
                </h1>
                <p className='text-muted-foreground text-sm'>
                  {siteConfig.description}
                </p>
              </div>
            </div>
            <p className='text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed'>
              欢迎使用 {siteConfig.name}{' '}
              管理系统，请使用您的凭据登录以访问管理面板
            </p>
          </div>

          {/* 登录表单 */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
