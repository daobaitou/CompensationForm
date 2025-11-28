<template>
  <div class="app-container">
    <!-- 左侧菜单（除了登录页都显示）-->
    <div v-if="!isLoginPage" class="sidebar">
      <div class="user-info"v-if="authStore.user">
        <div class="username">{{ authStore.user?.username }}</div>
        <el-button 
          type="danger" 
          size="small" 
          @click="handleLogout"
          class="logout-btn"
        >
          登出
        </el-button>
      </div>

      <div v-for="(tab, index) in tabs" :key="index" class="menu-group">
        
        <!-- 
          统一使用 router-link 作为一级菜单标题
          通过 has-children 类来区分是否有子菜单
        -->
        <router-link 
          :to="tab.path || '#'" 
          class="menu-title"
          :class="{ 'has-children': tab.children && tab.children.length > 0 }"
        >
          {{ tab.title }}
        </router-link>

        <!-- 子菜单，只有当存在 children 时才渲染 -->
        <div v-if="tab.children && tab.children.length > 0" class="sub-menu">
          <router-link 
            v-for="item in tab.children" 
            :key="item.path" 
            :to="item.path" 
            class="menu-item"
          >
            {{ item.title }}
          </router-link>
        </div>

      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { computed ,ref, onBeforeUnmount} from 'vue'
import { useRouter, useRoute} from 'vue-router'
import { useAuthStore } from './stores/auth'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 判断是否为登录页面
const isLoginPage = computed(() => route.path === '/login')

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要登出吗？', '确认登出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await authStore.logout()
    ElMessage.success('登出成功')
    router.push('/login')
  } catch (error) {
    if (error === 'cancel') {
      // 用户取消登出
      return
    }
    ElMessage.error('登出失败')
  }
}


const tabs = [
  // 投诉订单：直接作为一级菜单
  { path: '/compensation/Complaint', title: '投诉订单' },
  
  // 待判责订单：直接作为一级菜单
  { path: '/compensation/basic', title: '待判责订单' },
  
  // 待审核订单：有 children 和一个总的页面
  {
    title: '待审核订单',
    path: '/compensation/pending-review', 
    children: [
      // { path: '/compensation/pending-review', title: '全部待审核订单' },
      { path: '/compensation/need-compensation', title: '需赔付订单' },
      { path: '/compensation/no-compensation', title: '无需赔付订单' }
    ]
  },
  
  // 待赔付订单：直接作为一级菜单
  { path: '/compensation/confirmed-payment', title: '待赔付订单' },
  
  // 已完成订单：有 children 和一个总的页面
  {
    title: '已完成订单',
    path: '/compensation/completed', // 路径为空，点击不跳转
    children: [
      // { path: '/compensation/completed', title: '全部已完成订单' },
      { path: '/compensation/compensated', title: '已赔付订单' },
      { path: '/compensation/confirmed-no-compensation', title: '无需赔付订单' }
    ]
  }
]
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 200px;
  background-color: #f5f7fa;
  padding: 20px 0; /* 上下内边距，左右为0 */
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 15px 20px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 15px;
}

.username {
  font-weight: bold;
  color: #303133;
}

.logout-btn {
  min-width: auto;
}

.menu-group {
  margin-bottom: 20px;
  padding: 0 20px; /* 左右内边距，控制整体缩进 */
}

/* 
  统一的一级菜单标题样式
  所有一级标题都应用这些基础样式
*/
.menu-title {
  display: block;
  padding: 10px;
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-bottom: 10px;
  cursor: pointer;
}

/* 有子菜单的标题特殊样式 */
.menu-title.has-children {
  cursor: default;
  background-color: transparent;
}

/* 悬停效果 */
.menu-title:hover:not(.has-children) {
  background-color: #e1e5eb;
}

/* 子菜单容器 */
.sub-menu {
  margin-top: 5px;
  padding-left: 10px;
  border-left: 2px solid #dcdfe6;
}

/* 子菜单项样式 */
.menu-item {
  display: block;
  padding: 8px 10px;
  color: #606266;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
  margin-bottom: 5px;
  font-size: 14px;
}

.menu-item:hover,
.menu-item.router-link-exact-active {
  background-color: #e1e5eb;
  color: #409eff;
}

.content {
  flex: 1;
  padding: 20px;
  background-color: #fff;
}

.content.full-width {
  width: 100%;
}
</style>