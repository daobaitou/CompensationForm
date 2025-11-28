<template>
  <div class="login-container">
    <div class="login-box">
      <p>正在跳转到主页...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '~/api/manager'

const router = useRouter()

const onSubmit = () => {
  formref.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await login({
          username: form.username,
          password: form.password
        })
        console.log('登录成功:', response)
        router.push('/') // 登录成功后跳转到主页
      } catch (error) {
        console.error('登录失败:', error)
      }
    } else {
      console.log('表单验证失败')
    }
  })    
}

// onMounted(() => {
//   // 自动跳转到主页
//   router.replace('/')
// })
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-box p {
  font-size: 18px;
  color: #666;
}
</style>