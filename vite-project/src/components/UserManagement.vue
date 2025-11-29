<template>
  <div class="user-management">
    <h1>用户权限管理</h1>
    
    <!-- 添加用户按钮 -->
    <div class="toolbar">
      <el-button type="primary" @click="openAddUserDialog">添加用户</el-button>
    </div>
    
    <!-- 用户列表表格 -->
    <el-table :data="users" style="width: 100%" v-loading="loading">
      <el-table-column prop="username" label="用户名" width="180"></el-table-column>
      <el-table-column prop="role" label="角色" width="180">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'">
            {{ scope.row.role === 'admin' ? '超级管理员' : '普通用户' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="openEditUserDialog(scope.row)">编辑</el-button>
          <el-button 
            size="small" 
            type="danger" 
            @click="deleteUser(scope.row.id)"
            :disabled="scope.row.role === 'admin' && adminCount <= 1"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加/编辑用户对话框 -->
    <el-dialog 
      :title="dialogTitle" 
      v-model="dialogVisible" 
      width="500px"
      @close="resetForm"
    >
      <el-form :model="currentUser" :rules="rules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="currentUser.username" :disabled="isEditMode"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEditMode">
          <el-input v-model="currentUser.password" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEditMode">
          <el-input v-model="currentUser.confirmPassword" type="password" show-password></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="currentUser.role" placeholder="请选择角色">
            <el-option label="超级管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAllUsers, createUser, updateUser, deleteUser as deleteUserApi } from '../services/authService'

// 用户数据
const users = ref([])
const loading = ref(false)

// 对话框相关
const dialogVisible = ref(false)
const isEditMode = ref(false)
const dialogTitle = computed(() => isEditMode.value ? '编辑用户' : '添加用户')

// 当前用户表单数据
const currentUser = reactive({
  id: null,
  username: '',
  password: '',
  confirmPassword: '',
  role: 'user'
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== currentUser.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 计算超级管理员数量
const adminCount = computed(() => {
  return users.value.filter(user => user.role === 'admin').length
})

// 表单引用
const userFormRef = ref(null)

// 获取所有用户
const fetchUsers = async () => {
  try {
    loading.value = true
    const data = await getAllUsers()
    users.value = data
  } catch (error) {
    ElMessage.error('获取用户列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 打开添加用户对话框
const openAddUserDialog = () => {
  isEditMode.value = false
  dialogVisible.value = true
}

// 打开编辑用户对话框
const openEditUserDialog = (user) => {
  isEditMode.value = true
  Object.assign(currentUser, user)
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  Object.assign(currentUser, {
    id: null,
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  })
  
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

// 提交用户表单
const submitUser = () => {
  userFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      if (isEditMode.value) {
        // 编辑用户
        await updateUser(currentUser.id, {
          role: currentUser.role
        })
        ElMessage.success('用户更新成功')
      } else {
        // 添加用户
        await createUser({
          username: currentUser.username,
          password: currentUser.password,
          role: currentUser.role
        })
        ElMessage.success('用户添加成功')
      }
      
      dialogVisible.value = false
      resetForm()
      fetchUsers()
    } catch (error) {
      ElMessage.error((isEditMode.value ? '更新' : '添加') + '用户失败: ' + error.message)
    }
  })
}

// 删除用户
const deleteUser = (id) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUserApi(id)
      ElMessage.success('用户删除成功')
      fetchUsers()
    } catch (error) {
      ElMessage.error('删除用户失败: ' + error.message)
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 组件挂载时获取用户列表
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>