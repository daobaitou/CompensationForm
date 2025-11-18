import { createRouter, createWebHistory } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import BasicForm from '../components/BasicForm.vue'
import ComplaintForm from '../components/ComplaintForm.vue'
import DailyReport from '../components/DailyReport.vue'
import MonthlyReport from '../components/MonthlyReport.vue'

const routes = [
  {
    path: '/',
    redirect: '/compensation/Complaint'
  },
  {
    path: '/compensation/basic',
    component: BasicForm
  },
  {
    path: '/compensation/Complaint',
    component: ComplaintForm
  },
  {
    path: '/statistics/daily',
    component: DailyReport
  },
  {
    path: '/statistics/monthly',
    component: MonthlyReport
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router