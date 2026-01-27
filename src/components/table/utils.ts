import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期时间 - 显示年月日时分秒
 * @param dateString 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
}

/**
 * 格式化日期 - 仅显示年月日
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd', { locale: zhCN });
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
}

/**
 * 检查是否有活跃的筛选条件
 * @param values 筛选值对象
 * @returns 是否有活跃筛选
 */
export function hasActiveFilters(values: Record<string, any>): boolean {
  return Object.values(values).some(
    (value) =>
      value && value !== '' && !(Array.isArray(value) && value.length === 0)
  );
}
