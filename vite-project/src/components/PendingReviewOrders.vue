<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <DataTable 
      :columns="columns" 
      :data="filteredTableData" 
      :filterableColumns="['投诉渠道', '赔付人']" 
      :showAddButton="false"
      :showEditButton="false"
      :showProcessButton="hasProcessPermission"
      @row-action="handleRowAction" />
    
    <!-- 审核弹窗 - 需赔付订单 -->
    <div v-if="showReviewModalForNeed" class="modal" @click="closeReviewModalForNeed">
      <div class="modal-content" @click.stop>
        <h2>审核需赔付订单</h2>
        <div class="form-group">
          <label>支付编码:</label>
          <input type="text" v-model="reviewFormDataForNeed.pay_id" disabled />
        </div>
        
        <div class="form-group">
          <label>处理结果:</label>
          <select v-model="reviewFormDataForNeed.status" required>
            <option value="CONFIRMED_PAYMENT">同意赔付</option>
            <option value="REJECTED_NEED_COMPENSATION">驳回订单</option>
          </select>
        </div>
        
        <div class="form-group" v-if="reviewFormDataForNeed.status === 'CONFIRMED_PAYMENT'">
          <label>审核意见:</label>
          <textarea v-model="reviewFormDataForNeed.reviewComment" rows="4" placeholder="请输入审核意见"></textarea>
        </div>
        
        <div class="form-group" v-if="reviewFormDataForNeed.status === 'REJECTED_NEED_COMPENSATION'">
          <label>驳回理由:</label>
          <textarea v-model="reviewFormDataForNeed.rejectReason" rows="4" placeholder="请输入驳回理由"></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="closeReviewModalForNeed">取消</button>
          <button type="button" @click="submitReviewForNeed">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 审核弹窗 - 无需赔付订单 -->
    <div v-if="showReviewModalForNo" class="modal" @click="closeReviewModalForNo">
      <div class="modal-content" @click.stop>
        <h2>审核无需赔付订单</h2>
        <div class="form-group">
          <label>支付编码:</label>
          <input type="text" v-model="reviewFormDataForNo.pay_id" disabled />
        </div>
        
        <div class="form-group">
          <label>处理结果:</label>
          <select v-model="reviewFormDataForNo.status" required>
            <option value="CONFIRMED_NO_COMPENSATION">同意不赔付</option>
            <option value="REJECTED_NO_COMPENSATION">驳回订单</option>
          </select>
        </div>
        
        <div class="form-group" v-if="reviewFormDataForNo.status === 'CONFIRMED_NO_COMPENSATION'">
          <label>审核意见:</label>
          <textarea v-model="reviewFormDataForNo.reviewComment" rows="4" placeholder="请输入审核意见"></textarea>
        </div>
        
        <div class="form-group" v-if="reviewFormDataForNo.status === 'REJECTED_NO_COMPENSATION'">
          <label>驳回理由:</label>
          <textarea v-model="reviewFormDataForNo.rejectReason" rows="4" placeholder="请输入驳回理由"></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="closeReviewModalForNo">取消</button>
          <button type="button" @click="submitReviewForNo">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import DataTable from './DataTable.vue'
import { useAuthStore } from '../stores/auth'
import { fetchData, updateData, OrderStatus } from '../services/dataService'

const authStore = useAuthStore()

const title = '待审核订单'
const columns = [
  { key: 'pay_id', title: '支付编码' },
  { key: 'Complaint channel', title: '投诉渠道' },
  { key: 'phone', title: '投诉人电话' },
  { key: 'Order Amount', title: '订单金额' },
  { key: 'Situation Explanation', title: '情况说明' },
  { key: 'Indemnitor', title: '赔付人' },
  { key: 'Compensation Amount', title: '赔付金额' },
  { key: 'status', title: '状态' },
  { key: 'time', title: '投诉单下单日期' },
  { key: 'Note', title: '备注' }
]

const tableData = ref([])

// 计算属性：检查用户是否有处理待审核订单权限
const hasProcessPermission = computed(() => {
    return authStore.isAdmin || authStore.hasPermission('process_pending_review_order');
});

// 弹窗相关状态 - 需赔付订单
const showReviewModalForNeed = ref(false)
const reviewFormDataForNeed = ref({
  id: null,
  pay_id: '',
  status: 'CONFIRMED_PAYMENT',
  rejectReason: '',
  reviewComment: '' // 新增审核意见字段
})

// 弹窗相关状态 - 无需赔付订单
const showReviewModalForNo = ref(false)
const reviewFormDataForNo = ref({
  id: null,
  pay_id: '',
  status: 'CONFIRMED_NO_COMPENSATION',
  rejectReason: '',
  reviewComment: '' // 新增审核意见字段
})

// 过滤数据以显示"需赔付订单"和"无需赔付订单"状态的订单
const filteredTableData = computed(() => {
  return tableData.value.filter(item => 
    item.status === OrderStatus.NEED_COMPENSATION || 
    item.status === OrderStatus.NO_COMPENSATION
  )
})

