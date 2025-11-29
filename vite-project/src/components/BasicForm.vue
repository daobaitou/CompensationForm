<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <!-- 复用现有的 DataTable 组件 -->
    <DataTable 
      :columns="columns" 
      :data="tableData" 
      :filterableColumns="['投诉渠道', '赔付人']" 
      :showAddButton="false"
      :showEditButton="false"
      :showProcessButton="true" @row-action="handleRowAction" />

    <!-- 处理订单弹窗 -->
    <div v-if="showProcessModal" class="modal" @click="closeProcessModal">
      <div class="modal-content" @click.stop>
        <h2>处理订单</h2>
        <form @submit.prevent="handleProcessSubmit">
          <!-- 第一行：支付编码和处理结果 -->
          <div class="form-row">
            <div class="form-group">
              <label>支付编码:</label>
              <input type="text" v-model="processFormData.pay_id" disabled />
            </div>
            <div class="form-group">
              <label>处理结果:</label>
              <select v-model="processFormData.status" required>
                <option value="需赔付订单">需赔付订单</option>
                <option value="无需赔付订单">无需赔付订单</option>
              </select>
            </div>
          </div>

          <!-- 第二行：赔付方分类和赔付人 -->
          <div class="form-row">
            <div class="form-group">
              <label>赔付方分类:</label>
              <select v-model="processFormData.indemnitorCategory" 
                :disabled="processFormData.status === '无需赔付订单'" required
                @change="handleIndemnitorCategoryChange">
                <option value="">请选择赔付方</option>
                <option value="商家">商家</option>
                <option value="站长">站长</option>
                <option value="骑手">骑手</option>
                <option value="公司">公司</option>
              </select>
            </div>
            <div class="form-group">
              <label>赔付人:</label>
              <input type="text" v-model="processFormData.indemnitor" 
                :disabled="processFormData.status === '无需赔付订单' || processFormData.indemnitorCategory === '公司'" required />
            </div>
          </div>

          <!-- 第三行：订单金额和赔付金额 -->
          <div class="form-row">
            <div class="form-group">
              <label>订单金额:</label>
              <input type="number" v-model="processFormData.orderAmount" disabled />
            </div>
            <div class="form-group">
              <label>赔付金额:</label>
              <input type="number" step="0.01" v-model="processFormData.compensationAmount" 
                :disabled="processFormData.status === '无需赔付订单'" required />
            </div>
          </div>

          <div class="form-buttons">
            <button type="button" @click="closeProcessModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">确定</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from './DataTable.vue'
import { fetchDataByStatus, updateData, OrderStatus } from '../services/dataService'

const title = '待判责订单'
const columns = [
  { key: 'pay_id', title: '支付编码' },
  { key: 'Complaint channel', title: '投诉渠道' },
  { key: 'phone', title: '投诉人电话' },
  { key: 'Order Amount', title: '订单金额' },
  { key: 'Situation Explanation', title: '情况说明' },
  { key: 'status', title: '状态' },
  { key: 'time', title: '投诉单下单日期' },
  { key: 'Note', title: '备注' }
]

// 初始化数据
const tableData = ref([])


// 处理订单相关状态
const showProcessModal = ref(false)
const processFormData = ref({
  id: null,
  pay_id: '',
  status: '需赔付订单', // 默认选择需赔付订单
  indemnitorCategory: '',
  indemnitor: '',
  orderAmount: 0,
  compensationAmount: 0,
  detailedExplanation: '',
  note: ''
})

onMounted(async () => {
  try {
    // 获取未处理订单/投诉
    const unprocessedData = await fetchDataByStatus(OrderStatus.UNPROCESSED);
    
    // 获取被驳回需赔付订单
    const rejectedNeedCompensationData = await fetchDataByStatus(OrderStatus.REJECTED_NEED_COMPENSATION);
    
    // 获取被驳回无需赔付订单
    const rejectedNoCompensationData = await fetchDataByStatus(OrderStatus.REJECTED_NO_COMPENSATION);
    
    // 合并三种状态的数据
    tableData.value = [...unprocessedData, ...rejectedNeedCompensationData, ...rejectedNoCompensationData];
    
    console.log('获取到的待判责订单数据:', tableData.value);
  } catch (error) {
    console.error('获取数据失败:', error);
  }
});

