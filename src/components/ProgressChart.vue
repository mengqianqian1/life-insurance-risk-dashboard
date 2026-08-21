<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { useEcharts } from '@/composables/useEcharts'
import { RISK_LEVEL_COLOR, RISK_LEVEL_LABEL, type InsuranceProject } from '@/types'

type Metric = 'progress' | 'errorRate'

const props = withDefaults(
  defineProps<{ projects: InsuranceProject[]; metric?: Metric }>(),
  { metric: 'progress' }
)

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useEcharts(chartRef)

function valueOf(p: InsuranceProject): number {
  return props.metric === 'errorRate' ? p.errorRate : p.progress
}

function colorOf(p: InsuranceProject): string {
  if (props.metric === 'errorRate') {
    if (p.errorRate >= 5) return '#ff4d5e'
    if (p.errorRate >= 2) return '#ffb020'
    return '#2ecf7a'
  }
  return RISK_LEVEL_COLOR[p.riskLevel]
}

function buildOption(): EChartsOption {
  const projects = props.projects ?? []
  const isErr = props.metric === 'errorRate'
  const maxValue = projects.length ? Math.max(...projects.map(valueOf)) : 0
  const yMax = isErr ? Math.ceil(maxValue * 1.25 * 100) / 100 : 100
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,20,40,0.92)',
      borderColor: 'rgba(64,158,255,0.4)',
      textStyle: { color: '#e6f0ff' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const proj = projects[p.dataIndex]
        return `${proj.projectName}<br/>${isErr ? '出错率' : '完成进度'}: ${valueOf(proj)}%<br/>风险等级: ${RISK_LEVEL_LABEL[proj.riskLevel]}`
      }
    },
    grid: { left: 8, right: 16, top: 26, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: projects.map((p) => p.projectName),
      axisLine: { lineStyle: { color: 'rgba(64,158,255,0.3)' } },
      axisLabel: { color: '#aab8d6', fontSize: 11, interval: 0, rotate: 28 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      max: yMax,
      axisLabel: { color: '#aab8d6', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(64,158,255,0.1)' } }
    },
    series: [
      {
        type: 'bar',
        barWidth: '52%',
        data: projects.map((p) => {
          const c = colorOf(p)
          return {
            value: valueOf(p),
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: c },
                { offset: 1, color: c + '55' }
              ]),
              borderRadius: [3, 3, 0, 0]
            }
          }
        }),
        label: {
          show: true,
          position: 'top',
          color: '#e6f0ff',
          fontSize: 11,
          formatter: '{c}%'
        }
      }
    ]
  }
}

onMounted(() => setOption(buildOption()))
watch(() => [props.projects, props.metric], () => setOption(buildOption()), { deep: true })
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
