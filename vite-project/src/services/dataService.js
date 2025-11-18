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

// 模拟API接口 - 获取所有数据
// export const fetchData = async () => {
//   // 模拟网络请求延迟
//   await new Promise(resolve => setTimeout(resolve, 500))
  
//   // 返回统一格式的数据
//   const data = [
//     { 
//       id: 1, 
//       pay_id: 'PAY001', 
//       'Complaint channel': '客服电话', 
//       phone: '13800138000', 
//       'Order Amount': '100.00', 
//       'Situation Explanation': '商品质量问题', 
//       Indemnitor: '张三', 
//       'Compensation Amount': '50.00', 
//       Note: '客户满意',
//       status: OrderStatus.UNPROCESSED,
//       time: '2023-05-01 10:30:00'
//     },
//     { 
//       id: 2, 
//       pay_id: 'PAY002', 
//       'Complaint channel': '在线客服', 
//       phone: '13900139000', 
//       'Order Amount': '200.00', 
//       'Situation Explanation': '物流延迟', 
//       Indemnitor: '李四', 
//       'Compensation Amount': '30.00', 
//       Note: '补偿运费',
//       status: OrderStatus.UNPROCESSED,
//       time: '2023-05-02 14:15:00'
//     },
//     { 
//       id: 3, 
//       pay_id: 'PAY003', 
//       'Complaint channel': '客服电话', 
//       phone: '13700137000', 
//       'Order Amount': '150.00', 
//       'Situation Explanation': '包装破损', 
//       Indemnitor: '王五', 
//       'Compensation Amount': '0.00', 
//       Note: '已修复无需赔偿',
//       status: OrderStatus.NO_COMPENSATION,
//       time: '2023-05-03 09:45:00'
//     },
//     { 
//       id: 4, 
//       pay_id: 'PAY004', 
//       'Complaint channel': '在线客服', 
//       phone: '13600136000', 
//       'Order Amount': '300.00', 
//       'Situation Explanation': '描述不符', 
//       Indemnitor: '赵六', 
//       'Compensation Amount': '0.00', 
//       Note: '解释清楚无需赔偿',
//       status: OrderStatus.NO_COMPENSATION,
//       time: '2023-05-04 16:20:00'
//     },
//     { 
//       id: 5, 
//       pay_id: 'PAY005', 
//       'Complaint channel': '客服电话', 
//       phone: '13500135000', 
//       'Order Amount': '250.00', 
//       'Situation Explanation': '服务态度问题', 
//       Indemnitor: '孙七', 
//       'Compensation Amount': '80.00', 
//       Note: '道歉并赔偿',
//       status: OrderStatus.NEED_COMPENSATION,
//       time: '2023-05-05 11:10:00'
//     },
//     { 
//       id: 6, 
//       pay_id: 'PAY006', 
//       'Complaint channel': '在线客服', 
//       phone: '13400134000', 
//       'Order Amount': '180.00', 
//       'Situation Explanation': '缺货', 
//       Indemnitor: '周八', 
//       'Compensation Amount': '50.00', 
//       Note: '补发并赔偿',
//       status: OrderStatus.NEED_COMPENSATION,
//       time: '2023-05-06 13:35:00'
//     }
//   ]

//   // 添加调试日志
//   console.log('获取到的所有数据:', data)
//   return data
// }

// 根据状态获取数据
// export const fetchDataByStatus = async (status) => {
//   const allData = await fetchData()
//   if (!status) return allData

//   const filteredData = allData.filter(item => item.status === status)
//   console.log(`根据状态"${status}"筛选数据:`, filteredData)
//   return filteredData
// }

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