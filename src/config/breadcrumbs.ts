import { NavItem } from '@/types/nav';
import { navList } from '@/constants/router';

export type BreadcrumbItem = {
  title: string;
  link: string;
};

function findParentNav(
  items: NavItem[],
  targetPath: string,
  parentPath = ''
): NavItem | null {
  for (const item of items) {
    const currentPath = item.url === '#' ? parentPath : item.url;

    if (item.items?.some((subItem) => subItem.url === targetPath)) {
      return item;
    }

    if (item.items?.length) {
      const found = findParentNav(item.items, targetPath, currentPath);
      if (found) return found;
    }
  }
  return null;
}

export const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];
  const addedTitles = new Set<string>();

  // 始终添加工作台作为第一个面包屑项
  breadcrumbs.push({
    title: '工作台',
    link: '/dashboard/overview'
  });
  addedTitles.add('工作台');

  let currentPath = '';
  paths.forEach((path) => {
    currentPath += `/${path}`;

    const matchedNav = findNavItem(navList, currentPath);
    if (matchedNav) {
      const parentNav = findParentNav(navList, currentPath);
      if (parentNav && !addedTitles.has(parentNav.title)) {
        // 如果父级导航的URL是'#'，使用第一个有权限的子项作为链接
        let parentLink = parentNav.url;
        if (parentNav.url === '#' && parentNav.items?.length) {
          parentLink = parentNav.items[0].url;
        }

        breadcrumbs.push({
          title: parentNav.title,
          link: parentLink
        });
        addedTitles.add(parentNav.title);
      }

      if (!addedTitles.has(matchedNav.title)) {
        breadcrumbs.push({
          title: matchedNav.title,
          link: matchedNav.url
        });
        addedTitles.add(matchedNav.title);
      }
    }
  });

  return breadcrumbs;
};

function findNavItem(items: NavItem[], path: string): NavItem | undefined {
  for (const item of items) {
    if (item.url === path) {
      return item;
    }
    if (item.items?.length) {
      const found = findNavItem(item.items, path);
      if (found) return found;
    }
  }
  return undefined;
}
