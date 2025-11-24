<template>
  <div class="form-container">
    <h1>{{ title }}</h1>
    <!-- 复用现有的 DataTable 组件 -->
    <DataTable :columns="basicColumns" :data="tableData"
    :filterableColumns="['投诉渠道', '赔付人']" :showAddButton="false"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'  
import DataTable from './DataTable.vue'
import { fetchDataByStatus, OrderStatus } from '../services/dataService'

const title = '无需赔付订单'

const basicColumns = [
  { key: 'pay_id', title: '支付编码' },
  { key: 'Complaint channel', title: '投诉渠道' },
  { key: 'phone', title: '电话' },
  { key: 'Order Amount', title: '订单金额' },
  { key: 'Situation Explanation', title: '情况说明' },
  { key: 'Indemnitor', title: '赔付人' },
  { key: 'Compensation Amount', title: '赔付金额' },
  { key: 'status', title: '处理结果' },
  { key: 'time', title: '投诉单下单日期' },
  { key: 'Note', title: '备注' }
]

const tableData = ref([])

onMounted(async () => {
  try {
    console.log('请求无需赔付订单数据，状态:', OrderStatus.NO_COMPENSATION)
    tableData.value = await fetchDataByStatus(OrderStatus.NO_COMPENSATION)
    console.log('获取到的无需赔付订单数据:', tableData.value)
  } catch (error) {
    console.error('获取数据失败:', error)
  }
})

</script>

<style scoped>
.form-container {
  padding: 20px;
}
</style>