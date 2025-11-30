<template>
  <div class="login-page">
    <div class="login-wrapper">
      <div class="login-container">
        <!-- 左侧品牌宣传区 -->
        <div class="left-panel">
          <div class="brand-content">
            <div class="logo-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h1 class="system-title">售后管理系统</h1>
            <p class="system-description">高效、便捷的售后处理平台</p>
            
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">📊</div>
                <div class="feature-text">数据统计与分析</div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📋</div>
                <div class="feature-text">订单全流程管理</div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🔒</div>
                <div class="feature-text">安全可靠的权限控制</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧登录表单区 -->
        <div class="right-panel">
          <div class="form-wrapper">
            <div class="form-header">
              <h2 class="form-title">欢迎回来</h2>
              <p class="form-subtitle">请登录您的账户</p>
            </div>
            
            <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
              <el-form-item prop="username">
                <el-input 
                  v-model="form.username" 
                  placeholder="请输入用户名"
                  size="large"
                  @keyup.enter="submit"
                  autofocus
                >
                  <template #prefix>
                    <el-icon class="el-input__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item prop="password">
                <el-input 
                  v-model="form.password" 
                  placeholder="请输入密码" 
                  show-password
                  size="large"
                  @keyup.enter="submit"
                >
                  <template #prefix>
                    <el-icon class="el-input__icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item class="form-actions">
                <el-button 
                  round 
                  type="primary" 
                  class="login-button"
                  size="large"
                  @click="submit" 
                  :loading="loading"
                  native-type="submit"
                  block
                >
                  登 录
                </el-button>
              </el-form-item>
            </el-form>
            
            <div class="login-footer">
              
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref,reactive,onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import { ElMessage } from 'element-plus'

  const router = useRouter()
  const formRef = ref(null)
  const authStore = useAuthStore()

  const form = reactive({
      username:"",
      password:""
  })

  const rules = {
      username:[{
          required: true,
          message: '用户名不能为空',
          trigger: 'blur',
      }],
      password:[{
          required: true,
          message: '密码不能为空',
          trigger: 'blur',
      }],
  }

  const loading = ref(false)

  //const store = useStore()
  const submit = () => {
      formRef.value.validate(async (valid) => {
          if(!valid) return false
          loading.value = true

          try {
              console.log('尝试登录，用户名:', form.username);
              await authStore.login(form.username, form.password)
              ElMessage.success("登录成功")
              router.push("/")
          } catch (error) {
              console.error('登录失败详细信息:', error);
              console.log('错误对象:', JSON.stringify(error, null, 2));
              
              // 显示更详细的错误信息
              let errorMessage = "登录失败";
              if (error.response) {
                  // 服务器返回了错误响应
                  console.log('服务器响应状态:', error.response.status);
                  console.log('服务器响应头:', error.response.headers);
                  console.log('服务器响应数据:', error.response.data);
                  errorMessage = error.response.data?.message || `服务器错误 (${error.response.status})`;
              } else if (error.request) {
                  // 请求已发出但没有收到响应
                  console.log('无响应的请求:', error.request);
                  errorMessage = "无法连接到服务器";
              } else {
                  // 其他错误
                  console.log('请求配置错误:', error.message);
                  errorMessage = error.message || "未知错误";
              }
              
              ElMessage.error(errorMessage)
          } finally {
              loading.value = false
          }
      })
  }

  const handleKeyPress = (e) => {
      if (e.key === "Enter") {
          submit(e)
      }
  }
  
  document.addEventListener("keyup",handleKeyPress)
  onBeforeUnmount(()=>document.removeEventListener("keyup",handleKeyPress))

</script>

<style scoped>
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
}

