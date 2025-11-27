// 数据服务文件
import { useReportStore } from '../stores/report'

// 定义状态枚举
export const OrderStatus = {
  UNPROCESSED: '未处理订单/投诉',
  NEED_COMPENSATION: '需赔付订单',
  NO_COMPENSATION: '无需赔付订单',
  CONFIRMED_PAYMENT: '确认可赔付',
  COMPENSATED:'确认已赔付',
  CONFIRMED_NO_COMPENSATION: '确认无需赔付',
  REJECTED_NEED_COMPENSATION:'被驳回需赔付订单',
  REJECTED_NO_COMPENSATION:'被驳回无需赔付'
}

// API 基础 URL
//const API_BASE_URL = 'http://localhost:3000/api'
//const API_BASE_URL = 'http://172.16.2.137:5014/api'
const API_BASE_URL = '/api'  // 使用相对路径，适配不同域名

// 格式化日期为MySQL兼容格式
function formatDateTime(dateString) {
  if (!dateString) return dateString;
  
  // 如果已经是正确的格式（YYYY-MM-DD HH:mm:ss），直接返回
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // 处理日期字符串
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // 转换为 YYYY-MM-DD HH:mm:ss 格式
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 清理数据函数，移除Vue的内部属性
function cleanData(data) {
  // 基本类型直接返回
  if (typeof data !== 'object' || data === null) return data;
  
  // 特殊处理：如果是事件对象或其他不应该序列化的对象，尝试提取有用的信息
  if (data.constructor && 
      (data.constructor.name.includes('Event') || 
       data.constructor.name.includes('InputEvent'))) {
    // 如果事件对象中有目标元素，尝试获取其文本内容
    if (data.target && data.target.textContent) {
      return data.target.textContent;
    }
    // 否则返回空字符串
    return '';
  }
  
  // 处理日期对象
  if (data instanceof Date) {
    return formatDateTime(data);
  }
  
  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }
  
  // 处理普通对象
  const cleanedData = {};
  for (const key in data) {
    // 忽略Vue的内部属性（以_或$开头的属性）
    if (!key.startsWith('_') && !key.startsWith('$')) {
      // 特殊处理时间字段
      if (key === 'time' && typeof data[key] === 'string') {
        cleanedData[key] = formatDateTime(data[key]);
      }
      // 对于嵌套对象，进行浅层处理
      else if (typeof data[key] === 'object' && data[key] !== null) {
        // 检查是否是事件对象
        if (data[key].constructor && 
            (data[key].constructor.name.includes('Event') || 
             data[key].constructor.name.includes('InputEvent'))) {
          // 尝试提取事件对象中的文本内容
          if (data[key].target && data[key].target.textContent) {
            cleanedData[key] = data[key].target.textContent;
          } else {
            cleanedData[key] = '';
          }
        } else if (Array.isArray(data[key])) {
          // 数组特殊处理
          cleanedData[key] = data[key].map(item => {
            if (typeof item === 'object' && item !== null) {
              // 检查是否是事件对象
              if (item.constructor && 
                  (item.constructor.name.includes('Event') || 
                   item.constructor.name.includes('InputEvent'))) {
                // 尝试提取事件对象中的文本内容
                if (item.target && item.target.textContent) {
                  return item.target.textContent;
                }
                return '';
              }
              // 数组中的对象也只做浅层处理
              const shallowCopy = {};
              for (const itemKey in item) {
                if (!itemKey.startsWith('_') && !itemKey.startsWith('$')) {
                  shallowCopy[itemKey] = item[itemKey];
                }
              }
              return shallowCopy;
            }
            return item;
          });
        } else {
          // 对于普通对象，创建一个新对象但不深入递归
          const shallowCopy = {};
          for (const subKey in data[key]) {
            if (!subKey.startsWith('_') && !subKey.startsWith('$')) {
              shallowCopy[subKey] = data[key][subKey];
            }
          }
          cleanedData[key] = shallowCopy;
        }
      } else {
        cleanedData[key] = data[key];
      }
    }
  }
  return cleanedData;
}

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
      body: JSON.stringify(cleanData(data))
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
    console.log('开始更新数据，ID:', id, '数据:', data);
    const cleanedData = cleanData(data);
    console.log('清理后的数据:', cleanedData);
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanedData)
    })
    
    console.log('更新请求已发送，响应状态:', response.status);
    console.log('响应对象:', response);
    
    // 检查响应是否成功
    if (!response.ok) {
      const errorText = await response.text();
      console.error('更新数据失败，服务器响应:', errorText);
      console.error('响应状态码:', response.status);
      console.error('响应状态文本:', response.statusText);
      throw new Error(`更新数据失败: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('数据更新成功，返回结果:', result);
    return result;
  } catch (error) {
    console.error('更新数据过程中发生错误:', error);
    console.error('错误名称:', error.name);
    console.error('错误消息:', error.message);
    throw error;
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