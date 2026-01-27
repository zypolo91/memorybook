'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useBreadcrumbs } from '@/hooks/use-breadcrumbs';
import { Slash } from 'lucide-react';
import { Fragment } from 'react';
import Link from 'next/link';

export function Breadcrumbs() {
  const items = useBreadcrumbs();

  if (!items?.length) return null;

  // 移动端只显示最后两个层级（当前页面和上一级）
  const mobileItems = items.length > 2 ? items.slice(-2) : items;
  // 桌面端显示所有层级
  const desktopItems = items;

  return (
    <>
      {/* 移动端：简化显示 */}
      <div className='block md:hidden'>
        <Breadcrumb>
          <BreadcrumbList>
            {mobileItems.map(
              (item: { link: string; title: string }, index: number) => (
                <Fragment key={`mobile-${item.title}-${index}`}>
                  {index !== mobileItems.length - 1 ? (
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={item.link} className='text-xs'>
                          {item.title}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage className='text-xs font-medium'>
                        {item.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                  {index < mobileItems.length - 1 && (
                    <BreadcrumbSeparator>
                      <Slash className='h-3 w-3' />
                    </BreadcrumbSeparator>
                  )}
                </Fragment>
              )
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 桌面端：完整显示 */}
      <div className='hidden md:block'>
        <Breadcrumb>
          <BreadcrumbList>
            {desktopItems.map(
              (item: { link: string; title: string }, index: number) => (
                <Fragment key={`desktop-${item.title}-${index}`}>
                  {index !== desktopItems.length - 1 ? (
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={item.link}>{item.title}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{item.title}</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                  {index < desktopItems.length - 1 && (
                    <BreadcrumbSeparator>
                      <Slash className='h-4 w-4' />
                    </BreadcrumbSeparator>
                  )}
                </Fragment>
              )
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </>
  );
}
