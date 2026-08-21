<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import { useEcharts } from '@/composables/useEcharts'
import { RISK_LEVEL_COLOR, RISK_LEVEL_LABEL, type RiskLevelStat } from '@/types'

const props = defineProps<{ data: RiskLevelStat[] }>()

const chartRef = ref<HTMLElement | null>(null)
const { setOption } = useEcharts(chartRef)

function buildOption(): EChartsOption {
  const d = props.data ?? []
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 个 ({d}%)',
      backgroundColor: 'rgba(10,20,40,0.92)',
      borderColor: 'rgba(64,158,255,0.4)',
      textStyle: { color: '#e6f0ff' }
    },
    legend: {
      bottom: 8,
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 18,
      textStyle: { color: '#aab8d6', fontSize: 13 },
      data: d.map((i) => RISK_LEVEL_LABEL[i.level])
    },
    series: [
      {
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#0a1428',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{d}%',
          color: '#e6f0ff',
          fontSize: 13
        },
        labelLine: { length: 8, length2: 10 },
        data: d.map((i) => ({
          name: RISK_LEVEL_LABEL[i.level],
          value: i.count,
          itemStyle: { color: RISK_LEVEL_COLOR[i.level] }
        }))
      }
    ]
  }
}

onMounted(() => setOption(buildOption()))
watch(() => props.data, () => setOption(buildOption()), { deep: true })
</script>

<style scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
