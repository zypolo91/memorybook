import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

// 全局标志，确保只在应用启动时初始化一次
let hasTriggeredGlobalInit = false;

// 重置全局初始化标志（用于登录成功后）
export function resetGlobalInitFlag() {
  hasTriggeredGlobalInit = false;
}

export function useAuth() {
  const { session, loading, isInitialized, triggerGlobalInitialization } =
    useAuthStore();

  useEffect(() => {
    // 页面刷新时，模块级标志重置，但需要重新初始化
    // 或者是第一次调用 useAuth
    // 或者是登录成功后重置了标志位
    if (!hasTriggeredGlobalInit) {
      hasTriggeredGlobalInit = true;
      triggerGlobalInitialization();
    }
  }, [triggerGlobalInitialization]);

  return {
    session,
    loading,
    isAuthenticated: !!session?.user,
    hasHydrated: isInitialized // 使用 isInitialized 作为水合状态
  };
}
