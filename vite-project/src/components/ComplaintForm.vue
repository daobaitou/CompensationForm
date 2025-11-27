<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <DataTable :columns="columns" :data="tableData" 
    :filterableColumns="['投诉渠道', '赔付人']" :showAddButton="true" :showEditButton="true" :enableFullEdit="true"/>
    <!-- 筛条件设置 filterableColumns -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import DataTable from './DataTable.vue'
import { useReportStore } from '../stores/report'
import { fetchData, OrderStatus } from '../services/dataService'


const reportStore = useReportStore()
const title = '投诉订单'
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

const allTableData = ref([])
const tableData = computed(() => {
  // 过滤掉"确认已赔付"和"确认无需赔付"状态的订单
  return allTableData.value.filter(item => 
    item.status !== OrderStatus.COMPENSATED && 
    item.status !== OrderStatus.CONFIRMED_NO_COMPENSATION
  )
})

onMounted(async () => {
  try {
    console.log('开始获取所有数据...');
    allTableData.value = await fetchData();
    console.log('获取到的数据:', allTableData.value);
    console.log('数据总数:', allTableData.value.length);
    
  } catch (error) {
    console.error('获取数据失败:', error);
  }
});

</script>

<style scoped>
.form-container {
  padding: 20px;
}
</style>