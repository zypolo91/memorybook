import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthAPI } from '@/service/request';

interface User {
  id: number;
  email: string;
  username?: string;
  name?: string;
}

interface Session {
  user: User | null;
}

interface AuthState {
  // 状态
  session: Session | null;
  permissions: string[];
  loading: boolean;
  permissionsLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initializeAuth: () => Promise<void>;
  fetchSession: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  resetFlags: (forceReset?: boolean) => void;
  triggerGlobalInitialization: () => Promise<void>;
  forceReInitialize: () => Promise<void>;
  logout: () => void;

  // 权限检查方法
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

let isSessionFetching = false;
let isPermissionsFetching = false;
let hasEverInitialized = false; // 全局标志，记录是否已经初始化过
let hasGloballyHydrated = false; // 全局水合状态

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      session: null,
      permissions: [],
      loading: false,
      permissionsLoading: false,
      error: null,
      isInitialized: false,

      // 初始化认证状态（页面加载时调用）
      initializeAuth: async () => {
        const state = get();

        if (state.isInitialized || hasEverInitialized) {
          return;
        }

        set({ loading: true, isInitialized: true });
        hasEverInitialized = true;

        try {
          // 重新验证 session 有效性
          await get().fetchSession();
          // 获取最新的权限信息
          await get().fetchPermissions();
        } catch (error) {
          console.error('初始化认证失败:', error);
          set({ error: '初始化失败' });
          // 如果初始化失败，重置标志位允许重试
          hasEverInitialized = false;
        } finally {
          set({ loading: false });
        }
      },

      // 获取会话信息
      fetchSession: async () => {
        if (isSessionFetching) return;

        isSessionFetching = true;
        set({ loading: true, error: null });

        try {
          const response = await AuthAPI.getSession();

          if (response.code === 0) {
            set({ session: response.data, error: null });
          } else {
            set({ session: null, error: response.message });
          }
        } catch (error) {
          console.error('获取会话失败:', error);
          set({ session: null, error: '获取会话失败' });
        } finally {
          set({ loading: false });
          isSessionFetching = false;
        }
      },

      // 获取权限信息
      fetchPermissions: async () => {
        if (isPermissionsFetching) return;

        const state = get();

        // 如果没有用户登录，清空权限
        if (!state.session?.user) {
          set({ permissions: [], permissionsLoading: false });
          return;
        }

        isPermissionsFetching = true;
        set({ permissionsLoading: true, error: null });

        try {
          const response = await AuthAPI.getPermissions();

          if (response.code === 0) {
            set({ permissions: response.data || [], error: null });
          } else {
            set({ permissions: [], error: response.message });
          }
        } catch (error) {
          console.error('获取权限失败:', error);
          set({ permissions: [], error: '获取权限失败' });
        } finally {
          set({ permissionsLoading: false });
          isPermissionsFetching = false;
        }
      },

      // 重置请求标志位（仅在页面刷新时重置初始化状态）
      resetFlags: (forceReset = false) => {
        isSessionFetching = false;
        isPermissionsFetching = false;
        // 只在强制重置时（页面刷新）才重置初始化状态
        if (forceReset) {
          set({ isInitialized: false });
          hasEverInitialized = false; // 重置全局标志
          hasGloballyHydrated = false; // 重置全局水合状态
        }
      },

      // 全局初始化入口（只调用一次）
      triggerGlobalInitialization: async () => {
        if (hasGloballyHydrated) return;

        // 手动触发水合
        useAuthStore.persist.rehydrate();
        hasGloballyHydrated = true;

        // 重置标志位并开始初始化
        get().resetFlags(true);
        await get().initializeAuth();
      },

      // 强制重新初始化（用于登录成功后）
      forceReInitialize: async () => {
        // 重置所有标志位
        hasGloballyHydrated = false;
        hasEverInitialized = false;
        set({ isInitialized: false });

        // 重新初始化
        await get().triggerGlobalInitialization();
      },

      // 退出登录
      logout: () => {
        set({
          session: null,
          permissions: [],
          loading: false,
          permissionsLoading: false,
          error: null,
          isInitialized: false
        });
        isSessionFetching = false;
        isPermissionsFetching = false;
        hasEverInitialized = false; // 重置全局标志，允许重新登录后初始化
        hasGloballyHydrated = false; // 重置全局水合状态
      },

      // 权限检查方法
      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      hasAnyPermission: (permissions: string[]) => {
        const { permissions: userPermissions } = get();
        return permissions.some((perm) => userPermissions.includes(perm));
      },

      hasAllPermissions: (permissions: string[]) => {
        const { permissions: userPermissions } = get();
        return permissions.every((perm) => userPermissions.includes(perm));
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // 只持久化核心数据，避免临时状态
      partialize: (state) => ({
        session: state.session,
        permissions: state.permissions
        // 不持久化 isInitialized，确保每次刷新都会重新初始化
      }),
      // 重要：跳过服务端渲染的水合
      skipHydration: true
    }
  )
);
