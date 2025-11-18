// 数据服务文件
import { useReportStore } from '../stores/report'

// 定义状态枚举
export const OrderStatus = {
  UNPROCESSED: '未处理订单/投诉',
  NEED_COMPENSATION: '需赔付订单',
  NO_COMPENSATION: '无需赔付订单'
}

// API 基础 URL
const API_BASE_URL = 'http://localhost:3000/api'
//const API_BASE_URL = 'http://172.16.2.137:5014/api'


// 获取所有数据
export const fetchData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`)
    if (!response.ok) {
      throw new Error('获取数据失败')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('获取数据错误:', error)
    throw error
  }
}

// 根据状态获取数据
export const fetchDataByStatus = async (status) => {
  try {
    // 对包含特殊字符的状态进行编码处理
    const encodedStatus = encodeURIComponent(status).replace(/%2F/g, '_SLASH_');
    console.log('发送请求到:', `${API_BASE_URL}/orders/status/${encodedStatus}`);
    const response = await fetch(`${API_BASE_URL}/orders/status/${encodedStatus}`);
    console.log('服务器响应状态:', response.status);
    console.log('服务器响应对象:', response);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('服务器返回错误信息:', errorText);
      throw new Error(`获取数据失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('根据状态获取的数据:', data);
    
    // 验证返回的数据状态是否正确
    if (data && Array.isArray(data)) {
      const invalidData = data.filter(item => item.status !== status);
      if (invalidData.length > 0) {
        console.warn('发现状态不正确的数据:', invalidData);
      }
    }
    
    return data;
  } catch (error) {
    console.error('获取数据错误:', error);
    throw error;
  }
};


// 添加数据
export const addData = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('添加数据失败')
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('添加数据错误:', error)
    throw error
  }
}

// 更新数据
export const updateData = async (id, data) => {
  try {
    console.log('开始更新数据:', { id, data });
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    console.log('更新请求已发送，响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('更新数据失败，服务器响应:', errorText);
      throw new Error('更新数据失败')
    }
    
    const result = await response.json()
    console.log('数据更新成功，返回结果:', result);
    return result
  } catch (error) {
    console.error('更新数据错误:', error)
    throw error
  }
}

// 删除数据
export const deleteData = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('删除数据失败')
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('删除数据错误:', error)
    throw error
  }
}