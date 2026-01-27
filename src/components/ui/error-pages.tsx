import { FileQuestion, Shield, AlertTriangle, ServerCrash } from 'lucide-react';
import { ErrorPage } from './error-page';

interface ErrorPageProps {
  showHomeButton?: boolean;
}

// 404 页面未找到
export function NotFoundErrorPage({ showHomeButton = true }: ErrorPageProps) {
  return (
    <ErrorPage
      errorCode='404'
      icon={FileQuestion}
      iconColor='text-blue-500'
      bgColor='bg-blue-50'
      borderColor='border-blue-200'
      textColor='text-blue-700'
      title='页面未找到'
      description='抱歉，您访问的页面不存在或已被移除'
      helpText='请检查网址是否正确，或者尝试从导航菜单重新访问所需页面。'
      showHomeButton={showHomeButton}
    />
  );
}

// 403 访问受限
export function ForbiddenErrorPage({ showHomeButton = true }: ErrorPageProps) {
  return (
    <ErrorPage
      errorCode='403'
      icon={Shield}
      iconColor='text-red-500'
      bgColor='bg-red-50'
      borderColor='border-red-200'
      textColor='text-red-700'
      title='访问受限'
      description='抱歉，您没有访问此页面的权限'
      helpText='请联系管理员为您分配相应的权限，或返回到有权限访问的页面。'
      showHomeButton={showHomeButton}
    />
  );
}

// 500 服务器错误
export function ServerErrorPage({ showHomeButton = true }: ErrorPageProps) {
  return (
    <ErrorPage
      errorCode='500'
      icon={ServerCrash}
      iconColor='text-orange-500'
      bgColor='bg-orange-50'
      borderColor='border-orange-200'
      textColor='text-orange-700'
      title='服务器错误'
      description='服务器遇到了一个错误，无法完成您的请求'
      helpText='请稍后重试，如果问题持续存在，请联系技术支持。'
      showHomeButton={showHomeButton}
    />
  );
}

// 通用错误页面
export function GenericErrorPage({ showHomeButton = true }: ErrorPageProps) {
  return (
    <ErrorPage
      errorCode='出错了'
      icon={AlertTriangle}
      iconColor='text-yellow-500'
      bgColor='bg-yellow-50'
      borderColor='border-yellow-200'
      textColor='text-yellow-700'
      title='出现了错误'
      description='很抱歉，发生了意外错误'
      helpText='请刷新页面重试，如果问题持续存在，请联系技术支持。'
      showHomeButton={showHomeButton}
    />
  );
}
