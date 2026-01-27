# Git 提交规范和版本管理指南

## 📋 提交信息规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来标准化提交信息。

### 🎯 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 📝 Type 类型

| 类型       | 描述     | 示例                               |
| ---------- | -------- | ---------------------------------- |
| `feat`     | 新功能   | `feat(auth): 添加用户登录功能`     |
| `fix`      | Bug 修复 | `fix(dashboard): 修复数据加载错误` |
| `docs`     | 文档更新 | `docs: 更新 README 安装说明`       |
| `style`    | 代码格式 | `style: 修复代码缩进问题`          |
| `refactor` | 代码重构 | `refactor(api): 重构用户接口`      |
| `perf`     | 性能优化 | `perf: 优化图片加载速度`           |
| `test`     | 测试相关 | `test: 添加用户登录测试`           |
| `build`    | 构建系统 | `build: 更新依赖版本`              |
| `ci`       | CI/CD    | `ci: 添加自动部署配置`             |
| `chore`    | 其他修改 | `chore: 更新 gitignore`            |
| `revert`   | 撤销提交 | `revert: 撤销用户功能更改`         |

### 🎯 Scope 作用域 (可选)

常用的作用域包括：

- `auth` - 认证相关
- `dashboard` - 仪表板
- `components` - 组件
- `api` - API 接口
- `ui` - 用户界面
- `db` - 数据库
- `config` - 配置

### 📖 Subject 主题

- 使用祈使句，现在时态
- 首字母小写
- 不要以句号结尾
- 限制在 50 个字符以内

### 📄 Body 正文 (可选)

- 使用祈使句，现在时态
- 解释更改的内容和原因
- 每行限制在 72 个字符以内
- 可以包含多个段落

### 🔗 Footer 页脚 (可选)

- 包含 BREAKING CHANGE 信息
- 引用相关的 issue 或 PR
- 例如：`Closes #123` 或 `BREAKING CHANGE: API 接口已更改`

## 🛠️ 使用工具

### 1. 交互式提交 (推荐)

使用 commitizen 进行交互式提交：

```bash
# 使用交互式界面提交
pnpm commit

# 或者使用 npx
npx git-cz
```

### 2. 手动提交

如果你熟悉规范，也可以手动提交：

```bash
git add .
git commit -m "feat(auth): 添加用户登录功能"
```

### 3. 使用提交模板

我们提供了提交信息模板：

```bash
git commit
# 这将打开编辑器，显示提交模板
```

## 🏷️ 版本管理

### 语义化版本控制

我们使用 [Semantic Versioning](https://semver.org/) 进行版本控制：

- **MAJOR** (主版本号): 不兼容的 API 修改
- **MINOR** (次版本号): 向下兼容的功能性新增
- **PATCH** (修订号): 向下兼容的问题修正

### 自动化发布

#### 使用脚本发布 (推荐)

```bash
# 交互式发布 - 会询问发布类型
./scripts/release.sh

# 或者直接指定类型
./scripts/release.sh patch   # 0.1.0 -> 0.1.1
./scripts/release.sh minor   # 0.1.0 -> 0.2.0
./scripts/release.sh major   # 0.1.0 -> 1.0.0
./scripts/release.sh pre     # 预发布版本
```

#### 使用 npm 脚本

```bash
# 自动判断版本类型（基于提交信息）
pnpm release

# 指定版本类型
pnpm release:patch
pnpm release:minor
pnpm release:major
pnpm release:pre

# 首次发布
pnpm release:first
```

### 发布流程

1. **代码检查**: 运行 lint 和构建测试
2. **生成版本**: 基于提交信息自动确定版本号
3. **更新文件**: 更新 `package.json` 和 `CHANGELOG.md`
4. **创建提交**: 创建版本发布提交
5. **创建标签**: 创建 Git 标签
6. **推送远程**: 推送代码和标签到远程仓库

### 版本信息查看

```bash
# 查看当前版本
cat package.json | grep version

# 查看所有标签
git tag

# 查看标签详情
git show v0.1.0
```

## 📚 最佳实践

### ✅ 好的提交信息

```bash
feat(auth): 添加 OAuth 登录功能

集成 Google 和 GitHub OAuth 登录
- 添加 OAuth 配置
- 创建登录回调处理
- 更新用户界面

Closes #123
```

```bash
fix(dashboard): 修复数据刷新问题

修复仪表板数据不自动刷新的问题
当用户更新数据后，界面现在会自动重新加载

Fixes #456
```

### ❌ 不好的提交信息

```bash
# 太模糊
fix: bug

# 没有遵循规范
Fix the login bug

# 太长
feat: add a new feature that allows users to login with their email and password and also remember their session
```

### 💡 提示

1. **原子性提交**: 每次提交只做一件事
2. **频繁提交**: 小步快跑，经常提交
3. **清晰描述**: 让别人（和未来的自己）能理解你做了什么
4. **关联 Issue**: 在提交信息中引用相关的 issue
5. **避免大文件**: 不要提交大的二进制文件

## 🔧 配置检查

确保你的环境配置正确：

```bash
# 检查 commitlint 配置
npx commitlint --from HEAD~1 --to HEAD --verbose

# 检查 husky hooks
ls -la .husky/

# 测试提交信息格式
echo "feat: test message" | npx commitlint
```

## 🆘 常见问题

### Q: 提交被拒绝，提示格式错误？

A: 检查你的提交信息是否符合规范格式，使用 `pnpm commit` 进行交互式提交。

### Q: 如何修改最后一次提交信息？

A: 使用 `git commit --amend` 修改最后一次提交。

### Q: 版本发布失败？

A: 检查：

1. 工作区是否干净（无未提交更改）
2. 是否在正确的分支上
3. 是否有权限推送到远程仓库

### Q: 如何撤销版本发布？

A: 如果还未推送到远程：

```bash
git reset --hard HEAD~1
git tag -d v1.0.0
```

如果已推送到远程，需要谨慎操作，建议发布新版本修复。

## 📋 检查清单

发布前确认：

- [ ] 所有测试通过
- [ ] 代码已经过 review
- [ ] 更新日志已完善
- [ ] 版本号符合语义化规范
- [ ] 发布说明准备就绪

---

遵循这些规范可以让我们的项目更加规范化，便于维护和协作。如有疑问，请查阅相关文档或询问团队成员。
