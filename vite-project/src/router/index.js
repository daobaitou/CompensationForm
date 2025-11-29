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
import Login from '../components/Login.vue' // 添加导入
import LoginLayout from '../components/LoginLayout.vue'
import UserManagement from '../components/UserManagement.vue' // 导入用户管理组件
import { useAuthStore } from '../stores/auth'


const routes = [
  {
    path: '/',
    redirect: '/compensation/Complaint'
  },
  {
    path: '/login',
    component: LoginLayout,
    children: [
      {
        path: '',
        component: Login
      }
    ]
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
  },
  {
    path: '/system/users',
    component: UserManagement,
    meta: { requiresAdmin: true } // 添加管理员权限要求
  }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
  // 如果访问的是登录页，直接放行
  if (to.path === '/login') {
    next()
    return
  }

  // 获取认证状态
  const authStore = useAuthStore()
  
  // 如果还没有初始化认证状态，则初始化
  if (!authStore.token) {
    authStore.initializeAuth()
  }

  // 验证token有效性
  if (authStore.token) {
    const isValid = await authStore.verifyAuth()
    if (isValid) {
      next()
      return
    }
  }

  // 如果没有有效token，重定向到登录页
  next('/login')
})

export default router