const API_BASE_URL = '/api'

// 登录API
export const login = async (username, password) => {
  try {
    console.log('发送登录请求到:', `${API_BASE_URL}/auth/login`);
    console.log('请求数据:', { username, password });
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    })

    console.log('服务器响应状态:', response.status);
    console.log('服务器响应对象:', response);
    
    const data = await response.json()
    console.log('服务器响应数据:', data);

    if (!response.ok) {
      throw new Error(data.message || '登录失败')
    }

    return data
  } catch (error) {
    console.error('登录请求出错:', error);
    throw error
  }
}

// 登出API
export const logout = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '登出失败')
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
export const getAllUsers = async () => {
  const token = localStorage.getItem('token');
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



// 创建用户
export const createUser = async (userData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/auth/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '创建用户失败')
  }

  return data
}

export const updateUser = async (userId, userData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '更新用户失败')
  }

  return data
}

// 删除用户
export const deleteUser = async (userId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '删除用户失败')
  }

  return data
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
export const getAllPermissions = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/auth/permissions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '获取权限失败')
  }

  // 返回标准格式的权限列表
  if (Array.isArray(data.permissions)) {
    return data.permissions.map(permission => {
      return { 
        name: permission.name, 
        description: permission.name 
      };
    });
  }

  return [
    { name: 'add_order', description: '添加订单' },
    { name: 'edit_order', description: '编辑订单' },
    { name: 'process_basic_order', description: '处理待判责订单' },
    { name: 'process_pending_review_order', description: '处理待审核订单' },
    { name: 'process_payment_order', description: '赔付订单' },
    { name: 'manage_users', description: '管理用户' },
    { name: 'manage_permissions', description: '管理权限' },
    { name: 'view_reports', description: '查看报表' }
  ];
}
