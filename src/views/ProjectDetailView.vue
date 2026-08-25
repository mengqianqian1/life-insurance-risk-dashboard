<template>
  <div class="view project-detail">
    <!-- 顶部：返回按钮 + 项目标题 -->
    <section class="detail-header">
      <button class="back-btn" @click="goBack">
        <span class="back-icon">←</span>
        <span>返回总览</span>
      </button>
      <div class="header-info">
        <h1 class="project-name">{{ detail?.projectName || '项目详情' }}</h1>
        <div class="project-meta">
          <span class="meta-item">项目ID: {{ detail?.projectId }}</span>
          <span class="meta-item">负责人: {{ detail?.owner }}</span>
          <span
            class="risk-tag"
            :class="'risk-' + detail?.riskLevel"
            v-if="detail"
          >
            {{ RISK_LEVEL_LABEL[detail.riskLevel] }}
          </span>
        </div>
      </div>
    </section>

    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-mask">
      <div class="loading-spinner"></div>
      <span>加载项目详情中...</span>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="error-mask">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadData">重试</button>
    </div>

    <template v-else-if="detail">
      <!-- 关键指标卡片 -->
      <section class="metric-row">
        <div class="metric-card">
          <div class="metric-label">完成进度</div>
          <div class="metric-value" :style="{ color: RISK_LEVEL_COLOR[detail.riskLevel] }">
            {{ detail.progress }}%
          </div>
          <div class="metric-bar">
            <div
              class="metric-bar-fill"
              :style="{
                width: detail.progress + '%',
                background: RISK_LEVEL_COLOR[detail.riskLevel]
              }"
            ></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">出错率</div>
          <div
            class="metric-value"
            :style="{ color: getErrorRateColor(detail.errorRate) }"
          >
            {{ detail.errorRate }}%
          </div>
          <div class="metric-bar">
            <div
              class="metric-bar-fill"
              :style="{
                width: Math.min(detail.errorRate * 10, 100) + '%',
                background: getErrorRateColor(detail.errorRate)
              }"
            ></div>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">累计保单</div>
          <div class="metric-value">{{ detail.totalPolicies.toLocaleString() }}</div>
          <div class="metric-unit">件</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">累计保费</div>
          <div class="metric-value">{{ detail.totalPremium.toLocaleString() }}</div>
          <div class="metric-unit">万元</div>
        </div>
      </section>

      <!-- 项目基本信息 -->
      <section class="info-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">项目基本信息</div>
          </div>
          <div class="panel-body info-grid">
            <div class="info-item">
              <span class="info-label">启动日期</span>
              <span class="info-value">{{ detail.startDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预计完成</span>
              <span class="info-value">{{ detail.expectedEndDate }}</span>
            </div>
            <div class="info-item info-full">
              <span class="info-label">项目描述</span>
              <span class="info-value desc">{{ detail.description }}</span>
            </div>
            <div class="info-item info-full">
              <span class="info-label">团队成员</span>
              <div class="team-list">
                <span
                  v-for="member in detail.teamMembers"
                  :key="member"
                  class="team-tag"
                >{{ member }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">关键指标</div>
          </div>
          <div class="panel-body key-metrics">
            <div v-for="metric in detail.keyMetrics" :key="metric.label" class="key-metric">
              <div class="km-label">{{ metric.label }}</div>
              <div class="km-value">
                {{ metric.value }}
                <span v-if="metric.unit" class="km-unit">{{ metric.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 对比数据 -->
      <section class="compare-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">本月 vs 上月数据对比</div>
            <span class="panel-sub">点击图例可切换显示</span>
          </div>
          <div class="panel-body">
            <div ref="compareChartRef" class="chart-container"></div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">指标变化率</div>
          </div>
          <div class="panel-body changes-list">
            <div class="change-item">
              <span class="change-label">完成进度</span>
              <span
                class="change-value"
                :class="changes.progress >= 0 ? 'up' : 'down'"
              >
                {{ formatChange(changes.progress) }}
              </span>
            </div>
            <div class="change-item">
              <span class="change-label">出错率</span>
              <span
                class="change-value"
                :class="changes.errorRate <= 0 ? 'up' : 'down'"
              >
                {{ formatChange(changes.errorRate) }}
              </span>
              <span class="change-note">(出错率越低越好)</span>
            </div>
            <div class="change-item">
              <span class="change-label">保单数</span>
              <span
                class="change-value"
                :class="changes.policies >= 0 ? 'up' : 'down'"
              >
                {{ formatChange(changes.policies) }}
              </span>
            </div>
            <div class="change-item">
              <span class="change-label">保费收入</span>
              <span
                class="change-value"
                :class="changes.premium >= 0 ? 'up' : 'down'"
              >
                {{ formatChange(changes.premium) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 月度趋势 -->
      <section class="trend-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">近6个月项目趋势</div>
            <span class="panel-sub">完成进度 & 出错率变化</span>
          </div>
          <div class="panel-body">
            <div ref="trendChartRef" class="chart-container trend-chart"></div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { fetchProjectCompare, fetchProjectDetail } from '@/mock'
import {
  RISK_LEVEL_COLOR,
  RISK_LEVEL_LABEL,
  type ProjectCompareData,
  type ProjectDetail
} from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const detail = ref<ProjectDetail | null>(null)
const compareData = ref<ProjectCompareData | null>(null)

// 图表 DOM 引用
const compareChartRef = ref<HTMLElement | null>(null)
const trendChartRef = ref<HTMLElement | null>(null)

// ECharts 实例
const compareChart = shallowRef<echarts.ECharts | null>(null)
const trendChart = shallowRef<echarts.ECharts | null>(null)
let compareObserver: ResizeObserver | null = null
let trendObserver: ResizeObserver | null = null

/**
 * 获取错误率对应的颜色
 */
function getErrorRateColor(rate: number): string {
  if (rate >= 5) return '#ff4d5e'
  if (rate >= 2) return '#ffb020'
  return '#2ecf7a'
}

/**
 * 格式化变化率显示
 */
function formatChange(val: number): string {
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val}%`
}

/**
 * 计算变化率数据
 */
const changes = computed(() => {
  if (!compareData.value) {
    return { progress: 0, errorRate: 0, policies: 0, premium: 0 }
  }
  return compareData.value.changes
})

/**
 * 加载数据
 */
async function loadData() {
  const projectId = route.params.projectId as string
  if (!projectId) {
    error.value = '无效的项目ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const [detailRes, compareRes] = await Promise.all([
      fetchProjectDetail(projectId),
      fetchProjectCompare(projectId)
    ])

    if (!detailRes) {
      error.value = '未找到该项目详情'
      loading.value = false
      return
    }

    detail.value = detailRes
    compareData.value = compareRes
    loading.value = false

    // 数据加载完成后初始化图表
    initCharts()
  } catch (e) {
    error.value = '加载数据失败，请稍后重试'
    loading.value = false
  }
}

/**
 * 初始化对比柱状图
 */
function initCompareChart() {
  if (!compareChartRef.value || !compareData.value) return

  if (!compareChart.value) {
    compareChart.value = echarts.init(compareChartRef.value)
    compareObserver = new ResizeObserver(() => compareChart.value?.resize())
    compareObserver.observe(compareChartRef.value)
  }

  const data = compareData.value
  const metrics = ['完成进度', '出错率', '保单数', '保费']
  const currentValues = [
    data.currentMonth.progress,
    data.currentMonth.errorRate,
    data.currentMonth.policies,
    data.currentMonth.premium
  ]
  const previousValues = [
    data.previousMonth.progress,
    data.previousMonth.errorRate,
    data.previousMonth.policies,
    data.previousMonth.premium
  ]

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,20,40,0.92)',
      borderColor: 'rgba(64,158,255,0.4)',
      textStyle: { color: '#e6f0ff' }
    },
    legend: {
      data: ['本月', '上月'],
      textStyle: { color: '#aab8d6' },
      top: 0,
      right: 10
    },
    grid: { left: 50, right: 20, top: 40, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: metrics,
      axisLine: { lineStyle: { color: 'rgba(64,158,255,0.3)' } },
      axisLabel: { color: '#aab8d6', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#aab8d6' },
      splitLine: { lineStyle: { color: 'rgba(64,158,255,0.1)' } }
    },
    series: [
      {
        name: '本月',
        type: 'bar',
        barWidth: '35%',
        data: currentValues.map((v) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#409eff' },
              { offset: 1, color: '#409eff55' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        label: { show: true, position: 'top', color: '#e6f0ff', fontSize: 10 }
      },
      {
        name: '上月',
        type: 'bar',
        barWidth: '35%',
        data: previousValues.map((v) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#67c23a' },
              { offset: 1, color: '#67c23a55' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        label: { show: true, position: 'top', color: '#e6f0ff', fontSize: 10 }
      }
    ]
  }

  compareChart.value.setOption(option, true)
}

/**
 * 初始化趋势折线图
 */
function initTrendChart() {
  if (!trendChartRef.value || !compareData.value) return

  if (!trendChart.value) {
    trendChart.value = echarts.init(trendChartRef.value)
    trendObserver = new ResizeObserver(() => trendChart.value?.resize())
    trendObserver.observe(trendChartRef.value)
  }

  const data = compareData.value.monthlyTrend
  const months = data.map((d) => d.month)
  const progressData = data.map((d) => d.progress)
  const errorRateData = data.map((d) => d.errorRate)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,20,40,0.92)',
      borderColor: 'rgba(64,158,255,0.4)',
      textStyle: { color: '#e6f0ff' }
    },
    legend: {
      data: ['完成进度', '出错率'],
      textStyle: { color: '#aab8d6' },
      top: 0
    },
    grid: { left: 50, right: 50, top: 40, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(64,158,255,0.3)' } },
      axisLabel: { color: '#aab8d6' }
    },
    yAxis: [
      {
        type: 'value',
        name: '完成进度(%)',
        position: 'left',
        axisLabel: { color: '#aab8d6', formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(64,158,255,0.1)' } }
      },
      {
        type: 'value',
        name: '出错率(%)',
        position: 'right',
        axisLabel: { color: '#aab8d6', formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '完成进度',
        type: 'line',
        yAxisIndex: 0,
        data: progressData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#409eff', width: 3 },
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.3)' },
            { offset: 1, color: 'rgba(64,158,255,0.02)' }
          ])
        }
      },
      {
        name: '出错率',
        type: 'line',
        yAxisIndex: 1,
        data: errorRateData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#ff4d5e', width: 3 },
        itemStyle: { color: '#ff4d5e' }
      }
    ]
  }

  trendChart.value.setOption(option, true)
}

/**
 * 初始化所有图表
 */
function initCharts() {
  initCompareChart()
  initTrendChart()
}

/**
 * 销毁 ECharts 实例
 */
function disposeCharts() {
  compareObserver?.disconnect()
  trendObserver?.disconnect()
  compareChart.value?.dispose()
  trendChart.value?.dispose()
  compareChart.value = null
  trendChart.value = null
  compareObserver = null
  trendObserver = null
}

/**
 * 返回上一页
 */
function goBack() {
  // 如果有 from 参数，回到对应页面；否则回到总览
  const from = route.query.from as string
  if (from === 'overview') {
    router.push({ name: 'overview' })
  } else {
    router.back()
  }
}

// 监听路由参数变化，重新加载数据
watch(
  () => route.params.projectId,
  () => {
    disposeCharts()
    loadData()
  }
)

// 组件挂载时加载数据
onMounted(() => {
  loadData()
})

// 组件卸载时销毁图表
onBeforeUnmount(() => {
  disposeCharts()
})
</script>

<style scoped>
.project-detail {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  height: 100%;
}

/* 头部 */
.detail-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.1), transparent);
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.4);
  border-radius: 6px;
  color: #409eff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(64, 158, 255, 0.25);
}

.back-icon {
  font-size: 16px;
}

.header-info {
  flex: 1;
}

.project-name {
  font-size: 22px;
  font-weight: 700;
  color: #e6f0ff;
  margin: 0 0 8px 0;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-item {
  color: var(--text-secondary);
}

.risk-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.risk-high {
  background: rgba(255, 77, 94, 0.15);
  color: #ff4d5e;
}

.risk-medium {
  background: rgba(255, 176, 32, 0.15);
  color: #ffb020;
}

.risk-low {
  background: rgba(46, 207, 122, 0.15);
  color: #2ecf7a;
}

/* 加载状态 */
.loading-mask,
.error-mask {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(64, 158, 255, 0.3);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-btn {
  padding: 8px 24px;
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.4);
  border-radius: 6px;
  color: #409eff;
  cursor: pointer;
}

/* 指标卡片 */
.metric-row {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--gap);
}

.metric-card {
  padding: 20px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.metric-unit {
  font-size: 13px;
  color: var(--text-secondary);
}

.metric-bar {
  height: 4px;
  background: rgba(64, 158, 255, 0.15);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 信息行 */
.info-row {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: #e6f0ff;
}

.info-value.desc {
  line-height: 1.6;
  color: #c0cde8;
}

.team-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.team-tag {
  padding: 4px 12px;
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 14px;
  font-size: 12px;
  color: #409eff;
}

/* 关键指标 */
.key-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.key-metric {
  padding: 12px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 6px;
  text-align: center;
}

.km-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.km-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.km-unit {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: normal;
}

/* 对比行 */
.compare-row {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap);
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

.chart-container.trend-chart {
  min-height: 240px;
}

/* 变化率列表 */
.changes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.change-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.change-value {
  font-size: 24px;
  font-weight: 700;
}

.change-value.up {
  color: #2ecf7a;
}

.change-value.down {
  color: #ff4d5e;
}

.change-note {
  font-size: 11px;
  color: var(--text-secondary);
}

/* 趋势行 */
.trend-row {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gap);
  height: 280px;
}

.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #e6f0ff;
}

.panel-sub {
  font-size: 12px;
  color: var(--text-secondary);
}

.panel-body {
  flex: 1;
  padding: 16px;
  min-height: 0;
}
</style>
