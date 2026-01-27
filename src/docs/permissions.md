# 权限系统使用文档

## 概览

本项目实现了基于角色的权限控制系统(RBAC)，支持前端和后端的权限验证。

## 权限结构

权限采用树形结构，支持父子权限关系：

```
账号管理 (system)
├── 用户管理 (system.user)
│   ├── 查看用户 (system.user.read)
│   ├── 新增用户 (system.user.create)
│   ├── 编辑用户 (system.user.update)
│   └── 删除用户 (system.user.delete)
├── 角色管理 (system.role)
│   ├── 查看角色 (system.role.read)
│   ├── 新增角色 (system.role.create)
│   ├── 编辑角色 (system.role.update)
│   ├── 删除角色 (system.role.delete)
│   └── 分配权限 (system.role.assign)
└── 权限管理 (system.permission)
    ├── 查看权限 (system.permission.read)
    ├── 新增权限 (system.permission.create)
    ├── 编辑权限 (system.permission.update)
    └── 删除权限 (system.permission.delete)
```

## 使用方法

### 1. 客户端权限保护

#### 使用 PermissionGuard 组件

```tsx
import { PermissionGuard } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';

function UserManagementPage() {
  return (
    <PermissionGuard permissions={PERMISSIONS.USER.READ}>
      <div>用户管理页面内容</div>
    </PermissionGuard>
  );
}
```

#### 使用高阶组件

```tsx
import { withPermission } from '@/components/auth/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';

const UserManagementPage = withPermission(
  () => <div>用户管理页面内容</div>,
  PERMISSIONS.USER.READ
);
```

#### 多权限检查

```tsx
// 需要任意一个权限
<PermissionGuard
  permissions={[PERMISSIONS.USER.READ, PERMISSIONS.USER.CREATE]}
  requireAll={false}
>
  <div>内容</div>
</PermissionGuard>

// 需要所有权限
<PermissionGuard
  permissions={[PERMISSIONS.USER.READ, PERMISSIONS.USER.UPDATE]}
  requireAll={true}
>
  <div>内容</div>
</PermissionGuard>
```

### 2. 服务端权限保护

#### 使用 ServerPermissionGuard 组件

```tsx
import { ServerPermissionGuard } from '@/components/auth/server-permission-guard';
import { PERMISSIONS } from '@/lib/permissions';

export default async function UserPage() {
  return (
    <ServerPermissionGuard permissions={PERMISSIONS.USER.READ}>
      <div>用户管理页面</div>
    </ServerPermissionGuard>
  );
}
```

#### 使用权限检查函数

```tsx
import { checkPagePermission } from '@/components/auth/server-permission-guard';
import { PERMISSIONS } from '@/lib/permissions';

export default async function UserPage() {
  const hasPermission = await checkPagePermission(PERMISSIONS.USER.READ);

  if (!hasPermission) {
    return <div>无权限访问</div>;
  }

  return <div>用户管理页面</div>;
}
```

### 3. API 权限检查

```typescript
import { hasPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/permissions';

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const canUpdate = await hasPermission(
    PERMISSIONS.USER.UPDATE,
    session.user.id
  );

  if (!canUpdate) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  // 处理更新逻辑
}
```

## 权限常量

使用预定义的权限常量确保一致性：

```typescript
import { PERMISSIONS } from '@/lib/permissions';

// 用户管理权限
PERMISSIONS.USER.READ; // 'system.user.read'
PERMISSIONS.USER.CREATE; // 'system.user.create'
PERMISSIONS.USER.UPDATE; // 'system.user.update'
PERMISSIONS.USER.DELETE; // 'system.user.delete'

// 角色管理权限
PERMISSIONS.ROLE.READ; // 'system.role.read'
PERMISSIONS.ROLE.CREATE; // 'system.role.create'
PERMISSIONS.ROLE.UPDATE; // 'system.role.update'
PERMISSIONS.ROLE.DELETE; // 'system.role.delete'
PERMISSIONS.ROLE.ASSIGN; // 'system.role.assign'

// 权限管理权限
PERMISSIONS.PERMISSION.READ; // 'system.permission.read'
PERMISSIONS.PERMISSION.CREATE; // 'system.permission.create'
PERMISSIONS.PERMISSION.UPDATE; // 'system.permission.update'
PERMISSIONS.PERMISSION.DELETE; // 'system.permission.delete'
```

## 超级管理员

标记为 `isSuperAdmin` 的用户拥有所有权限，会自动通过所有权限检查。

## 权限缓存

用户权限在客户端会被缓存，避免重复请求。当权限变更时需要刷新页面或重新登录。

## 错误处理

- 未登录：自动跳转到登录页面
- 无权限：显示权限不足的提示页面
- 权限检查失败：返回 false，确保安全