// 处理行操作事件
const handleRowAction = (action, item) => {
  if (action === 'process') {
    openProcessModal(item)
  }
}

// 打开处理订单弹窗
const openProcessModal = (item) => {
  processFormData.value = {
    id: item.id,
    pay_id: item.pay_id,
    status: item.status === OrderStatus.REJECTED_NEED_COMPENSATION || item.status === OrderStatus.UNPROCESSED ? '需赔付订单' : '无需赔付订单',
    indemnitorCategory: item['Classification of Payers'] || '',
    indemnitor: item.Indemnitor || '',
    orderAmount: parseFloat(item['Order Amount']) || 0,
    compensationAmount: parseFloat(item['Compensation Amount']) || 0,
    detailedExplanation: item['Detailed explanation'] || '',
    note: item.Note || ''
  }
  showProcessModal.value = true
}

// 添加监听器：当选择无需赔付时清空赔付人和赔付方分类
watch(() => processFormData.value.status, (newStatus) => {
  if (newStatus === '无需赔付订单') {
    processFormData.value.indemnitor = ''
    processFormData.value.indemnitorCategory = ''
    processFormData.value.compensationAmount = 0
  }
})

// 关闭处理弹窗
const closeProcessModal = () => {
  showProcessModal.value = false
}

// 处理赔付方分类变化事件
const handleIndemnitorCategoryChange = () => {
  // 当赔付方分类选择为"公司"时，自动将赔付人填充为"公司"并禁用输入框
  if (processFormData.value.indemnitorCategory === '公司') {
    processFormData.value.indemnitor = '公司'
  }
}

// 处理表单提交
const handleProcessSubmit = async () => {
  try {
    // 查找当前正在处理的订单
    const currentItem = tableData.value.find(item => item.id === processFormData.value.id);

    // 构造完整的更新数据，包含所有必需字段
    const updateDataObj = {
      pay_id: currentItem.pay_id,
      'Complaint channel': currentItem['Complaint channel'],
      phone: currentItem.phone,
      'Order Amount': currentItem['Order Amount'],
      'Situation Explanation': currentItem['Situation Explanation'],
      'Classification of Payers': processFormData.value.status === '无需赔付订单' ? '' : processFormData.value.indemnitorCategory,
      Indemnitor: processFormData.value.status === '无需赔付订单' ? '' : processFormData.value.indemnitor,
      'Compensation Amount': processFormData.value.status === '无需赔付订单' ? '0.00' : processFormData.value.compensationAmount.toFixed(2),
      status: processFormData.value.status === '需赔付订单' ? OrderStatus.NEED_COMPENSATION : OrderStatus.NO_COMPENSATION,
      Note: processFormData.value.note,
      'Detailed explanation': processFormData.value.detailedExplanation,
      time: currentItem.time // 保留原始投诉日期
    }

    // 发送更新请求
    await updateData(processFormData.value.id, updateDataObj)
    
    // 更新本地数据
    const updatedItemIndex = tableData.value.findIndex(item => item.id === processFormData.value.id)
    if (updatedItemIndex !== -1) {
      tableData.value[updatedItemIndex] = { 
        ...tableData.value[updatedItemIndex], 
        ...updateDataObj 
      }
    }

    // 关闭弹窗
    closeProcessModal()
    
    alert('订单处理成功!')
  } catch (error) {
    console.error('处理订单失败:', error)
    alert('处理订单失败: ' + (error.message || '未知错误'))
  }
}

</script>

<style scoped>
.form-container {
  padding: 20px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.form-buttons button {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.form-buttons .submit-btn {
  background-color: #409EFF;
  color: white;
}

.form-buttons .cancel-btn {
  background-color: #f5f7fa;
  color: #606266;
}

.form-buttons .submit-btn:hover {
  background-color: #66b1ff;
}

.form-buttons .cancel-btn:hover {
  background-color: #e1e5eb;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-actions button[type="submit"] {
  background-color: #409eff;
  color: white;
}

.modal-actions button[type="button"] {
  background-color: #f5f7fa;
  color: #606266;
}

/* 处理弹窗 */
.modal-content .form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.modal-content .form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-content .form-group label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.modal-content .form-group input,
.modal-content .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  box-sizing: border-box;
}

/* 当输入框被禁用时的样式 */
.modal-content .form-group input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
  opacity: 0.8;
}
</style>
