export interface User {
  id: number;
  username: string;
  email: string;
  roleId: string;
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'disabled';
  isSuperAdmin?: boolean;
  role?: {
    id: number;
    name: string;
  };
}

export interface Role {
  id: number;
  name: string;
}

export interface UserFilters {
  username?: string;
  email?: string;
  roleId?: string;
  status?: 'all' | 'active' | 'disabled';
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

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  roleId: string;
  status?: 'active' | 'disabled';
}

export interface UserManagementState {
  users: User[];
  roles: Role[];
  loading: boolean;
  pagination: PaginationInfo;
  filters: UserFilters;
}

export interface UserManagementActions {
  fetchUsers: (filters: UserFilters) => Promise<void>;
  fetchRoles: () => Promise<void>;
  createUser: (data: UserFormData) => Promise<boolean>;
  updateUser: (id: number, data: UserFormData) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  updateFilters: (newFilters: Partial<UserFilters>) => void;
  clearFilters: () => void;
}

export type UserDialogType = 'create' | 'edit' | null;

export interface UserDialogState {
  type: UserDialogType;
  user: User | null;
  open: boolean;
}
