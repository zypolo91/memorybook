#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印信息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查当前分支
check_branch() {
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "master" ]; then
        print_warning "当前分支不是 main/master，当前分支：$current_branch"
        read -p "是否继续发布？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "发布已取消"
            exit 1
        fi
    fi
}

# 检查工作区状态
check_working_directory() {
    if ! git diff-index --quiet HEAD --; then
        print_error "工作区有未提交的更改，请先提交或暂存"
        git status --porcelain
        exit 1
    fi
}

# 检查是否有远程仓库
check_remote() {
    if ! git remote get-url origin > /dev/null 2>&1; then
        print_error "没有设置远程仓库 origin"
        exit 1
    fi
}

# 同步远程仓库
sync_remote() {
    print_info "同步远程仓库..."
    git fetch origin
    
    local current_branch=$(git rev-parse --abbrev-ref HEAD)
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/$current_branch)
    
    if [ "$local_commit" != "$remote_commit" ]; then
        print_warning "本地和远程不同步"
        read -p "是否先拉取远程更新？(Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git pull origin $current_branch
        fi
    fi
}

# 运行测试和检查
run_checks() {
    print_info "运行代码检查..."
    
    # 运行 lint
    if ! npm run lint; then
        print_error "Lint 检查失败"
        exit 1
    fi
    
    # 运行构建测试
    print_info "测试构建..."
    if ! npm run build; then
        print_error "构建失败"
        exit 1
    fi
    
    print_success "所有检查通过"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  patch    发布补丁版本 (x.x.X)"
    echo "  minor    发布次要版本 (x.X.x)"
    echo "  major    发布主要版本 (X.x.x)"
    echo "  pre      发布预发布版本"
    echo "  first    首次发布"
    echo "  --help   显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 patch   # 发布 0.1.0 -> 0.1.1"
    echo "  $0 minor   # 发布 0.1.0 -> 0.2.0"
    echo "  $0 major   # 发布 0.1.0 -> 1.0.0"
}

# 主函数
main() {
    local release_type="$1"
    
    # 显示帮助
    if [ "$release_type" = "--help" ] || [ "$release_type" = "-h" ]; then
        show_help
        exit 0
    fi
    
    # 如果没有参数，询问发布类型
    if [ -z "$release_type" ]; then
        echo "请选择发布类型："
        echo "1) patch  - 补丁版本 (bug 修复)"
        echo "2) minor  - 次要版本 (新功能)"
        echo "3) major  - 主要版本 (重大更改)"
        echo "4) pre    - 预发布版本"
        read -p "请输入选择 (1-4): " -n 1 -r choice
        echo
        
        case $choice in
            1) release_type="patch" ;;
            2) release_type="minor" ;;
            3) release_type="major" ;;
            4) release_type="pre" ;;
            *) 
                print_error "无效选择"
                exit 1
                ;;
        esac
    fi
    
    # 验证发布类型
    case $release_type in
        patch|minor|major|pre|first)
            ;;
        *)
            print_error "无效的发布类型: $release_type"
            show_help
            exit 1
            ;;
    esac
    
    print_info "开始 $release_type 版本发布流程..."
    
    # 执行检查
    check_branch
    check_working_directory
    check_remote
    sync_remote
    run_checks
    
    # 执行发布
    print_info "执行版本发布..."
    case $release_type in
        patch)
            npm run release:patch
            ;;
        minor)
            npm run release:minor
            ;;
        major)
            npm run release:major
            ;;
        pre)
            npm run release:pre
            ;;
        first)
            npm run release:first
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "版本发布成功！"
        
        # 获取新版本号
        local new_version=$(cat package.json | grep '"version"' | sed 's/.*"version": "\(.*\)".*/\1/')
        print_info "新版本: v$new_version"
        
        # 询问是否推送到远程
        read -p "是否推送到远程仓库？(Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            npm run postrelease
            print_success "已推送到远程仓库"
            print_info "GitHub Release: https://github.com/guizimo/n-admin/releases/tag/v$new_version"
        else
            print_warning "请记得手动推送: git push --follow-tags origin main"
        fi
    else
        print_error "版本发布失败"
        exit 1
    fi
}

# 执行主函数
main "$@" 