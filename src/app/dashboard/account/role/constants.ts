interface FilterField {
  key: string;
  type: string;
  label: string;
  placeholder: string;
  width: string;
}

/**
 * 默认分页配置
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
} as const;

/**
 * 分页大小选项
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

/**
 * 默认筛选条件
 */
export const DEFAULT_FILTERS = {
  name: '',
  status: 'all',
  dateRange: undefined,
  page: 1,
  limit: 10
} as const;

/**
 * 筛选字段配置
 */
export const FILTER_FIELDS: FilterField[] = [
  {
    key: 'name',
    type: 'text',
    label: '角色名称',
    placeholder: '搜索角色名称...',
    width: 'w-80'
  },
  {
    key: 'description',
    type: 'text',
    label: '角色描述',
    placeholder: '搜索角色描述...',
    width: 'w-60'
  }
];

/**
 * 角色状态选项
 */
export const ROLE_STATUS_OPTIONS = [
  { label: '全部角色', value: 'all' },
  { label: '普通角色', value: 'normal' },
  { label: '超级管理员', value: 'super' }
] as const;

/**
 * 表格列配置
 */
export const TABLE_COLUMNS = [
  {
    key: 'index',
    title: 'ID',
    className: 'text-center w-[60px] font-mono text-sm font-medium'
  },
  {
    key: 'name',
    title: '角色名称',
    className: 'font-medium'
  },
  {
    key: 'description',
    title: '描述',
    className: 'text-muted-foreground'
  },
  {
    key: 'userCount',
    title: '用户数量',
    className: 'text-center w-[100px]'
  },
  {
    key: 'createdAt',
    title: '创建时间',
    className: 'font-medium w-[140px]'
  },
  {
    key: 'actions',
    title: '操作',
    className: 'text-center w-[140px]'
  }
] as const;

/**
 * 对话框类型
 */
export const DIALOG_TYPES = {
  CREATE: 'create',
  EDIT: 'edit',
  PERMISSION: 'permission'
} as const;

/**
 * 消息文案
 */
export const MESSAGES = {
  SUCCESS: {
    CREATE: '角色创建成功',
    UPDATE: '角色更新成功',
    DELETE: '角色删除成功',
    ASSIGN_PERMISSIONS: '权限分配成功'
  },
  ERROR: {
    CREATE: '创建角色失败',
    UPDATE: '更新角色失败',
    DELETE: '删除角色失败',
    FETCH_ROLES: '获取角色列表失败',
    FETCH_PERMISSIONS: '获取权限列表失败',
    ASSIGN_PERMISSIONS: '权限分配失败'
  },
  EMPTY: {
    ROLES: '暂无角色数据',
    DESCRIPTION: '暂无描述',
    PERMISSIONS: '暂无权限数据'
  },
  CONFIRM: {
    DELETE: (name: string) => `确定要删除角色 "${name}" 吗？此操作不可撤销。`
  },
  INFO: {
    SUPER_ADMIN_PROTECTED:
      '超级管理员角色受系统保护，不能进行编辑、权限分配或删除操作'
  }
} as const;
