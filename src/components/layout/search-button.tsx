'use client';

import * as React from 'react';
import { useKBar } from 'kbar';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

export default function SearchButton() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 防止服务端渲染时出现错误
  if (!mounted) {
    return (
      <Button variant='ghost' size='icon' disabled className='h-9 w-9'>
        <SearchIcon className='h-4 w-4' />
        <span className='sr-only'>搜索</span>
      </Button>
    );
  }

  return <SearchButtonClient />;
}

function SearchButtonClient() {
  const { query } = useKBar();

  return (
    <Button
      variant='ghost'
      size='icon'
      className='hover:bg-accent hover:text-accent-foreground h-9 w-9'
      onClick={query.toggle}
      title='搜索 (⌘K)'
    >
      <SearchIcon className='h-4 w-4' />
      <span className='sr-only'>搜索</span>
    </Button>
  );
}
