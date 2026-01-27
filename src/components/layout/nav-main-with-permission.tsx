'use client';

import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';
import { ROUTE_PERMISSIONS } from '@/lib/permissions';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@/components/ui/sidebar';
import { businessNavList, systemNavList } from '@/constants/router';
import { NavItem } from '@/types/nav';

export function NavMainWithPermission() {
  const { hasAnyPermission, loading } = usePermissions();
  const pathname = usePathname();

  // 检查是否为当前路径或其子路径
  const isActivePath = (url: string): boolean => {
    if (url === '#') return false;
    return pathname === url || pathname.startsWith(url + '/');
  };

  // 检查是否有子项被激活
  const hasActiveChild = (items: NavItem[]): boolean => {
    return items.some(
      (item) =>
        isActivePath(item.url) || (item.items && hasActiveChild(item.items))
    );
  };

  // 检查单个菜单项是否有权限
  const hasMenuPermission = (url: string): boolean => {
    if (loading) return true; // 加载中时显示所有菜单

    // 获取该路由对应的权限
    const requiredPermissions =
      ROUTE_PERMISSIONS[url as keyof typeof ROUTE_PERMISSIONS];

    if (!requiredPermissions) {
      return true; // 没有配置权限的路由默认可访问
    }

    return hasAnyPermission([...requiredPermissions]);
  };

  // 递归过滤菜单项
  const filterMenuItems = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (item.items && item.items.length > 0) {
          // 递归过滤子菜单
          const filteredSubItems = filterMenuItems(item.items);

          // 如果所有子菜单都被过滤掉了，则隐藏父菜单
          if (filteredSubItems.length === 0) {
            return null;
          }

          return {
            ...item,
            items: filteredSubItems
          };
        } else {
          // 叶子节点，检查权限
          return hasMenuPermission(item.url) ? item : null;
        }
      })
      .filter((item): item is NavItem => item !== null);
  };

  // 渲染单个导航组的函数
  const renderNavGroup = (navItems: NavItem[], groupLabel: string) => {
    const filteredNavList = filterMenuItems(navItems);

    // 如果没有任何可显示的菜单项，返回null
    if (filteredNavList.length === 0) {
      return null;
    }

    return (
      <SidebarGroup key={groupLabel}>
        <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
        <SidebarMenu>
          {filteredNavList.map((item) => {
            const isItemActive = isActivePath(item.url);
            const hasActiveSubItem = item.items
              ? hasActiveChild(item.items)
              : false;
            const shouldOpen = isItemActive || hasActiveSubItem;

            return (
              <Collapsible key={item.title} asChild defaultOpen={shouldOpen}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isItemActive}
                  >
                    {item.url === '#' ? (
                      <div>
                        <item.icon />
                        <span>{item.title}</span>
                      </div>
                    ) : (
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className='data-[state=open]:rotate-90'>
                          <ChevronRight />
                          <span className='sr-only'>Toggle</span>
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActivePath(subItem.url)}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    );
  };

  return (
    <>
      {renderNavGroup(businessNavList, '业务')}
      {renderNavGroup(systemNavList, '系统')}
    </>
  );
}
