import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, verifyToken } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    hasPermission: (state) => (permission) => {
      if (!state.user) return false
      if (state.user.role === 'admin') return true
      return Array.isArray(state.user.permissions) && state.user.permissions.includes(permission)
    },
    hasAnyPermission: (state) => (permissions) => {
      if (!state.user) return false
      if (state.user.role === 'admin') return true
      return permissions.some(permission => 
        Array.isArray(state.user.permissions) && state.user.permissions.includes(permission)
      )
    },
    getUserPermissions: (state) => {
      if (state.user && state.user.role === 'admin') {
        return [
          'add_order',
          'edit_order', 
          'process_basic_order',
          'process_pending_review_order',
          'process_payment_order',
          'manage_users',
          'manage_permissions',
          'view_reports'
        ];
      }
      return state.user?.permissions || []
    }
  },

  actions: {
    async login(username, password) {
      try {
        const response = await loginApi(username, password)
        
        if (!response || !response.token) {
          throw new Error('登录失败')
        }
        
        this.token = response.token
        this.user = response.user
        
        // 保存到localStorage
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        
        return response
      } catch (error) {
        // 清除认证状态
        this.logout()
        throw error
      }
    },

    async logout() {
      try {
        if (this.token) {
          await logoutApi(this.token)
        }
      } catch (error) {
        console.error('登出API调用失败:', error)
      } finally {
        this.token = null
        this.user = null
        
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    },

    async verifyToken() {
      if (!this.token) {
        return false
      }

      try {
        const response = await verifyToken(this.token)
        
        if (response.valid) {
          // 更新用户信息（以防权限发生变化）
          this.user = response.user
          localStorage.setItem('user', JSON.stringify(response.user))
          return true
        } else {
          // Token无效，清理本地存储
          this.logout()
          return false
        }
      } catch (error) {
        console.error('Token验证失败:', error)
        // 验证失败，清理本地存储
        this.logout()
        return false
      }
    },

    initializeAuth() {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user'))
      
      if (token && user) {
        this.token = token
        this.user = user
      }
    },

    updateUserInfo(userInfo) {
      this.user = { ...this.user, ...userInfo }
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})