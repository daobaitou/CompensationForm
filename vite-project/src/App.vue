<template>
  <div class="app-container">
    <!-- 左侧菜单 -->
    <div class="sidebar">
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
const tabs = [
  // 投诉订单：直接作为一级菜单
  { path: '/compensation/Complaint', title: '投诉订单' },
  
  // 待判责订单：直接作为一级菜单
  { path: '/compensation/basic', title: '待判责订单' },
  
  // 待审核订单：有 children
  {
    title: '待审核订单',
    path: '', // 路径为空，点击不跳转
    children: [
      { path: '/compensation/need-compensation', title: '需赔付订单' },
      { path: '/compensation/no-compensation', title: '无需赔付订单' }
    ]
  },
  
  // 待赔付订单：直接作为一级菜单
  { path: '/compensation/confirmed-payment', title: '待赔付订单' },
  
  {
    title: '已完成订单',
    path: '', // 路径为空，点击不跳转
    children: [
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
  transition: all 0.3s;
  margin-bottom: 10px;
  cursor: pointer;
}

/* 有子菜单的标题特殊样式 */
.menu-title.has-children {
  cursor: default;
  background-color: transparent;
}

/* 悬停效果 */
.menu-title:hover {
  background-color: #e1e4e8;
}

/* 子菜单容器 */
.sub-menu {
  padding-left: 10px;
  border-left: 2px solid #dcdfe6;
  margin-left: 5px;
}

/* 子菜单项样式 */
.menu-item {
  display: block;
  padding: 8px 10px;
  color: #606266;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
  margin-bottom: 5px;
  font-size: 14px;
}

.menu-item:hover,
.menu-item.router-link-exact-active {
  background-color: #e1e4e8;
  color: #303133;
}

.content {
  flex: 1;
  padding: 20px;
  background-color: #f0f2f5;
}
</style>