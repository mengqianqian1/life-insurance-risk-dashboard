<template>
  <header class="top-bar">
    <!-- 左：标题 -->
    <div class="title-wrap">
      <div class="title-deco"></div>
      <div class="title-text">
        <h1 class="title-main">寿险项目风险监控大屏</h1>
        <span class="title-sub">LIFE INSURANCE RISK MONITOR</span>
      </div>
    </div>

    <!-- 中：导航 Tab -->
    <nav class="nav">
      <router-link
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        :class="['nav-item', { active: currentGroup === tab.group }]"
      >
        <span class="nav-dot"></span>
        {{ tab.label }}
      </router-link>
    </nav>

    <!-- 右：时间范围筛选 + 当前时间 -->
    <div class="right">
      <div class="filter">
        <span class="filter-label">时间范围</span>
        <select class="filter-select" :value="timeRange" @change="onRangeChange">
          <option v-for="(label, key) in TIME_RANGE_LABEL" :key="key" :value="key">
            {{ label }}
          </option>
        </select>
      </div>
      <div class="clock">
        <span class="clock-date">{{ dateText }}</span>
        <span class="clock-time">{{ timeText }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNow } from '@/composables/useNow'
import { useDashboardStore } from '@/composables/useDashboardStore'
import { TIME_RANGE_LABEL, type TimeRange } from '@/types'

const route = useRoute()

const tabs = [
  { path: '/overview', label: '风险监控总览', group: 'overview' },
  { path: '/projects', label: '项目明细', group: 'projects' },
  { path: '/alerts', label: '告警中心', group: 'alerts' },
  { path: '/trend', label: '趋势分析', group: 'trend' },
  { path: '/upload', label: '分片上传', group: 'upload' }
] as const

const currentGroup = computed(() => route.meta.group as string | undefined)

const { timeRange, setRange } = useDashboardStore()
const { now } = useNow()

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

const dateText = computed(() => {
  const d = now.value
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})

const timeText = computed(() => {
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

function onRangeChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value as TimeRange
  setRange(val)
}
</script>

<style scoped>
.top-bar {
  flex: 0 0 var(--header-height);
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: linear-gradient(180deg, rgba(16, 33, 63, 0.9) 0%, rgba(10, 20, 40, 0.4) 100%);
  border-bottom: 1px solid var(--border-strong);
  position: relative;
}

.top-bar::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--color-cyan) 50%, transparent 100%);
  opacity: 0.7;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 360px;
}

.title-deco {
  width: 6px;
  height: 38px;
  background: linear-gradient(180deg, var(--color-cyan), var(--color-primary));
  border-radius: 3px;
  box-shadow: 0 0 12px rgba(24, 224, 255, 0.6);
}

.title-main {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--text-primary);
  background: linear-gradient(90deg, #ffffff 0%, #8cd8ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-sub {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--text-secondary);
}

.nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  font-size: 14px;
  color: var(--text-regular);
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--text-primary);
  background: rgba(47, 155, 255, 0.12);
}

.nav-item.active {
  color: var(--color-cyan);
  background: rgba(24, 224, 255, 0.12);
  border: 1px solid rgba(24, 224, 255, 0.4);
}

.nav-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.nav-item.active .nav-dot {
  box-shadow: 0 0 8px currentColor;
  opacity: 1;
}

.right {
  display: flex;
  align-items: center;
  gap: 24px;
  min-width: 360px;
  justify-content: flex-end;
}

.filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.filter-select {
  height: 30px;
  padding: 0 28px 0 10px;
  font-size: 13px;
  color: var(--text-primary);
  background: rgba(16, 33, 63, 0.6);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-cyan) 50%),
    linear-gradient(135deg, var(--color-cyan) 50%, transparent 50%);
  background-position: calc(100% - 16px) 13px, calc(100% - 11px) 13px;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
}

.filter-select option {
  background: var(--bg-panel-solid);
}

.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.clock-date {
  font-size: 12px;
  color: var(--text-secondary);
}

.clock-time {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-cyan);
  font-variant-numeric: tabular-nums;
}
</style>
