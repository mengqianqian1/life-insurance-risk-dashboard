<template>
  <div class="view overview">
    <!-- 上：4 个指标卡片 -->
    <section class="stat-row">
      <StatCard
        v-for="card in cards"
        :key="card.title"
        :title="card.title"
        :value="card.value"
        :unit="card.unit"
        :color="card.color"
        :icon-text="card.iconText"
      />
    </section>

    <!-- 中：饼图 + 柱状图 -->
    <section class="chart-row">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">风险等级项目占比</div>
          <span class="panel-sub">按高 / 中 / 低风险聚合</span>
        </div>
        <div class="panel-body">
          <RiskPieChart :data="riskStats" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">各项目完成进度对比</div>
          <span class="panel-sub">柱色按风险等级区分</span>
        </div>
        <div class="panel-body">
          <ProgressChart :projects="projects" @bar-click="handleBarClick" />
        </div>
      </div>
    </section>

    <!-- 下：折线图 + 告警列表 -->
    <section class="bottom-row">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">项目出错率变化趋势</div>
          <span class="panel-sub">{{ rangeLabel }}</span>
        </div>
        <div class="panel-body">
          <ErrorTrendChart :trend="trend" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">实时风险告警</div>
          <span class="alert-count">共 {{ alertCount }} 条</span>
        </div>
        <div class="panel-body">
          <AlertList :alerts="alerts" />
        </div>
      </div>
    </section>

    <div v-if="loading && !data" class="loading-mask">数据加载中...</div>
  </div>
</template>

<script setup lang="ts">
// 定义组件名，用于 keep-alive include 匹配
defineOptions({ name: 'OverviewView' })

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/StatCard.vue'
import RiskPieChart from '@/components/RiskPieChart.vue'
import ProgressChart from '@/components/ProgressChart.vue'
import ErrorTrendChart from '@/components/ErrorTrendChart.vue'
import AlertList from '@/components/AlertList.vue'
import { useDashboardStore } from '@/composables/useDashboardStore'
import { TIME_RANGE_LABEL, type InsuranceProject } from '@/types'

const router = useRouter()

const { data, loading, timeRange } = useDashboardStore()

interface StatCardConfig {
  title: string
  value: string | number
  unit: string
  color: string
  iconText: string
}

const cards = computed<StatCardConfig[]>(() => {
  const s = data.value?.stat
  return [
    { title: '总项目数量', value: s?.totalProjects ?? 0, unit: '', color: '#18e0ff', iconText: '项' },
    { title: '高风险项目数', value: s?.highRiskCount ?? 0, unit: '', color: '#ff4d5e', iconText: '险' },
    { title: '平均项目完成进度', value: s?.avgProgress ?? 0, unit: '%', color: '#2ecf7a', iconText: '度' },
    { title: '项目平均出错率', value: s?.avgErrorRate ?? 0, unit: '%', color: '#ffb020', iconText: '率' }
  ]
})

const riskStats = computed(() => data.value?.riskLevelStats ?? [])
const projects = computed(() => data.value?.projects ?? [])
const trend = computed(() => data.value?.trend ?? [])
const alerts = computed(() => data.value?.alerts ?? [])
const alertCount = computed(() => data.value?.alerts.length ?? 0)
const rangeLabel = computed(() => '近 ' + TIME_RANGE_LABEL[timeRange.value])

/**
 * 点击柱状图跳转项目详情页
 */
function handleBarClick(project: InsuranceProject) {
  router.push({
    name: 'project-detail',
    params: { projectId: project.projectId },
    query: { from: 'overview' }
  })
}
</script>

<style scoped>
.overview {
  position: relative;
}

.stat-row {
  flex: 0 0 132px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap);
}

.chart-row {
  flex: 0 0 320px;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: var(--gap);
}

.bottom-row {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--gap);
}

.panel-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.alert-count {
  font-size: 12px;
  color: var(--risk-high);
  background: rgba(255, 77, 94, 0.12);
  padding: 2px 10px;
  border-radius: 10px;
}
</style>
