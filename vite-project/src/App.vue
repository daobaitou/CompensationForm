<template>
  <div class="app-container">
    <!-- 左侧菜单 -->
    <div class="sidebar">
      <div v-for="(tab, index) in tabs" :key="index" class="menu-group">
        <router-link v-if="tab.path && !tab.children" :to="tab.path" class="menu-item menu-title">
          {{ tab.title }}
        </router-link>
        <h3 v-else class="menu-title">{{ tab.title }}</h3>
        <router-link v-for="item in tab.children" :key="item.path" :to="item.path" class="menu-item">
          {{ item.title }}
        </router-link>
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
  {
    title: '投诉',
    path: '',
    children: [
      { path: '/compensation/Complaint', title: '投诉' }
    ]
  },
  {
    title: '未处理订单/投诉',
    path: '',
    children: [
      { path: '/compensation/basic', title: '未处理订单/投诉' }
    ]
  },
  {
    title: '已处理订单/投诉',
    path: '',
    children: [
      { path: '/statistics/daily', title: '需赔付订单' },
      { path: '/statistics/monthly', title: '无需赔付订单' }
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
  padding: 20px;
}

.menu-group {
  margin-bottom: 20px;
}

.menu-group h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 10px;
}

.menu-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  margin-bottom: 10px;
  text-decoration: none;
  display: block;
}

.menu-title:hover {
  background-color: #ecf5ff;
  color: #409EFF;
}

.menu-item {
  display: block;
  padding: 10px;
  color: #606266;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s;
  margin-left: 10px;
}

.menu-item:hover {
  background-color: #ecf5ff;
  color: #409EFF;
}

.content {
  flex: 1;
  padding: 20px;
}
</style>
