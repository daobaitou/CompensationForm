import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi, verifyToken } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false
  }),

  getters: {
    hasPermission: (state) => (permission) => {
      return state.user?.permissions?.includes(permission) || false
    },
    hasAnyPermission: (state) => (permissions) => {
      return permissions.some(permission => 
        state.user?.permissions?.includes(permission)
      )
    },
    getUserPermissions: (state) => {
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
        this.isAuthenticated = true
        
        // 保存token到localStorage
        localStorage.setItem('token', response.token)
        
        return response
      } catch (error) {
        // 清除认证状态
        this.logout()
        throw error
      }
    },

    async logout() {
      try {
        // 如果有token，尝试调用后端登出接口
        if (this.token) {
          await logoutApi(this.token)
        }
      } catch (error) {
        // 即使后端登出失败，也要清除本地状态
        console.error('登出请求失败:', error)
      } finally {
        // 清除本地状态
        this.user = null
        this.token = null
        this.isAuthenticated = false
        localStorage.removeItem('token')
      }
    },

    async verifyAuth() {
      if (!this.token) {
        this.logout()
        return false
      }

      try {
        const response = await verifyToken(this.token)
        
        if (!response || !response.user) {
          throw new Error('验证失败')
        }
        
        this.user = response.user
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    initializeAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        this.isAuthenticated = true
      }
    }
  }
})