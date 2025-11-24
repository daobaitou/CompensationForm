#!/bin/bash 
#补偿表单系统部署脚本 
#作者: Assistant 
#日期: $(date +%Y-%m-%d)

set -e # 遇到错误时停止执行
# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# 错误处理函数
error_exit() {
    log_error "$1"
    exit 1
}

# 检查是否以root权限运行
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "此脚本不应以root权限运行"
        exit 1
    fi
}

# 检查必要命令
check_commands() {
    command -v npm >/dev/null 2>&1 || error_exit "npm未安装"
    command -v systemctl >/dev/null 2>&1 || error_exit "systemctl未安装"
    command -v nginx >/dev/null 2>&1 || error_exit "nginx未安装"
}

# 构建前端项目
build_frontend() {
    log "开始构建前端项目..."
    
    local frontend_path="/home/admin/CompensationForm/vite-project"
    
    if [[ ! -d "$frontend_path" ]]; then
        error_exit "前端项目目录不存在: $frontend_path"
    fi
    
    cd "$frontend_path" || error_exit "无法进入前端项目目录"
    
    # 检查package.json
    if [[ ! -f "package.json" ]]; then
        error_exit "package.json文件不存在"
    fi
    
    # 设置正确的目录权限
    log "设置项目目录权限..."
    if ! sudo chown -R $(whoami):$(whoami) "$frontend_path"; then
        log_warn "设置项目目录权限失败"
    fi
    
    # 安装依赖
    log "安装前端依赖..."
    if ! npm install; then
        log_warn "npm install失败，继续尝试构建..."
    fi
    
    # 构建项目
    log "构建前端项目..."
    if ! npm run build; then
        error_exit "前端构建失败"
    fi
    
    log "前端构建完成"
}

# 设置前端文件权限
set_frontend_permissions() {
    log "设置前端文件权限..."
    
    local dist_path="/home/admin/CompensationForm/vite-project/dist"
    
    if [[ ! -d "$dist_path" ]]; then
        error_exit "前端构建目录不存在: $dist_path"
    fi
    
    # 设置权限
    if ! sudo chown -R nginx:nginx "$dist_path"; then
        log_warn "设置nginx用户权限失败，尝试使用www用户..."
        if ! sudo chown -R www-data:www-data "$dist_path"; then
            log_warn "设置www-data用户权限也失败"
        fi
    fi
    
    if ! sudo chmod -R 755 "$dist_path"; then
        log_warn "设置文件权限失败"
    fi
    
    log "前端文件权限设置完成"
}

# 重启后端服务
restart_backend() {
    log "重启后端服务..."
    
    # 检查服务是否存在
    if ! systemctl list-units --full -all | grep -q "compensation-form.service"; then
        log_warn "后端服务 compensation-form 未找到"
        return 0
    fi
    
    # 重启服务
    if ! sudo systemctl restart compensation-form; then
        error_exit "重启后端服务失败"
    fi
    
    # 等待服务启动
    sleep 3
    
    # 检查服务状态
    if systemctl is-active --quiet compensation-form; then
        log "后端服务重启成功"
    else
        log_warn "后端服务可能未正常运行，请检查服务状态"
    fi
}

# 重启Nginx
restart_nginx() {
    log "重启Nginx..."
    
    # 测试Nginx配置
    log "测试Nginx配置..."
    if ! sudo nginx -t; then
        error_exit "Nginx配置测试失败"
    fi
    
    # 重启Nginx
    if ! sudo systemctl restart nginx; then
        error_exit "重启Nginx失败"
    fi
    
    # 检查Nginx状态
    if systemctl is-active --quiet nginx; then
        log "Nginx重启成功"
    else
        error_exit "Nginx可能未正常运行"
    fi
}

# 测试部署
test_deployment() {
    log "测试部署..."
    
    # 测试前端
    log "测试前端访问..."
    if curl -s http://localhost/ | grep -q "<html"; then
        log "前端访问测试通过"
    else
        log_warn "前端访问测试可能失败"
    fi
    
    # 测试API
    log "测试API访问..."
    if curl -s http://localhost:3000/api/orders | grep -q "\["; then
        log "API访问测试通过"
    else
        log_warn "API访问测试可能失败"
    fi
}

# 显示服务状态
show_status() {
    log "显示服务状态..."
    
    echo "==================== 后端服务状态 ===================="
    systemctl status compensation-form --no-pager -l || true
    
    echo "==================== Nginx服务状态 ==================="
    systemctl status nginx --no-pager -l || true
    
    echo "==================== 端口监听状态 ===================="
    sudo netstat -tlnp | grep -E ":(80|3000)" || true
}

# 主函数
main() {
    log "开始执行补偿表单系统部署脚本"
    
    # 检查环境
    check_root
    check_commands
    
    # 执行部署步骤
    build_frontend
    set_frontend_permissions
    restart_backend
    restart_nginx
    test_deployment
    
    log "部署完成！"
    log "请在浏览器中访问 http://8.137.122.136 测试应用"
    
    # 询问是否显示服务状态
    read -p "是否显示服务详细状态？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        show_status
    fi
}

# 显示帮助信息
show_help() {
    echo "补偿表单系统部署脚本"
    echo "用法: $0 [选项]"
    echo "选项:"
    echo "  -h, --help    显示此帮助信息"
    echo "  -v, --verbose 增加输出详细程度"
    echo ""
    echo "此脚本将执行以下操作:"
    echo "  1. 构建前端项目"
    echo "  2. 设置前端文件权限"
    echo "  3. 重启后端服务"
    echo "  4. 重启Nginx服务"
    echo "  5. 测试部署结果"
}

# 解析命令行参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac