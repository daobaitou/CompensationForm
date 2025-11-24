<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <DataTable 
      :columns="columns" 
      :data="filteredTableData" 
      :filterableColumns="['投诉渠道', '赔付人']" 
      :showAddButton="false"
      :showEditButton="false"
      :showProcessButton="true"
      @row-action="handleRowAction" />
    
    <!-- 赔付弹窗 -->
    <div v-if="showCompensationModal" class="modal" @click="closeCompensationModal">
      <div class="modal-content" @click.stop>
        <h2>赔付订单</h2>
        <div class="form-group">
          <label>支付编码:</label>
          <input type="text" v-model="compensationFormData.pay_id" disabled />
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>赔付人:</label>
            <input type="text" v-model="compensationFormData.indemnitor" disabled />
          </div>
          
          <div class="form-group">
            <label>赔付金额:</label>
            <input type="number" v-model.number="compensationFormData.compensationAmount" step="0.01" min="0" disabled />
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="closeCompensationModal">取消</button>
          <button type="button" @click="submitCompensation">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from './DataTable.vue'
import { fetchData, updateData } from '../services/dataService'
import { OrderStatus } from '../services/dataService'

const title = '待赔付订单'
const columns = [
  { key: 'pay_id', title: '支付编码' },
  { key: 'Complaint channel', title: '投诉渠道' },
  { key: 'phone', title: '投诉人电话' },
  { key: 'Order Amount', title: '订单金额' },
  { key: 'Situation Explanation', title: '情况说明' },
  { key: 'Indemnitor', title: '赔付人' },
  { key: 'Compensation Amount', title: '赔付金额' },
  { key: 'status', title: '处理结果' },
  { key: 'time', title: '投诉单下单日期' },
  { key: 'Note', title: '备注' }
]

const tableData = ref([])
const showCompensationModal = ref(false)
const compensationFormData = ref({
  id: null,
  pay_id: '',
  indemnitor: '',
  compensationAmount: 0
})

// 过滤数据以显示"确认可赔付"状态的订单
const filteredTableData = computed(() => {
  return tableData.value.filter(item => 
    item.status === OrderStatus.CONFIRMED_PAYMENT
  )
})

onMounted(async () => {
  try {
    console.log('开始获取确认可赔付订单数据，状态:', OrderStatus.CONFIRMED_PAYMENT);
    tableData.value = await fetchData();
    console.log('获取到的所有订单数据:', tableData.value);
  } catch (error) {
    console.error('获取确认可赔付订单数据失败:', error);
  }
});

// 处理行操作事件
const handleRowAction = (action, item) => {
  console.log('处理行操作:', action, item);
  if (action === 'process') {
    openCompensationModal(item);
  }
}

// 打开赔付弹窗
const openCompensationModal = (item) => {
  compensationFormData.value = {
    id: item.id,
    pay_id: item.pay_id,
    indemnitor: item.Indemnitor || '',
    compensationAmount: parseFloat(item['Compensation Amount']) || 0
  }
  showCompensationModal.value = true
}

// 关闭赔付弹窗
const closeCompensationModal = () => {
  showCompensationModal.value = false
  compensationFormData.value = {
    id: null,
    pay_id: '',
    indemnitor: '',
    compensationAmount: 0
  }
}

// 提交赔付结果
const submitCompensation = async () => {
  try {
    console.log('开始赔付订单，订单ID:', compensationFormData.value.id);
    
    // 查找当前正在处理的订单
    const currentItem = tableData.value.find(item => item.id === compensationFormData.value.id);
    console.log('当前订单数据:', currentItem);
    
    if (!currentItem) {
      console.error('找不到ID为', compensationFormData.value.id, '的订单');
      alert('找不到订单数据');
      return;
    }
    
    // 构造完整的更新数据，包含所有必需字段
    let updateDataObj = {
      pay_id: currentItem.pay_id || '',
      'Complaint channel': currentItem['Complaint channel'] || '',
      phone: currentItem.phone || '',
      'Order Amount': currentItem['Order Amount'] || '',
      'Situation Explanation': currentItem['Situation Explanation'] || '',
      Indemnitor: currentItem.Indemnitor || '',  // 使用当前订单的赔付人
      'Compensation Amount': currentItem['Compensation Amount'] || '0.00',  // 使用当前订单的赔付金额
      status: OrderStatus.COMPENSATED,
      time: currentItem.time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      Note: currentItem.Note || '',
      'Classification of Payers': currentItem['Classification of Payers'] || '',
      'Detailed explanation': currentItem['Detailed explanation'] || ''
    };
    
    console.log('构造的更新数据:', updateDataObj);
    
    // 发送更新请求
    await updateData(compensationFormData.value.id, updateDataObj);
    
    // 更新本地数据
    const index = tableData.value.findIndex(item => item.id === compensationFormData.value.id);
    if (index !== -1) {
      tableData.value[index] = { ...tableData.value[index], ...updateDataObj };
    }
    
    // 关闭弹窗
    closeCompensationModal();
    
    alert('订单赔付成功');
  } catch (error) {
    console.error('赔付订单失败:', error);
    alert('赔付订单失败: ' + error.message);
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

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group input:disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
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

.modal-actions button:first-child {
  background-color: #f5f7fa;
  color: #606266;
}

.modal-actions button:last-child {
  background-color: #409eff;
  color: white;
}
</style>