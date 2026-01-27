export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  userCount?: number;
  isSuper?: boolean;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  sortOrder?: number;
  children?: Permission[];
}

export interface RoleFilters {
  name?: string;
  status?: 'all' | 'normal' | 'super';
  dateRange?: { from: Date; to: Date } | undefined;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RoleFormData {
  name: string;
  description?: string;
  isSuper?: boolean;
}

export interface RoleManagementState {
  roles: Role[];
  loading: boolean;
  pagination: PaginationInfo;
  filters: RoleFilters;
}

export interface RoleManagementActions {
  fetchRoles: (filters: RoleFilters) => Promise<void>;
  createRole: (data: RoleFormData) => Promise<boolean>;
  updateRole: (id: number, data: RoleFormData) => Promise<boolean>;
  deleteRole: (id: number) => Promise<boolean>;
  updateFilters: (newFilters: Partial<RoleFilters>) => void;
  clearFilters: () => void;
}

export type RoleDialogType = 'create' | 'edit' | 'permission' | null;

export interface RoleDialogState {
  type: RoleDialogType;
  role: Role | null;
  open: boolean;
}

export interface PermissionDialogState {
  open: boolean;
  role: Role | null;
  permissions: Permission[];
  selectedPermissions: number[];
}