onMounted(async () => {
  try {
    console.log('开始获取待审核订单数据');
    tableData.value = await fetchData();
    console.log('获取到的所有订单数据:', tableData.value);
  } catch (error) {
    console.error('获取待审核订单数据失败:', error);
  }
});

// 处理行操作事件
const handleRowAction = (action, item) => {
  if (action === 'process') {
    if (item.status === OrderStatus.NEED_COMPENSATION) {
      // 对于需赔付订单，打开审核弹窗
      openReviewModalForNeed(item);
    } else if (item.status === OrderStatus.NO_COMPENSATION) {
      // 对于无需赔付订单，打开审核弹窗
      openReviewModalForNo(item);
    }
  }
}

// 打开审核弹窗 - 需赔付订单
const openReviewModalForNeed = (item) => {
  reviewFormDataForNeed.value = {
    id: item.id,
    pay_id: item.pay_id,
    status: 'CONFIRMED_PAYMENT',
    rejectReason: '',
    reviewComment: ''
  }
  showReviewModalForNeed.value = true
}

// 关闭审核弹窗 - 需赔付订单
const closeReviewModalForNeed = () => {
  showReviewModalForNeed.value = false
  reviewFormDataForNeed.value = {
    id: null,
    pay_id: '',
    status: 'CONFIRMED_PAYMENT',
    rejectReason: '',
    reviewComment: ''
  }
}

// 提交审核结果 - 需赔付订单
const submitReviewForNeed = async () => {
  try {
    console.log('开始审核需赔付订单，订单ID:', reviewFormDataForNeed.value.id);
    
    // 查找当前正在处理的订单
    const currentItem = tableData.value.find(item => item.id === reviewFormDataForNeed.value.id);
    console.log('当前订单数据:', currentItem);
    
    if (!currentItem) {
      console.error('找不到ID为', reviewFormDataForNeed.value.id, '的订单');
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
      Indemnitor: currentItem.Indemnitor || '',
      'Compensation Amount': currentItem['Compensation Amount'] || '0.00',
      status: '',
      time: currentItem.time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      Note: currentItem.Note || '',
      'Classification of Payers': currentItem['Classification of Payers'] || '',
      'Detailed explanation': currentItem['Detailed explanation'] || ''
    };
    
    console.log('构造的基础更新数据:', updateDataObj);

    // 根据选择的状态设置更新数据
    if (reviewFormDataForNeed.value.status === 'CONFIRMED_PAYMENT') {
      // 确认可赔付
      updateDataObj.status = OrderStatus.CONFIRMED_PAYMENT;
      // 添加审核意见到备注字段
      if (reviewFormDataForNeed.value.reviewComment) {
        const separator = updateDataObj.Note ? '\n' : '';
        updateDataObj.Note += `${separator}审核意见：${reviewFormDataForNeed.value.reviewComment}`;
      }
      console.log('设置状态为确认可赔付');
    } else if (reviewFormDataForNeed.value.status === 'REJECTED_NEED_COMPENSATION') {
      // 驳回需赔付订单
      updateDataObj.status = OrderStatus.REJECTED_NEED_COMPENSATION;
      // 将驳回理由添加到备注中
      if (reviewFormDataForNeed.value.rejectReason) {
        const separator = updateDataObj.Note ? '\n' : '';
        updateDataObj.Note += `${separator}驳回理由：${reviewFormDataForNeed.value.rejectReason}`;
      }
      console.log('设置状态为被驳回需赔付订单，驳回理由:', reviewFormDataForNeed.value.rejectReason);
    }
    
    console.log('最终更新数据:', updateDataObj);

    // 验证必填字段
    if (!updateDataObj.pay_id || updateDataObj.pay_id.length !== 28) {
      console.error('支付编码验证失败:', updateDataObj.pay_id, '长度:', updateDataObj.pay_id.length);
      alert('支付编码必须为28位');
      return;
    }
    
    if (!updateDataObj.phone || updateDataObj.phone.length !== 11) {
      console.error('手机号验证失败:', updateDataObj.phone, '长度:', updateDataObj.phone.length);
      alert('手机号必须为11位');
      return;
    }

    console.log('数据验证通过，准备发送更新请求，订单ID:', reviewFormDataForNeed.value.id);
    // 发送更新请求
    const result = await updateData(reviewFormDataForNeed.value.id, updateDataObj)
    console.log('更新请求成功，返回结果:', result);

    // 更新本地数据
    const index = tableData.value.findIndex(item => item.id === reviewFormDataForNeed.value.id)
    if (index !== -1) {
      tableData.value[index].status = updateDataObj.status;
      if (updateDataObj.Note) {
        tableData.value[index].Note = updateDataObj.Note;
      }
    }

    // 关闭弹窗
    closeReviewModalForNeed()

    alert('审核完成！')
  } catch (error) {
    console.error('审核失败:', error)
    alert('审核失败: ' + error.message)
  }
}

