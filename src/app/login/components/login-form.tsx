'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthAPI } from '@/service/request';
import { useAuthStore } from '@/stores/auth';
import { resetGlobalInitFlag } from '@/hooks/use-auth';
import Link from 'next/link';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const { forceReInitialize } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: process.env.NODE_ENV === 'development' ? 'admin@example.com' : '',
    password: process.env.NODE_ENV === 'development' ? 'Admin@123456' : ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await AuthAPI.login(formData);
      if (res.code === 0) {
        toast.success('登录成功');

        // 重置全局初始化标志，确保跳转后会重新初始化
        resetGlobalInitFlag();

        // 立即强制重新初始化认证状态（获取最新的会话和权限信息）
        await forceReInitialize();

        // 跳转到dashboard
        router.push('/dashboard');
      } else {
        toast.error(res.message || '登录失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>登录</CardTitle>
          <CardDescription>请输入您的邮箱和密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>邮箱</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='your@email.com'
                  required
                  disabled={loading}
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>密码</Label>
                  <a
                    href='#'
                    className='ml-auto inline-block text-sm underline-offset-4 hover:underline'
                  >
                    忘记密码？
                  </a>
                </div>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
              <Button variant='outline' className='w-full' disabled={loading}>
                使用 Google 登录
              </Button>
            </div>
            <div className='mt-4 text-center text-sm'>
              还没有账号？{' '}
              <Link href='/register' className='underline underline-offset-4'>
                注册
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
