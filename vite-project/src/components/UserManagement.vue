<template>
  <div class="user-management-container">
    <h2>用户权限管理</h2>
    
    <div v-if="loading" class="loading">
      加载中...
    </div>
    
    <div v-else>
      <!-- 用户列表 -->
      <div class="users-section">
        <h3>用户列表</h3>
        <div class="users-list">
          <div 
            v-for="user in users" 
            :key="user.id" 
            class="user-item"
            :class="{ active: selectedUser?.id === user.id }"
            @click="selectUser(user)"
          >
            <div class="user-info">
              <div class="username">{{ user.username }}</div>
              <div class="user-permissions">
                <span 
                  v-for="permission in user.permissions" 
                  :key="permission"
                  class="permission-tag"
                >
                  {{ permission }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 权限编辑 -->
      <div v-if="selectedUser" class="permissions-section">
        <h3>编辑 {{ selectedUser.username }} 的权限</h3>
        
        <div class="permissions-grid">
          <div 
            v-for="permission in allPermissions" 
            :key="permission.id"
            class="permission-item"
          >
            <label class="permission-checkbox">
              <input 
                type="checkbox" 
                :value="permission.name"
                v-model="selectedPermissions"
              />
              <span class="permission-name">{{ permission.name }}</span>
              <span class="permission-desc">{{ permission.description }}</span>
            </label>
          </div>
        </div>
        
        <div class="actions">
          <button @click="savePermissions" class="save-btn">保存权限</button>
          <button @click="cancelEdit" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getAllUsers, getAllPermissions, updateUserPermissions } from '../services/authService'

const authStore = useAuthStore()

const users = ref([])
const allPermissions = ref([])
const selectedUser = ref(null)
const selectedPermissions = ref([])
const loading = ref(false)

// 获取所有用户和权限
const loadUsersAndPermissions = async () => {
  loading.value = true
  try {
    const [usersData, permissionsData] = await Promise.all([
      getAllUsers(authStore.token),
      getAllPermissions(authStore.token)
    ])
    
    users.value = usersData
    allPermissions.value = permissionsData
  } catch (error) {
    console.error('加载数据失败:', error)
    alert('加载数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 选择用户
const selectUser = (user) => {
  selectedUser.value = user
  selectedPermissions.value = [...user.permissions]
}

// 保存权限
const savePermissions = async () => {
  if (!selectedUser.value) return
  
  try {
    await updateUserPermissions(
      authStore.token,
      selectedUser.value.id,
      selectedPermissions.value
    )
    
    // 更新本地用户数据
    const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id)
    if (userIndex !== -1) {
      users.value[userIndex].permissions = [...selectedPermissions.value]
    }
    
    alert('权限更新成功')
  } catch (error) {
    console.error('更新权限失败:', error)
    alert('更新权限失败: ' + error.message)
  }
}

// 取消编辑
const cancelEdit = () => {
  selectedUser.value = null
  selectedPermissions.value = []
}

onMounted(() => {
  // 检查用户是否有管理权限
  if (!authStore.user.permissions.includes('manage_users')) {
    alert('权限不足')
    return
  }
  
  loadUsersAndPermissions()
})
</script>

<style scoped>
.user-management-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.users-section {
  margin-bottom: 30px;
}

.users-section h3 {
  margin-bottom: 15px;
  color: #333;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.user-item {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.user-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.2);
}

.user-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.user-info .username {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
}

.user-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.permission-tag {
  background-color: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.permissions-section {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
}

.permissions-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.permission-item {
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 15px;
}

.permission-checkbox {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.permission-checkbox input {
  margin-bottom: 8px;
}

.permission-name {
  font-weight: bold;
  margin-bottom: 5px;
}

.permission-desc {
  font-size: 14px;
  color: #666;
}

.actions {
  display: flex;
  gap: 10px;
}

.save-btn, .cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn {
  background-color: #67c23a;
  color: white;
}

.save-btn:hover {
  background-color: #85ce61;
}

.cancel-btn {
  background-color: #909399;
  color: white;
}

.cancel-btn:hover {
  background-color: #a6a9ad;
}
</style>