<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <DataTable 
      :columns="columns" 
      :data="filteredTableData" 
      :filterableColumns="['投诉渠道', '赔付人']" 
      :showAddButton="false"
      :showEditButton="false"
      :showProcessButton="false" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import DataTable from './DataTable.vue'
import { fetchData, OrderStatus } from '../services/dataService'

const title = '已完成订单'
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

// 过滤数据以显示"确认已赔付"和"确认无需赔付"状态的订单
const filteredTableData = computed(() => {
  return tableData.value.filter(item => 
    item.status === OrderStatus.COMPENSATED || 
    item.status === OrderStatus.CONFIRMED_NO_COMPENSATION
  )
})

onMounted(async () => {
  try {
    console.log('开始获取已完成订单数据');
    tableData.value = await fetchData();
    console.log('获取到的所有订单数据:', tableData.value);
  } catch (error) {
    console.error('获取已完成订单数据失败:', error);
  }
});
</script>

<style scoped>
.form-container {
  padding: 20px;
}
</style>