.login-wrapper {
  width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.login-container {
  display: flex;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  margin: 0 auto;
  width: 100%;
  /* max-width: 1000px;  控制最大宽度 */
}

/* 左侧品牌宣传区 */
.left-panel {
  flex: 2;
  background: #409EFF;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.left-panel::before {
  content: "";
  position: absolute;
  top: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.left-panel::after {
  content: "";
  position: absolute;
  bottom: -150px;
  right: -120px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.brand-content {
  max-width: 600px;
  text-align: center;
  z-index: 1;
  width: 100%;
}

.logo-placeholder {
  margin: 0 auto 50px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.system-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 25px;
  letter-spacing: 1.5px;
}

.system-description {
  font-size: 22px;
  opacity: 0.9;
  margin-bottom: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 35px;
  margin-top: 60px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.feature-icon {
  font-size: 36px;
}

.feature-text {
  font-size: 20px;
  text-align: center;
}

/* 右侧登录表单区 */
.right-panel {
  flex: 1;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  /* max-width: 500px; */
  text-align: center;
}

.form-header {
  text-align: center;
  margin-bottom: 50px;
}

.form-title {
  font-size: 36px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.form-subtitle {
  font-size: 20px;
  color: #666;
  margin: 0;
}

.login-form {
  margin: 40px 0;
}

:deep(.el-input__inner) {
  padding-left: 50px;
  height: 62px;
  border-radius: 14px;
  font-size: 18px;
}

:deep(.el-input__prefix) {
  left: 18px;
}

:deep(.el-input__prefix svg) {
  width: 20px;
  height: 20px;
}

:deep(.el-form-item) {
  margin-bottom: 32px;
}

.form-actions {
  margin-top: 50px;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.login-button {
  width: 100%;
  max-width: 350px;
  height: 62px;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 1.5px;
  margin: 0 auto;
}

.login-footer {
  margin-top: 35px;
  text-align: center;
}

.hint-text {
  font-size: 16px;
  color: #999;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    max-width: 400px;
  }
  
  .system-title {
    font-size: 36px;
  }
  
  .system-description {
    font-size: 20px;
  }
  
  .features-grid {
    gap: 30px;
    margin-top: 50px;
  }
  
  .feature-text {
    font-size: 18px;
  }
  
  .form-title {
    font-size: 32px;
  }
  
  .form-subtitle {
    font-size: 18px;
  }
}

@media (max-width: 1200px) {
  .login-container {
    height: 85vh;
  }
  
  .left-panel {
    flex: 1.2;
  }
  
  .system-title {
    font-size: 32px;
  }
  
  .system-description {
    font-size: 18px;
    margin-bottom: 50px;
  }
  
  .features-grid {
    gap: 25px;
    margin-top: 40px;
  }
  
  .feature-text {
    font-size: 16px;
  }
  
  .form-title {
    font-size: 28px;
  }
  
  .form-subtitle {
    font-size: 16px;
  }
  
  :deep(.el-input__inner) {
    height: 56px;
    font-size: 17px;
    padding-left: 45px;
  }
  
  :deep(.el-input__prefix) {
    left: 15px;
  }
  
  :deep(.el-input__prefix svg) {
    width: 18px;
    height: 18px;
  }
  
  .login-button {
    height: 56px;
    font-size: 18px;
    max-width: 320px;
  }
  
  .login-form {
    margin: 35px 0;
  }
  
  .form-actions {
    margin-top: 40px;
  }
}

@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    height: auto;
    max-height: none;
  }
  
  .left-panel,
  .right-panel {
    width: 100%;
    min-height: 50vh;
  }
  
  .left-panel {
    padding: 50px 40px;
  }
  
  .system-title {
    font-size: 28px;
  }
  
  .system-description {
    font-size: 16px;
    margin-bottom: 40px;
  }
  
  .features-grid {
    gap: 20px;
    margin-top: 30px;
  }
  
  .right-panel {
    padding: 50px 40px;
  }
  
  .form-wrapper {
    padding: 10px 0;
  }
  
  .form-title {
    font-size: 24px;
  }
  
  .form-subtitle {
    font-size: 15px;
  }
  
  :deep(.el-input__inner) {
    height: 52px;
    font-size: 16px;
    padding-left: 42px;
  }
  
  :deep(.el-input__prefix) {
    left: 14px;
  }
  
  :deep(.el-input__prefix svg) {
    width: 16px;
    height: 16px;
  }
  
  .login-button {
    height: 52px;
    font-size: 17px;
    max-width: 100%;
  }
  
  .login-form {
    margin: 25px 0;
  }
  
  .form-actions {
    margin-top: 30px;
  }
}

@media (max-width: 576px) {
  .login-page {
    padding: 15px;
  }
  
  .login-container {
    border-radius: 15px;
  }
  
  .left-panel {
    padding: 30px 20px;
  }
  
  .system-title {
    font-size: 24px;
  }
  
  .system-description {
    font-size: 14px;
    margin-bottom: 30px;
  }
  
  .features-grid {
    margin-top: 25px;
    gap: 18px;
  }
  
  .feature-text {
    font-size: 14px;
  }
  
  .right-panel {
    padding: 30px 20px;
  }
  
  .form-title {
    font-size: 22px;
  }
  
  .form-subtitle {
    font-size: 14px;
  }
  
  :deep(.el-input__inner) {
    height: 48px;
    font-size: 15px;
    padding-left: 38px;
  }
  
  :deep(.el-input__prefix) {
    left: 12px;
  }
  
  :deep(.el-input__prefix svg) {
    width: 14px;
    height: 14px;
  }
  
  .login-button {
    height: 48px;
    font-size: 16px;
  }
  
  .login-form {
    margin: 25px 0;
  }
  
  .form-actions {
    margin-top: 30px;
  }
  
  .login-footer {
    margin-top: 25px;
  }
  
  .hint-text {
    font-size: 14px;
  }
}

/* 防止过度缩放导致的布局问题 */
@media (max-width: 320px) {
  .system-title {
    font-size: 20px;
  }
  
  .form-title {
    font-size: 20px;
  }
  
  .login-button {
    max-width: 100%;
  }
}

/* 固定高度以防止在缩放时变形 */
@media (max-height: 700px) {
  .login-container {
    height: auto;
    max-height: none;
  }
}

/* 大屏幕优化 */
@media (min-width: 1800px) {
  .login-container {
    height: 95vh;
    max-height: 1100px;
  }
  
  .system-title {
    font-size: 48px;
  }
  
  .system-description {
    font-size: 24px;
  }
  
  .features-grid {
    gap: 40px;
    margin-top: 70px;
  }
  
  .feature-text {
    font-size: 22px;
  }
  
  .form-title {
    font-size: 40px;
  }
  
  .form-subtitle {
    font-size: 22px;
  }
  
  :deep(.el-input__inner) {
    height: 68px;
    font-size: 20px;
    padding-left: 55px;
  }
  
  :deep(.el-input__prefix) {
    left: 20px;
  }
  
  :deep(.el-input__prefix svg) {
    width: 22px;
    height: 22px;
  }
  
  .login-button {
    height: 68px;
    font-size: 22px;
    max-width: 380px;
  }
  
  .login-form {
    margin: 50px 0;
  }
  
  .form-actions {
    margin-top: 60px;
  }
  
  .login-footer {
    margin-top: 40px;
  }
  
  .hint-text {
    font-size: 18px;
  }
}
</style>