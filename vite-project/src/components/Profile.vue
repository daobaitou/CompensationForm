<template>
  <div class="profile-container">
    <h1>个人信息</h1>
    
    <el-card class="profile-card">
      <div class="profile-header">
        <div class="avatar-placeholder">
          <i class="el-icon-user-solid" style="font-size: 48px; color: #409eff;"></i>
        </div>
        <div class="user-basic-info">
          <h2>{{ authStore.user?.username }}</h2>
          <p>{{ roleLabel }}</p>
        </div>
      </div>
      
      <div class="profile-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户名">{{ authStore.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ roleLabel }}</el-descriptions-item>
          <el-descriptions-item label="权限">
            <div v-if="authStore.user?.role === 'admin'" class="admin-permissions">
              超级管理员拥有所有权限
            </div>
            <div v-else class="user-permissions">
              <el-tag 
                v-for="permission in userPermissions" 
                :key="permission" 
                type="info" 
                style="margin: 3px;"
              >
                {{ getPermissionLabel(permission) }}
              </el-tag>
              <div v-if="!userPermissions || userPermissions.length === 0">暂无权限</div>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div class="profile-actions">
        <el-button type="primary" @click="openEditProfileDialog">编辑信息</el-button>
        <el-button type="primary" @click="openEditPasswordDialog">修改密码</el-button>
        <el-button type="danger" @click="handleLogout">登出</el-button>
      </div>
    </el-card>
    
    <!-- 编辑信息对话框 -->
    <el-dialog 
      title="编辑信息" 
      v-model="showEditProfileDialog" 
      width="400px"
      @close="resetProfileForm"
    >
      <el-form 
        :model="profileForm" 
        :rules="profileRules" 
        ref="profileFormRef" 
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditProfileDialog = false">取消</el-button>
          <el-button type="primary" @click="submitProfileChange">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 修改密码对话框 -->
    <el-dialog 
      title="修改密码" 
      v-model="showEditPasswordDialog" 
      width="400px"
      @close="resetPasswordForm"
    >
      <el-form 
        :model="passwordForm" 
        :rules="passwordRules" 
        ref="passwordFormRef" 
        label-width="80px"
        label-position="left"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            show-password
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditPasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="submitPasswordChange">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import { updatePassword, updateUser } from '../services/authService'

const router = useRouter()
const authStore = useAuthStore()

// 角色标签映射
const roleLabels = {
  'admin': '超级管理员',
  'user': '普通用户'
}

// 权限标签映射
const permissionLabels = {
  'add_order': '添加订单',
  'edit_order': '编辑订单',
  'process_basic_order': '处理待判责订单',
  'process_pending_review_order': '处理待审核订单',
  'process_payment_order': '赔付订单',
  'manage_orders': '管理订单',
  'manage_users': '管理用户',
  'manage_permissions': '管理权限',
  'view_reports': '查看报表'
}

// 获取角色标签
const roleLabel = computed(() => {
  return roleLabels[authStore.user?.role] || authStore.user?.role || '未知'
})

// 获取用户权限
const userPermissions = computed(() => {
  return authStore.user?.permissions || []
})

// 获取权限标签
const getPermissionLabel = (permissionValue) => {
  return permissionLabels[permissionValue] || permissionValue
}

// 编辑信息对话框相关
const showEditProfileDialog = ref(false)
const profileFormRef = ref(null)

const profileForm = reactive({
  username: ''
})

const profileRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ]
}

// 修改密码对话框相关
const showEditPasswordDialog = ref(false)
const passwordFormRef = ref(null)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 打开编辑信息对话框
const openEditProfileDialog = () => {
  profileForm.username = authStore.user?.username || ''
  showEditProfileDialog.value = true
}

// 重置信息表单
const resetProfileForm = () => {
  profileForm.username = ''
  
  if (profileFormRef.value) {
    profileFormRef.value.resetFields()
  }
}

// 打开修改密码对话框
const openEditPasswordDialog = () => {
  showEditPasswordDialog.value = true
}

// 重置密码表单
const resetPasswordForm = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}

// 提交信息修改
const submitProfileChange = () => {
  profileFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      // 更新用户信息
      await updateUser(authStore.user.id, {
        username: profileForm.username,
        role: authStore.user.role,
        permissions: authStore.user.role === 'user' ? authStore.user.permissions : []
      })
      
      // 更新本地存储的用户信息
      authStore.updateUserInfo({
        ...authStore.user,
        username: profileForm.username
      })
      
      ElMessage.success('信息更新成功')
      showEditProfileDialog.value = false
      resetProfileForm()
    } catch (error) {
      ElMessage.error('信息更新失败: ' + error.message)
    }
  })
}

// 提交密码修改
const submitPasswordChange = () => {
  passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      await updatePassword(authStore.user.id, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      
      ElMessage.success('密码修改成功')
      showEditPasswordDialog.value = false
      resetPasswordForm()
    } catch (error) {
      ElMessage.error('密码修改失败: ' + error.message)
    }
  })
}

// 登出
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
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  margin-top: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f2f6fc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.user-basic-info h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #303133;
}

.user-basic-info p {
  margin: 0;
  color: #909399;
}

.profile-details {
  margin-bottom: 30px;
}

.admin-permissions {
  color: #67c23a;
  font-weight: bold;
}

.user-permissions {
  display: flex;
  flex-wrap: wrap;
}

.profile-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.dialog-footer {
  text-align: right;
}
</style>