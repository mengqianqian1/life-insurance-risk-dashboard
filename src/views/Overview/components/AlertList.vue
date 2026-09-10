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
// props 接收父组件传入的告警数据数组；
const props = defineProps<{ alerts: RiskAlert[] }>()

const ITEM_H = 64 // 列表中的每一项高度是64px 
//定义缓冲区 除了屏幕上可见的项之外，还渲染额外的3项，以便在滚动时不会出现空白区域；
const BUFFER = 3
/** 滚动的速度每一帧16ms，移动0.8px */
const SPEED = 0.8
// 获取=可视区域的容器  的dom 引用；
const containerRef = ref<HTMLElement | null>(null)
  //记录可视区域容器的高度，初始值为0。这个高度用于计算可见的列表项数量，从而实现虚拟滚动。
const containerH = ref(0)
// 全局便宜量 动画的引擎 tick 函数会不断修改它  他的值会越来越大 从而让内容看起来在向上滚动。
const offset = ref(0)
// 标记当前是否暂停滚动，当鼠标悬停在列表上时，暂停滚动，离开时恢复滚动。
const paused = ref(false)
// 记录上一次动画帧的时间戳，用于计算时间差，从而根据时间差调整滚动速度。
let rafId: number | null = null
// 记录上一次动画帧的时间戳，用于计算时间差，从而根据时间差调整滚动速度。
let lastTs = 0
// 监听容器大小变化的观察器，当容器大小发生变化时，更新containerH的值，以确保虚拟滚动计算正确。
let resizeObserver: ResizeObserver | null = null
// 计算当前可见的列表项的起始索引，根据当前的偏移量和每项的高度计算出当前滚动到第几项。
interface RenderItem {
  key: string // 唯一标识符，通常由告警ID和循环次数组成
  alert: RiskAlert // 当前渲染的告警数据对象
  // 当前渲染的告警项在列表中的顶部位置，用于设置绝对定位的top样式。
  top: number
}
//计算当前可见的列表项的起始索引，根据当前的偏移量和每项的高度计算出当前滚动到第几页。
const startIdx = computed(() => Math.floor(offset.value / ITEM_H))
//计算当前可见的列表项，包含缓冲区的额外项，以便在滚动时不会出现空白区域。
const visibleItems = computed<RenderItem[]>(() => {
  // 计算总的告警数量；
  const total = props.alerts.length
  // 如果没有告警项目，或者容器高度为0，则返回空数组，表示没有可见的列表项。
  if (total === 0 || containerH.value === 0) return []
  //计算需要渲染的告警项数量，取可视区域高度除以每项高度，在加上缓冲区的数量，确保在滚动时不会出现空白区域。
  const want = Math.ceil(containerH.value / ITEM_H) + BUFFER
  // 计算实际渲染的告警数量，取want和total的最小值，避免渲染超过实际告警数量的项。
  const count = Math.min(want, total)
  // 计算当前可见列表项的起始索引，从而确定从哪儿模块开始渲染告警项。由于滚动是循环的，所以需要对索引进行取模运算
  //确保索引在有效范围内，避免数组越界。
  const start = startIdx.value
  //创建一个数组，用于存储当前可见的告警项对象，每个对象包含唯一标识符、告警数据和顶部位置
  const arr: RenderItem[] = []
  //循环遍历需要渲染的告警项数量，根据当前的起始索引和总告警数量计算出每个告警项的实际索引，并将其添加到arr数组中。
  for (let i = 0; i < count; i++) {
    //计算当前告警项的实际索引 使用模运算确保索引在有效范围内，避免数组越界。
    const idx = (((start + i) % total) + total) % total
    //获取当前索引的对应告警数据对象，
    const a = props.alerts[idx]
    //并将其添加到arr数组中，同时计算出该告警项在列表中的顶部位置，
    // 用于设置进而对定位的top样式，从而实现滚动效果。
    arr.push({
      key: a.alertId + '-' + Math.floor((start + i) / total),
      alert: a,
      top: (start + i) * ITEM_H
    })
  }
  return arr
})
 // 计算滚动轨道的样式，主要是设置transform属性，实现向上滚动的效果，同时设置高度为总告警项的高度。
const trackStyle = computed(() => ({
  transform: `translateY(${-offset.value}px)`,
  height: props.alerts.length * ITEM_H + 'px'
}))
// 动画帧函数，使用requestAnimationFrame实现连续滚动效果，根据时间差计算偏移量，从而实现平滑滚动。
function tick(ts: number) {
  // 如果上一次时间戳存在，且当前没有暂停滚动，并且告警列表不为空，则计算时间差，根据时间差调整偏移量，从而实现平滑滚动
  if (lastTs && !paused.value && props.alerts.length > 0) {
    //计算时间差
    const delta = ts - lastTs
    //根据时间差和预设的滚动速度，计算出偏移量的增加值，并更新offset.value，从而实现向上滚动的效果。
    offset.value += (SPEED * delta) / 16
    // 计算总的告警项高度，如果当前偏移量超过总高度，则将偏移量减去总高度，实现循环滚动效果。
    const totalH = props.alerts.length * ITEM_H
    if (offset.value >= totalH) {
      offset.value -= totalH
    }
  }
  lastTs = ts
  // 下一帧继续调用tick函数，实现连续滚动效果。
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
