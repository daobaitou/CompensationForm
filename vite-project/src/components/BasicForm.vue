<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <!-- 复用现有的 DataTable 组件 -->
    <DataTable :columns="basicColumns" :data="tableData" :filterableColumns="['投诉渠道', '赔付人']" :showAddButton="false"
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
              <select v-model="processFormData.indemnitorCategory" required>
                <option value="">请选择赔付方</option>
                <option value="商家">商家</option>
                <option value="站长">站长</option>
                <option value="骑手">骑手</option>
                <option value="公司">公司</option>
              </select>
            </div>
            <div class="form-group">
              <label>赔付人:</label>
              <input type="text" v-model="processFormData.indemnitor" :disabled="processFormData.status === '无需赔付订单'"
                required />
            </div>
          </div>

          <!-- 第三行：赔付金额 -->
          <div class="form-row">
            <div class="form-group">
              <label>赔付金额:</label>
              <input type="number" v-model.number="processFormData.compensationAmount" step="0.01" min="0"
                :disabled="processFormData.status === '无需赔付订单'" />
            </div>
            <div class="form-group">
              <!-- 空白占位，保持布局对称 -->
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit">保存</button>
            <button type="button" @click="closeProcessModal">取消</button>
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

const title = '未处理订单/投诉'
const basicColumns = [
  { key: 'pay_id', title: '支付编码' },
  { key: 'Complaint channel', title: '投诉渠道' },
  { key: 'phone', title: '电话' },
  { key: 'Order Amount', title: '订单金额' },
  { key: 'Situation Explanation', title: '情况说明' },
  { key: 'Indemnitor', title: '赔付人' },
  { key: 'Compensation Amount', title: '赔付金额' },
  { key: 'status', title: '处理结果' },
  { key: 'time', title: '日期' },
  { key: 'Note', title: '备注' }
]

// 初始化数据
const tableData = ref([])


// 处理订单相关状态
const showProcessModal = ref(false)
const processFormData = ref({
  id: null,
  pay_id: '',
  status: '',
  indemnitor: '',
  indemnitorCategory: '', // 添加赔付方分类字段
  compensationAmount: 0
})

onMounted(async () => {
  try {
    console.log('开始请求未处理订单/投诉数据，状态:', OrderStatus.UNPROCESSED);
    // 添加URL编码
    const encodedStatus = encodeURIComponent(OrderStatus.UNPROCESSED);
    console.log('URL编码后的状态:', encodedStatus);
    tableData.value = await fetchDataByStatus(OrderStatus.UNPROCESSED);
    console.log('获取到的未处理订单/投诉数据:', tableData.value);

    // 验证数据是否都具有正确的状态
    if (tableData.value && Array.isArray(tableData.value)) {
      const invalidData = tableData.value.filter(item => item.status !== OrderStatus.UNPROCESSED);
      if (invalidData.length > 0) {
        console.warn('发现状态不正确的数据:', invalidData);
      }
    }
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
    status: item.status === OrderStatus.NEED_COMPENSATION ? '需赔付订单' : '无需赔付订单',
    indemnitor: item.Indemnitor || '',
    compensationAmount: parseFloat(item['Compensation Amount']) || 0
  }
  showProcessModal.value = true
}

// 添加监听器：当选择无需赔付时清空赔付人
watch(() => processFormData.value.status, (newStatus) => {
  if (newStatus === '无需赔付订单') {
    processFormData.value.indemnitor = ''
  }
})

// 关闭处理订单弹窗
const closeProcessModal = () => {
  showProcessModal.value = false
  processFormData.value = {
    id: null,
    pay_id: '',
    status: '',
    indemnitor: '',
    compensationAmount: 0
  }
}

// 提交处理订单表单
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
      Indemnitor: processFormData.value.status === '无需赔付订单' ? '' : processFormData.value.indemnitor,
      'Compensation Amount': processFormData.value.status === '无需赔付订单' ? 0 : processFormData.value.compensationAmount,
      status: processFormData.value.status,
      Note: currentItem.Note || ''
    }

    // 发送更新请求
    await updateData(processFormData.value.id, updateDataObj)

    // 更新本地数据
    const index = tableData.value.findIndex(item => item.id === processFormData.value.id)
    if (index !== -1) {
      tableData.value[index].status = processFormData.value.status
      tableData.value[index].Indemnitor = processFormData.value.indemnitor
      tableData.value[index]['Compensation Amount'] = processFormData.value.status === '无需赔付订单' ? '0.00' : processFormData.value.compensationAmount.toFixed(2)
    }

    // 关闭弹窗
    closeProcessModal()

    alert('订单处理成功！')
  } catch (error) {
    console.error('处理订单失败:', error)
    alert('处理订单失败: ' + error.message)
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

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
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
