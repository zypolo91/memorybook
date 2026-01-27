import { NavItem } from '@/types/nav';
import {
  CircleUserRound,
  SquareTerminal,
  Settings,
  ScrollText,
  FolderOpen,
  Cog,
  Users,
  Shield,
  Key
} from 'lucide-react';

// 业务导航列表
export const businessNavList: NavItem[] = [
  {
    title: '工作台',
    url: '/dashboard/overview',
    icon: SquareTerminal,
    isActive: false,
    description: '工作台',
    items: [],
    searchConfig: {
      keywords: 'dashboard overview home 工作台',
      searchShortcut: ['d'],
      searchSection: '导航',
      searchPriority: 1
    }
  }
];

// 系统导航列表
export const systemNavList: NavItem[] = [
  {
    title: '账户管理',
    url: '#',
    icon: CircleUserRound,
    isActive: false,
    items: [
      {
        title: '用户管理',
        url: '/dashboard/account/user',
        description: '用户管理',
        icon: Users,
        searchConfig: {
          keywords: 'users management 用户 管理 user',
          searchShortcut: ['u'],
          searchSection: '账户管理',
          searchPriority: 2
        }
      },
      {
        title: '角色管理',
        url: '/dashboard/account/role',
        description: '角色管理',
        icon: Shield,
        searchConfig: {
          keywords: 'roles permissions 角色 权限 role',
          searchShortcut: ['r'],
          searchSection: '账户管理',
          searchPriority: 3
        }
      },
      {
        title: '权限管理',
        url: '/dashboard/account/permission',
        description: '权限管理',
        icon: Key,
        searchConfig: {
          keywords: 'permissions settings 权限 设置 permission',
          searchShortcut: ['p'],
          searchSection: '账户管理',
          searchPriority: 4
        }
      }
    ]
  },
  {
    title: '系统管理',
    url: '#',
    icon: Settings,
    isActive: false,
    items: [
      {
        title: '日志管理',
        url: '/dashboard/system/logs',
        icon: ScrollText,
        description: '系统日志审计',
        searchConfig: {
          keywords: 'system logs audit 系统日志 审计 log',
          searchShortcut: ['l'],
          searchSection: '系统管理',
          searchPriority: 5
        }
      },
      {
        title: '文件管理',
        url: '/dashboard/system/files',
        icon: FolderOpen,
        description: '文件上传与管理',
        searchConfig: {
          keywords: 'files storage upload 文件 存储 上传 管理',
          searchShortcut: ['f'],
          searchSection: '系统管理',
          searchPriority: 6
        }
      }
    ]
  }
];

// 导航聚合
export const navList: NavItem[] = [...businessNavList, ...systemNavList];
