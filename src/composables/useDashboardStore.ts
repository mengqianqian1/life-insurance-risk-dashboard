import { readonly, ref } from 'vue'
import { fetchDashboardData } from '@/mock'
import type { DashboardData, TimeRange } from '@/types'

/**
 * 全局大屏状态（模块级单例，跨组件共享）
 * - timeRange: 当前时间范围筛选
 * - data:      当前范围对应的聚合数据
 * - loading:   加载状态
 * 切换 timeRange 自动重新拉取 mock 数据，所有订阅组件联动刷新
 */
const timeRange = ref<TimeRange>('week')
const data = ref<DashboardData | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    data.value = await fetchDashboardData(timeRange.value)
  } finally {
    loading.value = false
  }
}

function setRange(range: TimeRange) {
  if (range === timeRange.value) return
  timeRange.value = range
  load()
}

// 模块加载时首次拉取
void load()

export function useDashboardStore() {
  return {
    timeRange: readonly(timeRange),
    data,
    loading: readonly(loading),
    setRange,
    reload: load
  }
}
