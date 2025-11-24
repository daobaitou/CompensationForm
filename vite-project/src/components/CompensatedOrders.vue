
<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <DataTable 
      :columns="columns" 
      :data="tableData" 
      :filterableColumns="['投诉渠道', '赔付人']" 
      :showAddButton="false"
      :showEditButton="false"
      :showProcessButton="false" />
  </div>
</template>

<script setup>
import { ref, onMounted , computed } from 'vue'
import DataTable from './DataTable.vue'
import { fetchDataByStatus, OrderStatus } from '../services/dataService'

const title = '已赔付订单'
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

const expectedStatus = OrderStatus.COMPENSATED

// 过滤数据以确保只显示预期状态的订单
const filteredTableData = computed(() => {
  return tableData.value.filter(item => item.status === expectedStatus)
})

onMounted(async () => {
  try {
    console.log('开始获取已赔付订单数据，状态:', expectedStatus);
    tableData.value = await fetchDataByStatus(expectedStatus);
    console.log('获取到的已赔付订单数据:', tableData.value);
  } catch (error) {
    console.error('获取已赔付订单数据失败:', error);
  }
});

</script>

<style scoped>
.form-container {
  padding: 20px;
}
</style>
