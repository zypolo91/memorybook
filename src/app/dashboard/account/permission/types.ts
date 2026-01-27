export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PermissionFilters {
  name?: string;
  code?: string;
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

export interface PermissionFormData {
  name: string;
  code: string;
  description?: string;
}

export interface PermissionManagementState {
  permissions: Permission[];
  loading: boolean;
  pagination: PaginationInfo;
  filters: PermissionFilters;
}

export interface PermissionManagementActions {
  fetchPermissions: (filters: PermissionFilters) => Promise<void>;
  createPermission: (data: PermissionFormData) => Promise<boolean>;
  updatePermission: (id: number, data: PermissionFormData) => Promise<boolean>;
  deletePermission: (id: number) => Promise<boolean>;
  updateFilters: (newFilters: Partial<PermissionFilters>) => void;
  clearFilters: () => void;
}

export type PermissionDialogType = 'create' | 'edit' | null;

export interface PermissionDialogState {
  type: PermissionDialogType;
  permission: Permission | null;
  open: boolean;
}
