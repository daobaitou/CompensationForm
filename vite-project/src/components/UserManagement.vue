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
      width="600px"
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
          <el-select v-model="currentUser.role" placeholder="请选择角色" @change="handleRoleChange">
            <el-option label="超级管理员" value="admin"></el-option>
            <el-option label="普通用户" value="user"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 权限选择（仅对普通用户显示） -->
        <el-form-item label="权限" v-if="currentUser.role === 'user'">
          <el-checkbox-group v-model="currentUser.permissions">
            <el-tooltip 
              v-for="permission in availablePermissions" 
              :key="permission.value" 
              :content="permission.description"
              placement="top"
            >
              <el-checkbox 
                :label="permission.value"
              >
                {{ permission.label }}
              </el-checkbox>
            </el-tooltip>
          </el-checkbox-group>
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
import { getAllUsers, createUser, updateUser, deleteUser as deleteUserApi, getAllPermissions } from '../services/authService'

// 用户数据
const users = ref([])
const loading = ref(false)

// 权限数据
const availablePermissions = ref([
  { value: 'add_order', label: '添加订单', description: '允许用户在投诉订单页面添加新的订单记录' },
  { value: 'edit_order', label: '编辑订单', description: '允许用户在投诉订单页面编辑现有订单信息' },
  { value: 'process_basic_order', label: '处理待判责订单', description: '允许用户在待判责订单页面处理订单，判定责任方' },
  { value: 'process_pending_review_order', label: '处理待审核订单', description: '允许用户在待审核订单页面审核订单，决定是否赔付' },
  { value: 'process_payment_order', label: '赔付订单', description: '允许用户在待赔付订单页面执行实际的赔付操作' },
  { value: 'manage_orders', label: '管理订单', description: '允许用户查看和管理所有订单信息' },
  { value: 'manage_users', label: '管理用户', description: '允许用户管理系统中的其他用户账户' },
  { value: 'manage_permissions', label: '管理权限', description: '允许用户管理权限分配，给其他用户分配权限' },
  { value: 'view_reports', label: '查看报表', description: '允许用户访问和查看各类统计报表' }
])

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

// 权限描述映射
const permissionDescriptions = {
  'add_order': '允许用户在投诉订单页面添加新的订单记录',
  'edit_order': '允许用户在投诉订单页面编辑现有订单信息',
  'process_basic_order': '允许用户在待判责订单页面处理订单，判定责任方',
  'process_pending_review_order': '允许用户在待审核订单页面审核订单，决定是否赔付',
  'process_payment_order': '允许用户在待赔付订单页面执行实际的赔付操作',
  'manage_orders': '允许用户查看和管理所有订单信息',
  'manage_users': '允许用户管理系统中的其他用户账户',
  'manage_permissions': '允许用户管理权限分配，给其他用户分配权限',
  'view_reports': '允许用户访问和查看各类统计报表'
}

// 获取权限标签的函数
const getPermissionLabel = (permissionValue) => {
  return permissionLabels[permissionValue] || permissionValue
}

// 获取权限描述的函数
const getPermissionDescription = (permissionValue) => {
  return permissionDescriptions[permissionValue] || ''
}

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
  role: 'user',
  permissions: []
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

// 获取所有权限
const fetchPermissions = async () => {
  try {
    const data = await getAllPermissions()
    // 更新权限列表，保持中文标签和描述
    availablePermissions.value = data.map(permission => ({
      value: permission.name,
      label: permissionLabels[permission.name] || permission.description || permission.name,
      description: permissionDescriptions[permission.name] || permission.description || ''
    }))
  } catch (error) {
    console.error('获取权限列表失败:', error)
    // 出错时使用默认权限列表
  }
}

// 打开添加用户对话框
const openAddUserDialog = () => {
  isEditMode.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑用户对话框
const openEditUserDialog = (user) => {
  isEditMode.value = true
  Object.assign(currentUser, {
    id: user.id,
    username: user.username,
    password: '',
    confirmPassword: '',
    role: user.role,
    permissions: user.permissions && Array.isArray(user.permissions) ? [...user.permissions] : []
  })
  console.log('编辑用户权限:', currentUser.permissions) // 调试日志
  dialogVisible.value = true
}

// 处理角色变更
const handleRoleChange = (role) => {
  const previousRole = currentUser.role
  
  // 如果切换为管理员，清空权限选择
  if (role === 'admin') {
    currentUser.permissions = []
  }
  
  // 如果从管理员切换回普通用户，保留之前的权限或初始化为空数组
  // 注意：在编辑模式下，原始权限已在openEditUserDialog中保存
}

// 重置表单
const resetForm = () => {
  Object.assign(currentUser, {
    id: null,
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    permissions: []
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
          role: currentUser.role,
          permissions: currentUser.role === 'user' ? currentUser.permissions : []
        })
        ElMessage.success('用户更新成功')
      } else {
        // 添加用户
        await createUser({
          username: currentUser.username,
          password: currentUser.password,
          role: currentUser.role,
          permissions: currentUser.role === 'user' ? currentUser.permissions : []
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

// 组件挂载时获取用户列表和权限列表
onMounted(() => {
  fetchUsers()
  fetchPermissions()
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

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>