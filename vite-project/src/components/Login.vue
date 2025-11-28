<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1 class="login-title">赔偿表单管理系统</h1>
          <p class="login-subtitle">请登录您的账户</p>
        </div>
        
        <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
          <el-form-item prop="username">
            <el-input 
              v-model="form.username" 
              placeholder="请输入用户名"
              size="large"
              @keyup.enter="submit"
            >
              <template #prefix>
                <el-icon class="el-input__icon"><user /></el-icon>
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
                <el-icon class="el-input__icon"><lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              round 
              type="primary" 
              style="width: 100%;" 
              size="large"
              @click="submit" 
              :loading="loading"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>
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
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
}

.login-header {
  margin-bottom: 30px;
}

.login-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.login-subtitle {
  font-size: 14px;
  color: #666;
}

.login-form {
  margin-top: 20px;
}

:deep(.el-input__inner) {
  padding-left: 35px;
}

:deep(.el-input__prefix) {
  left: 10px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>