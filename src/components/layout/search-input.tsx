'use client';

import * as React from 'react';
import { useKBar } from 'kbar';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

export default function SearchInput() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 防止服务端渲染时出现错误
  if (!mounted) {
    return (
      <Button
        variant='outline'
        disabled
        className='bg-background text-muted-foreground relative h-9 justify-start rounded-[0.5rem] text-sm font-normal shadow-none md:w-40 md:pr-12 lg:w-64'
      >
        <SearchIcon className='mr-2 h-4 w-4 flex-shrink-0' />
        <span className='hidden lg:inline'>搜索页面、功能...</span>
        <span className='hidden md:inline lg:hidden'>搜索...</span>
      </Button>
    );
  }

  return <SearchInputClient />;
}

function SearchInputClient() {
  const { query } = useKBar();

  return (
    <Button
      variant='outline'
      className='bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground relative h-9 justify-start rounded-[0.5rem] text-sm font-normal shadow-none transition-colors md:w-40 md:pr-12 lg:w-64'
      onClick={query.toggle}
    >
      <SearchIcon className='mr-2 h-4 w-4 flex-shrink-0' />
      <span className='hidden lg:inline'>搜索页面、功能...</span>
      <span className='hidden md:inline lg:hidden'>搜索...</span>
      <kbd className='bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-6 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none md:flex'>
        <span className='text-xs'>⌘</span>K
      </kbd>
    </Button>
  );
}
