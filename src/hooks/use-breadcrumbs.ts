'use client';

import { usePathname } from 'next/navigation';
import { getBreadcrumbs } from '@/config/breadcrumbs';

export function useBreadcrumbs() {
  const pathname = usePathname();
  return getBreadcrumbs(pathname);
}
