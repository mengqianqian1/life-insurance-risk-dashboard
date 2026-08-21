<template>
  <div
    class="alert-list"
    ref="containerRef"
    @mouseenter="onPause"
    @mouseleave="onResume"
  >
    <div class="alert-track" :style="trackStyle">
      <div
        v-for="item in visibleItems"
        :key="item.key"
        class="alert-item"
        :class="'lv-' + item.alert.alertLevel"
        :style="{ top: item.top + 'px', height: ITEM_H + 'px' }"
      >
        <div class="alert-badge">{{ levelLabel(item.alert.alertLevel) }}</div>
        <div class="alert-main">
          <div class="alert-row">
            <span class="alert-project">{{ item.alert.projectName }}</span>
            <span class="alert-time">{{ formatTime(item.alert.alertTime) }}</span>
          </div>
          <div class="alert-desc" :title="item.alert.description">
            {{ item.alert.description }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="alerts.length === 0" class="alert-empty">暂无风险告警</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RISK_LEVEL_LABEL, type RiskAlert, type RiskLevel } from '@/types'

/**
 * 风险告警列表
 * - 数据量大时启用虚拟滚动，仅渲染可视区 + 缓冲项
 * - 连续向上无缝滚动（轮播），到底部自动回环
 * - 顶部 mask 渐隐实现"超时自动消失"视觉
 * - 鼠标悬停暂停
 */
const props = defineProps<{ alerts: RiskAlert[] }>()

const ITEM_H = 64
const BUFFER = 3
/** 每帧（16ms）位移基准，越大滚动越快 */
const SPEED = 0.8

const containerRef = ref<HTMLElement | null>(null)
const containerH = ref(0)
const offset = ref(0)
const paused = ref(false)

let rafId: number | null = null
let lastTs = 0
let resizeObserver: ResizeObserver | null = null

interface RenderItem {
  key: string
  alert: RiskAlert
  top: number
}

const startIdx = computed(() => Math.floor(offset.value / ITEM_H))

const visibleItems = computed<RenderItem[]>(() => {
  const total = props.alerts.length
  if (total === 0 || containerH.value === 0) return []
  const want = Math.ceil(containerH.value / ITEM_H) + BUFFER
  const count = Math.min(want, total)
  const start = startIdx.value
  const arr: RenderItem[] = []
  for (let i = 0; i < count; i++) {
    const idx = (((start + i) % total) + total) % total
    const a = props.alerts[idx]
    arr.push({
      key: a.alertId + '-' + Math.floor((start + i) / total),
      alert: a,
      top: (start + i) * ITEM_H
    })
  }
  return arr
})

const trackStyle = computed(() => ({
  transform: `translateY(${-offset.value}px)`,
  height: props.alerts.length * ITEM_H + 'px'
}))

function tick(ts: number) {
  if (lastTs && !paused.value && props.alerts.length > 0) {
    const delta = ts - lastTs
    offset.value += (SPEED * delta) / 16
    const totalH = props.alerts.length * ITEM_H
    if (offset.value >= totalH) {
      offset.value -= totalH
    }
  }
  lastTs = ts
  rafId = requestAnimationFrame(tick)
}

function onPause() {
  paused.value = true
}

function onResume() {
  paused.value = false
}

function levelLabel(level: RiskLevel): string {
  return RISK_LEVEL_LABEL[level]
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  if (containerRef.value) {
    containerH.value = containerRef.value.clientHeight
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerH.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(containerRef.value)
  }
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
})

// 数据切换（时间范围变化）时重置滚动位置
watch(
  () => props.alerts,
  () => {
    offset.value = 0
  }
)
</script>

<style scoped>
.alert-list {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  /* 顶部渐隐实现"消失"，底部小渐隐避免硬切 */
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0,
    #000 40px,
    #000 calc(100% - 12px),
    transparent 100%
  );
  mask-image: linear-gradient(
    180deg,
    transparent 0,
    #000 40px,
    #000 calc(100% - 12px),
    transparent 100%
  );
}

.alert-track {
  position: relative;
  width: 100%;
}

.alert-item {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.08);
  box-sizing: border-box;
}

.alert-badge {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  line-height: 1.1;
}

.alert-main {
  flex: 1;
  min-width: 0;
}

.alert-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.alert-project {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-time {
  font-size: 11px;
  color: var(--text-secondary);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.alert-desc {
  font-size: 12px;
  color: var(--text-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 风险等级配色 */
.alert-item.lv-high .alert-badge {
  background: rgba(255, 77, 94, 0.16);
  border: 1px solid rgba(255, 77, 94, 0.6);
  color: #ff6b78;
}
.alert-item.lv-medium .alert-badge {
  background: rgba(255, 176, 32, 0.16);
  border: 1px solid rgba(255, 176, 32, 0.6);
  color: #ffc34e;
}
.alert-item.lv-low .alert-badge {
  background: rgba(46, 207, 122, 0.16);
  border: 1px solid rgba(46, 207, 122, 0.6);
  color: #4be09a;
}

.alert-item.lv-high {
  border-left: 3px solid var(--risk-high);
}
.alert-item.lv-medium {
  border-left: 3px solid var(--risk-medium);
}
.alert-item.lv-low {
  border-left: 3px solid var(--risk-low);
}

.alert-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>
