import { readonly, ref } from 'vue'
import { getDashboardData } from '@/api'
import type { DashboardData, TimeRange } from '@/types'
import { triggerRiskAlert } from '@/composables/useRiskAlert'

/**
 * 全局大屏状态（模块级单例，跨组件共享）
 * - timeRange: 当前时间范围筛选
 * - data:      当前范围对应的聚合数据
 * - loading:   加载状态
 * 切换 timeRange 自动请求聚合接口，所有订阅组件联动刷新
 */
const timeRange = ref<TimeRange>('week')
const data = ref<DashboardData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await getDashboardData(timeRange.value)
    lastUpdated.value = new Date()
    if (data.value.alerts.some((alert) => alert.alertLevel === 'high')) {
      triggerRiskAlert()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '数据加载失败，请稍后重试'
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
    error: readonly(error),
    lastUpdated: readonly(lastUpdated),
    setRange,
    reload: load
  }
}
