export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: any;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  // KBar 搜索相关配置
  searchConfig?: {
    keywords?: string; // 搜索关键词
    searchShortcut?: string[]; // KBar 快捷键（单字符）
    searchSection?: string; // KBar 分组
    searchPriority?: number; // 搜索优先级
  };
}
