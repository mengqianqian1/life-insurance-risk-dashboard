<template>
  <div class="view trend">
    <div class="panel trend-main">
      <div class="panel-header">
        <div class="panel-title">项目出错率变化趋势</div>
        <span class="panel-sub">{{ rangeLabel }}</span>
      </div>
      <div class="panel-body">
        <ErrorTrendChart :trend="trend" />
      </div>
    </div>

    <section class="trend-bottom">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">{{ barTitle }}</div>
          <div class="toolbar">
            <el-radio-group v-model="metric" size="small">
              <el-radio-button value="errorRate">出错率</el-radio-button>
              <el-radio-button value="progress">完成进度</el-radio-button>
            </el-radio-group>
            <el-select v-model="riskFilter" placeholder="风险等级" size="small">
              <el-option label="全部等级" value="all" />
              <el-option
                v-for="r in riskLevels"
                :key="r"
                :label="RISK_LEVEL_LABEL[r]"
                :value="r"
              />
            </el-select>
          </div>
        </div>
        <div class="panel-body">
          <ProgressChart :projects="filteredProjects" :metric="metric" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">风险等级占比</div>
          <span class="panel-sub">高 / 中 / 低</span>
        </div>
        <div class="panel-body">
          <RiskPieChart :data="riskStats" />
        </div>
      </div>
    </section>

    <div v-if="loading && !data" class="loading-mask">数据加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ErrorTrendChart from '@/components/charts/ErrorTrendChart.vue'
import ProgressChart from '@/components/charts/ProgressChart.vue'
import RiskPieChart from '@/components/charts/RiskPieChart.vue'
import { useDashboardStore } from '@/composables/useDashboardStore'
import { RISK_LEVEL_LABEL, TIME_RANGE_LABEL, type RiskLevel } from '@/types'

const { data, loading, timeRange } = useDashboardStore()

const trend = computed(() => data.value?.trend ?? [])
const projects = computed(() => data.value?.projects ?? [])
const riskStats = computed(() => data.value?.riskLevelStats ?? [])
const rangeLabel = computed(() => '近 ' + TIME_RANGE_LABEL[timeRange.value])

type Metric = 'progress' | 'errorRate'
type RiskFilter = 'all' | RiskLevel
const metric = ref<Metric>('errorRate')
const riskFilter = ref<RiskFilter>('all')
const riskLevels: RiskLevel[] = ['high', 'medium', 'low']

const barTitle = computed(() =>
  metric.value === 'errorRate' ? '各项目出错率排行' : '各项目完成进度'
)

const filteredProjects = computed(() => {
  if (riskFilter.value === 'all') return projects.value
  return projects.value.filter((p) => p.riskLevel === riskFilter.value)
})
</script>

<style scoped>
.trend {
  position: relative;
}
.trend-main {
  flex: 1.3;
  min-height: 0;
}
.trend-bottom {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--gap);
}
</style>