// 打开审核弹窗 - 无需赔付订单
const openReviewModalForNo = (item) => {
  reviewFormDataForNo.value = {
    id: item.id,
    pay_id: item.pay_id,
    status: 'CONFIRMED_NO_COMPENSATION',
    rejectReason: '',
    reviewComment: ''
  }
  showReviewModalForNo.value = true
}

// 关闭审核弹窗 - 无需赔付订单
const closeReviewModalForNo = () => {
  showReviewModalForNo.value = false
  reviewFormDataForNo.value = {
    id: null,
    pay_id: '',
    status: 'CONFIRMED_NO_COMPENSATION',
    rejectReason: '',
    reviewComment: ''
  }
}

// 提交审核结果 - 无需赔付订单
const submitReviewForNo = async () => {
  try {
    console.log('开始审核无需赔付订单，订单ID:', reviewFormDataForNo.value.id);
    
    // 查找当前正在处理的订单
    const currentItem = tableData.value.find(item => item.id === reviewFormDataForNo.value.id);
    console.log('当前订单数据:', currentItem);
    
    if (!currentItem) {
      console.error('找不到ID为', reviewFormDataForNo.value.id, '的订单');
      alert('找不到订单数据');
      return;
    }
    
    // 构造完整的更新数据，包含所有必需字段，并确保字段名与数据库匹配
    let updateDataObj = {
      pay_id: currentItem.pay_id || '',
      'Complaint channel': currentItem['Complaint channel'] || '',
      phone: currentItem.phone || '',
      'Order Amount': currentItem['Order Amount'] || '0.00',
      'Situation Explanation': currentItem['Situation Explanation'] || '',
      Indemnitor: currentItem.Indemnitor || '',
      'Compensation Amount': currentItem['Compensation Amount'] || '0.00',
      status: '',
      time: currentItem.time || new Date().toISOString().slice(0, 19).replace('T', ' '),
      Note: currentItem.Note || '',
      'Classification of Payers': currentItem['Classification of Payers'] || '',
      'Detailed explanation': currentItem['Detailed explanation'] || ''
    };
    
    console.log('构造的基础更新数据:', updateDataObj);

    // 根据选择的状态设置更新数据
    if (reviewFormDataForNo.value.status === 'CONFIRMED_NO_COMPENSATION') {
      // 确认无需赔付
      updateDataObj.status = OrderStatus.CONFIRMED_NO_COMPENSATION;
      // 添加审核意见到备注字段
      if (reviewFormDataForNo.value.reviewComment) {
        const separator = updateDataObj.Note ? '\n' : '';
        updateDataObj.Note += `${separator}审核意见：${reviewFormDataForNo.value.reviewComment}`;
      }
      console.log('设置状态为确认无需赔付');
    } else if (reviewFormDataForNo.value.status === 'REJECTED_NO_COMPENSATION') {
      // 驳回无需赔付订单
      updateDataObj.status = OrderStatus.REJECTED_NO_COMPENSATION;
      // 将驳回理由添加到备注中
      if (reviewFormDataForNo.value.rejectReason) {
        const separator = updateDataObj.Note ? '\n' : '';
        updateDataObj.Note += `${separator}驳回理由：${reviewFormDataForNo.value.rejectReason}`;
      }
      console.log('设置状态为被驳回无需赔付，驳回理由:', reviewFormDataForNo.value.rejectReason);
    }
    
    console.log('最终更新数据:', updateDataObj);

    // 验证必填字段
    if (!updateDataObj.pay_id || updateDataObj.pay_id.length !== 28) {
      console.error('支付编码验证失败:', updateDataObj.pay_id, '长度:', updateDataObj.pay_id.length);
      alert('支付编码必须为28位');
      return;
    }
    
    if (!updateDataObj.phone || updateDataObj.phone.length !== 11) {
      console.error('手机号验证失败:', updateDataObj.phone, '长度:', updateDataObj.phone.length);
      alert('手机号必须为11位');
      return;
    }

    console.log('数据验证通过，准备发送更新请求，订单ID:', reviewFormDataForNo.value.id);
    console.log('发送的数据字符串化后:', JSON.stringify(updateDataObj));
    
    // 发送更新请求
    const result = await updateData(reviewFormDataForNo.value.id, updateDataObj)
    console.log('更新请求成功，返回结果:', result);

    // 更新本地数据
    const index = tableData.value.findIndex(item => item.id === reviewFormDataForNo.value.id)
    if (index !== -1) {
      tableData.value[index].status = updateDataObj.status;
      if (updateDataObj.Note) {
        tableData.value[index].Note = updateDataObj.Note;
      }
      console.log('本地数据更新完成，更新后的数据:', tableData.value[index]);
    }

    // 关闭弹窗
    closeReviewModalForNo()

    alert('审核完成！')
  } catch (error) {
    console.error('审核失败，详细错误信息:', error);
    console.error('错误堆栈:', error.stack);
    alert('审核失败: ' + error.message)
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
  justify-content: space-between;
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