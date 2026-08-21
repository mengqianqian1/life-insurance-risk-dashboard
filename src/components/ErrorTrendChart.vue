<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useEcharts } from '@/composables/useEcharts'
import type { TrendPoint } from '@/types'

const props = defineProps<{ trend: TrendPoint[] }>()

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useEcharts(chartRef)

function buildOption(): EChartsOption {
  const t = props.trend ?? []
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,20,40,0.92)',
      borderColor: 'rgba(64,158,255,0.4)',
      textStyle: { color: '#e6f0ff' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        return `${p.axisValue}<br/>出错率: ${p.value}%`
      }
    },
    grid: { left: 8, right: 20, top: 20, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: t.map((i) => i.time),
      boundaryGap: false,
      axisLine: { lineStyle: { color: 'rgba(64,158,255,0.3)' } },
      axisLabel: { color: '#aab8d6', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#aab8d6', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(64,158,255,0.1)' } }
    },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: t.map((i) => i.errorRate),
        lineStyle: { color: '#18e0ff', width: 2 },
        itemStyle: { color: '#18e0ff', borderColor: '#fff', borderWidth: 1 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24,224,255,0.4)' },
            { offset: 1, color: 'rgba(24,224,255,0.02)' }
          ])
        }
      }
    ]
  }
}

onMounted(() => setOption(buildOption()))
watch(() => props.trend, () => setOption(buildOption()), { deep: true })
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
