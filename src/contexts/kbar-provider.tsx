'use client';

import React from 'react';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  Action
} from 'kbar';
import { navList } from '@/constants/router';
import { NavItem } from '@/types/nav';
import { HomeIcon } from 'lucide-react';

// 从路由配置生成搜索动作
function generateSearchActions(): Action[] {
  // 临时类型用于优先级排序
  type ActionWithPriority = Action & { priority?: number };
  const actionsWithPriority: ActionWithPriority[] = [];

  // 遍历导航列表
  const processNavItem = (item: NavItem, parentSection?: string) => {
    // 如果有子项，处理子项
    if (item.items && item.items.length > 0) {
      item.items.forEach((subItem) => {
        processNavItem(subItem, item.title);
      });
    } else if (item.url && item.url !== '#') {
      // 只处理有实际URL的项
      const actionId = item.url.replace(/\//g, '-').replace(/^-/, '');
      const searchConfig = item.searchConfig;

      actionsWithPriority.push({
        id: actionId,
        name: item.title,
        shortcut: searchConfig?.searchShortcut || [],
        keywords: searchConfig?.keywords || item.title,
        section: searchConfig?.searchSection || parentSection || '导航',
        priority: searchConfig?.searchPriority || 100,
        perform: () => {
          if (item.url.startsWith('http')) {
            window.open(item.url, '_blank');
          } else {
            window.location.pathname = item.url;
          }
        },
        icon: item.icon ? (
          <item.icon className='h-4 w-4' />
        ) : (
          <HomeIcon className='h-4 w-4' />
        ),
        subtitle: item.description
      });
    }
  };

  navList.forEach((item) => processNavItem(item));

  // 按优先级排序
  actionsWithPriority.sort((a, b) => (a.priority || 100) - (b.priority || 100));

  // 移除 priority 属性并返回标准 Action[]
  const actions: Action[] = actionsWithPriority.map(
    ({ priority, ...action }) => action
  );

  return actions;
}

// 自定义 Hook 用于动态获取搜索动作
export function useSearchActions(): Action[] {
  return React.useMemo(() => {
    return generateSearchActions();
  }, []);
}

// 默认搜索动作（用于静态生成）
const defaultSearchActions: Action[] = generateSearchActions();

// 搜索结果渲染组件
function KBarResultsRenderer() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div className='text-muted-foreground border-b px-4 py-2 text-xs font-medium tracking-wider uppercase'>
            {item}
          </div>
        ) : (
          <div
            className={`cursor-pointer border-l-2 px-4 py-3 transition-all duration-150 ${
              active
                ? 'bg-accent text-accent-foreground border-l-primary'
                : 'hover:bg-muted/50 border-l-transparent'
            }`}
          >
            <div className='flex items-center gap-3'>
              {item.icon && (
                <div className='text-muted-foreground flex-shrink-0'>
                  {item.icon}
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <div className='text-sm font-medium'>{item.name}</div>
                {item.subtitle && (
                  <div className='text-muted-foreground mt-1 text-xs'>
                    {item.subtitle}
                  </div>
                )}
              </div>
              {item.shortcut && item.shortcut.length > 0 && (
                <div className='flex gap-1'>
                  {item.shortcut.map((key) => (
                    <kbd
                      key={key}
                      className='bg-muted rounded border px-2 py-1 font-mono text-xs'
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      }
    />
  );
}

// KBar UI 门户组件
function KBarUI() {
  return (
    <KBarPortal>
      <KBarPositioner className='z-50 bg-black/80 p-4 backdrop-blur-sm'>
        <KBarAnimator className='bg-background w-full max-w-2xl overflow-hidden rounded-lg border shadow-xl'>
          <div className='bg-muted/30 border-b'>
            <KBarSearch
              className='placeholder:text-muted-foreground w-full bg-transparent px-4 py-4 text-sm outline-none'
              placeholder='搜索页面、功能... (支持拼音首字母)'
            />
          </div>
          <div className='max-h-96 overflow-y-auto'>
            <KBarResultsRenderer />
          </div>
          <div className='text-muted-foreground bg-muted/30 border-t px-4 py-3 text-xs'>
            <div className='flex items-center justify-between'>
              <span>使用 ↑↓ 选择，Enter 确认</span>
              <span>Esc 关闭</span>
            </div>
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
}

// 主 KBar 组件
interface KBarComponentProps {
  children: React.ReactNode;
}

export function KBarComponent({ children }: KBarComponentProps) {
  const searchActions = useSearchActions();

  return (
    <KBarProvider actions={searchActions}>
      {children}
      <KBarUI />
    </KBarProvider>
  );
}

// 导出搜索动作，供其他组件使用
export { defaultSearchActions as searchActions };
