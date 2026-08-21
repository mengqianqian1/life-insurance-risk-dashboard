import * as echarts from 'echarts'
import { onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue'
import type { EChartsOption } from 'echarts'

/**
 * ECharts 实例管理：初始化、setOption、resize、销毁
 * - 用 ResizeObserver 监听容器尺寸，大屏 stage 高度变化时自动 resize
 * - 组件卸载时自动 disconnect + dispose，避免内存泄漏
 */
export function useEcharts(el: Ref<HTMLElement | null>) {
  // 用 shallowRef 存放实例，避免 Vue 对其做响应式代理
  const chart = shallowRef<echarts.ECharts | null>(null)
  let resizeObserver: ResizeObserver | null = null

  function setOption(option: EChartsOption) {
    if (!el.value) return
    if (!chart.value) {
      chart.value = echarts.init(el.value)
    }
    chart.value.setOption(option, true)
  }

  function resize() {
    chart.value?.resize()
  }

  function dispose() {
    chart.value?.dispose()
    chart.value = null
  }

  onMounted(() => {
    if (el.value) {
      resizeObserver = new ResizeObserver(() => {
        chart.value?.resize()
      })
      resizeObserver.observe(el.value)
    }
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    dispose()
  })

  return { chart, setOption, resize, dispose }
}
