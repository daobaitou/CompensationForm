import { createRouter, createWebHistory } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import BasicForm from '../components/BasicForm.vue'
import ComplaintForm from '../components/ComplaintForm.vue'
import DailyReport from '../components/DailyReport.vue'
import MonthlyReport from '../components/MonthlyReport.vue'
import CompensatedOrders from '../components/CompensatedOrders.vue'
import ConfirmedNoCompensationOrders from '../components/ConfirmedNoCompensationOrders.vue'
import NeedCompensationOrders from '../components/NeedCompensationOrders.vue'
import NoCompensationOrders from '../components/NoCompensationOrders.vue'
import ConfirmedPaymentOrders from '../components/ConfirmedPaymentOrders.vue'
import PendingReviewOrders from '../components/PendingReviewOrders.vue'
import CompletedOrders from '../components/CompletedOrders.vue'

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
    path: '/compensation/compensated',
    component: CompensatedOrders
  },
  {
    path: '/compensation/confirmed-no-compensation',
    component: ConfirmedNoCompensationOrders
  },
  {
    path: '/compensation/need-compensation',
    component: NeedCompensationOrders
  },
  {
    path: '/compensation/no-compensation',
    component: NoCompensationOrders
  },
  {
    path: '/compensation/confirmed-payment',
    component: ConfirmedPaymentOrders
  },
  {
    path: '/compensation/pending-review',
    component: PendingReviewOrders
  },
  {
    path: '/compensation/completed',
    component: CompletedOrders
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