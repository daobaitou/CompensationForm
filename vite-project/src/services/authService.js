const API_BASE_URL = '/api'

// 登录API
export const login = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '登录失败')
    }

    return data
  } catch (error) {
    throw error
  }
}

// 验证token
export const verifyToken = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '验证失败')
    }

    return data
  } catch (error) {
    throw error
  }
}

// 获取所有用户
export const getAllUsers = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '获取用户失败')
  }

  return data.users
}

// 更新用户权限
export const updateUserPermissions = async (token, userId, permissions) => {
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ permissions })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '更新权限失败')
  }

  return data
}

// 获取所有权限
export const getAllPermissions = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/permissions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '获取权限失败')
  }

  return data.permissions
}