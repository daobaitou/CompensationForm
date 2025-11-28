<template>
  <div class="login-layout">
    <router-view></router-view>
  </div>
</template>

<script setup>
// 这是一个空的布局组件，专门用于登录页面
// 它不会包含侧边栏或其他主应用UI元素
</script>

<style scoped>
.login-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>