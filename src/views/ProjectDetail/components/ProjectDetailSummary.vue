<template>
  <section class="metric-row">
    <div class="metric-card">
      <div class="metric-label">完成进度</div>
      <div class="metric-value" :style="{ color: RISK_LEVEL_COLOR[detail.riskLevel] }">
        {{ detail.progress }}%
      </div>
      <div class="metric-bar">
        <div
          class="metric-bar-fill"
          :style="{ width: detail.progress + '%', background: RISK_LEVEL_COLOR[detail.riskLevel] }"
        ></div>
      </div>
    </div>
    <div class="metric-card">
      <div class="metric-label">出错率</div>
      <div class="metric-value" :style="{ color: errorRateColor }">{{ detail.errorRate }}%</div>
      <div class="metric-bar">
        <div
          class="metric-bar-fill"
          :style="{ width: Math.min(detail.errorRate * 10, 100) + '%', background: errorRateColor }"
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

  <section class="info-row">
    <div class="panel">
      <div class="panel-header"><div class="panel-title">项目基本信息</div></div>
      <div class="panel-body info-grid">
        <div class="info-item">
          <span class="info-label">启动日期</span
          ><span class="info-value">{{ detail.startDate }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">预计完成</span
          ><span class="info-value">{{ detail.expectedEndDate }}</span>
        </div>
        <div class="info-item info-full">
          <span class="info-label">项目描述</span
          ><span class="info-value desc">{{ detail.description }}</span>
        </div>
        <div class="info-item info-full">
          <span class="info-label">团队成员</span>
          <div class="team-list">
            <span v-for="member in detail.teamMembers" :key="member" class="team-tag">{{
              member
            }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><div class="panel-title">关键指标</div></div>
      <div class="panel-body key-metrics">
        <div v-for="metric in detail.keyMetrics" :key="metric.label" class="key-metric">
          <div class="km-label">{{ metric.label }}</div>
          <div class="km-value">
            {{ metric.value }}<span v-if="metric.unit" class="km-unit">{{ metric.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RISK_LEVEL_COLOR, type ProjectDetail } from '@/types'

const props = defineProps<{ detail: ProjectDetail }>()
const detail = props.detail
const errorRateColor = computed(() => {
  if (detail.errorRate >= 5) return '#ff4d5e'
  if (detail.errorRate >= 2) return '#ffb020'
  return '#2ecf7a'
})
</script>

<style scoped>
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
.metric-label,
.info-label,
.km-label {
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
  margin-top: 4px;
  overflow: hidden;
  background: rgba(64, 158, 255, 0.15);
  border-radius: 2px;
}
.metric-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
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
.info-value {
  font-size: 14px;
  color: #e6f0ff;
}
.info-value.desc {
  color: #c0cde8;
  line-height: 1.6;
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
  color: #409eff;
  font-size: 12px;
}
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
  margin-bottom: 4px;
  font-size: 12px;
}
.km-value {
  color: #409eff;
  font-size: 24px;
  font-weight: 700;
}
.km-unit {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: normal;
}
</style>
