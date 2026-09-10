<template>
  <div class="stat-card panel">
    <div class="stat-inner">
      <div class="stat-icon" :style="iconStyle">
        <span class="stat-icon-text">{{ iconText }}</span>
      </div>
      <div class="stat-content">
        <div class="stat-title">{{ title }}</div>
        <div class="stat-value">
          <span class="num" :style="{ color: color }">{{ value }}</span>
          <span v-if="unit" class="unit">{{ unit }}</span>
        </div>
      </div>
    </div>
    <div class="stat-bar" :style="{ background: `linear-gradient(90deg, ${color}, transparent)` }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    unit?: string
    color?: string
    iconText?: string
  }>(),
  {
    color: '#2f9bff',
    unit: '',
    iconText: ''
  }
)

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const iconStyle = computed(() => ({
  background: hexToRgba(props.color, 0.15),
  border: `1px solid ${hexToRgba(props.color, 0.5)}`,
  color: props.color
}))
</script>

<style scoped>
.stat-card {
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-title {
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.num {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 18px currentColor;
  filter: brightness(1.1);
}

.unit {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 60%;
}
</style>
