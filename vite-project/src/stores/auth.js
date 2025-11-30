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
      // 超级管理员拥有所有权限
      if (state.user && state.user.role === 'admin') {
        return true;
      }
      return state.user?.permissions?.includes(permission) || false
    },
    hasAnyPermission: (state) => (permissions) => {
      // 超级管理员拥有所有权限
      if (state.user && state.user.role === 'admin') {
        return true;
      }
      return permissions.some(permission => 
        state.user?.permissions?.includes(permission)
      )
    },
    getUserPermissions: (state) => {
      // 超级管理员拥有所有权限
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
    },
    isAdmin: (state) => {
      return state.user && state.user.role === 'admin';
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

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('token')
    },

    async verifyToken() {
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