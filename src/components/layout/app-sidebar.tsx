'use client';

import Image from 'next/image';
import * as React from 'react';
import { LifeBuoy, Send } from 'lucide-react';

import { NavMainWithPermission } from '@/components/layout/nav-main-with-permission';
import { NavSecondary } from '@/components/layout/nav-secondary';
import { NavUser } from '@/components/layout/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import { siteConfig } from '@/config/site';

const data = {
  navSecondary: []
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='#'>
                <div className='relative'>
                  <div className='bg-primary/10 absolute inset-0 rounded-lg blur-sm' />
                  <div className='bg-background relative rounded-lg border p-1 shadow-lg'>
                    <Image
                      src='/logo.png'
                      alt='Logo'
                      width={24}
                      height={24}
                      className='dark:invert'
                    />
                  </div>
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {siteConfig.name}
                  </span>
                  <span className='truncate text-xs'>
                    {siteConfig.description}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMainWithPermission />
        <NavSecondary items={data.navSecondary} className='mt-auto' />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
