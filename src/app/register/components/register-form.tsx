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

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const { forceReInitialize } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('密码长度至少为6位');
      return;
    }

    setLoading(true);
    try {
      const res = await AuthAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      if (res.code === 0) {
        toast.success('注册成功，正在跳转...');

        resetGlobalInitFlag();
        await forceReInitialize();

        router.push('/dashboard');
      } else {
        toast.error(res.message || '注册失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>注册账号</CardTitle>
          <CardDescription>创建一个新账号开始使用</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='username'>用户名</Label>
                <Input
                  id='username'
                  name='username'
                  type='text'
                  value={formData.username}
                  onChange={handleChange}
                  placeholder='请输入用户名'
                  required
                  disabled={loading}
                />
              </div>
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
                <Label htmlFor='password'>密码</Label>
                <Input
                  id='password'
                  name='password'
                  type='password'
                  value={formData.password}
                  onChange={handleChange}
                  placeholder='至少6位密码'
                  required
                  disabled={loading}
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='confirmPassword'>确认密码</Label>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder='再次输入密码'
                  required
                  disabled={loading}
                />
              </div>
              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
            </div>
            <div className='mt-4 text-center text-sm'>
              已有账号？{' '}
              <Link href='/login' className='underline underline-offset-4'>
                立即登录
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
