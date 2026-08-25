import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/overview' },
  {
    path: '/overview',
    name: 'overview',
    component: () => import('@/views/OverviewView.vue'),
    meta: { title: '风险监控总览' }
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { title: '项目明细' }
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: () => import('@/views/AlertsView.vue'),
    meta: { title: '告警中心' }
  },
  {
    path: '/trend',
    name: 'trend',
    component: () => import('@/views/TrendView.vue'),
    meta: { title: '趋势分析' }
  },
  {
    path: '/project/:projectId',
    name: 'project-detail',
    component: () => import('@/views/ProjectDetailView.vue'),
    meta: { title: '项目详情' },
    // 路由守卫：参数校验，无效 projectId 跳回总览
    beforeEnter: (to, _from, next) => {
      const id = to.params.projectId as string
      // 校验 projectId 格式是否合法（以 P 开头，后跟数字）
      const exists = id && /^P\d+$/.test(id)
      if (!exists) {
        next({ path: '/overview' })
      } else {
        next()
      }
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

/** 动态标题 */
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  if (title) document.title = `寿险风控大屏 - ${title}`
})

export default router
