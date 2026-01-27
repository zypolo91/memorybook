'use client';

import { ServerErrorPage } from '@/components/ui/error-pages';
import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录错误到错误报告服务
    console.error(error);
  }, [error]);

  return <ServerErrorPage />;
}
