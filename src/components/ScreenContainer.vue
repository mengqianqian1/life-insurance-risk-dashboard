<template>
  <div class="screen-viewport">
    <div v-if="alerting" class="risk-edge-alert" aria-hidden="true">
      <i class="risk-corner risk-corner--tl"></i>
      <i class="risk-corner risk-corner--tr"></i>
      <i class="risk-corner risk-corner--bl"></i>
      <i class="risk-corner risk-corner--br"></i>
    </div>
    <div class="screen-stage" :style="stageStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScreenAdapter, DESIGN_WIDTH } from '@/composables/useScreenAdapter'
import { useRiskAlert } from '@/composables/useRiskAlert'

const { scale, stageHeight } = useScreenAdapter()
const { alerting } = useRiskAlert()


const stageStyle = computed(() => ({
  width: DESIGN_WIDTH + 'px',
  height: stageHeight.value + 'px',
  transform: `scale(${scale.value})`
}))
</script>

<style scoped>
.screen-viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: var(--bg-deep);
}

.screen-stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  display: flex;
  flex-direction: column;
}

.risk-edge-alert {
  position: fixed;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  animation: risk-edge-breathe 1.6s ease-in-out infinite;
}

.risk-corner {
  position: absolute;
  width: 76px;
  height: 76px;
  border-color: rgba(255, 55, 72, 0.95);
  border-style: solid;
  filter: drop-shadow(0 0 5px rgba(255, 55, 72, 0.9)) drop-shadow(0 0 18px rgba(255, 20, 45, 0.55));
}

.risk-corner--tl {
  top: 12px;
  left: 12px;
  border-width: 4px 0 0 4px;
}

.risk-corner--tr {
  top: 12px;
  right: 12px;
  border-width: 4px 4px 0 0;
}

.risk-corner--bl {
  bottom: 12px;
  left: 12px;
  border-width: 0 0 4px 4px;
}

.risk-corner--br {
  right: 12px;
  bottom: 12px;
  border-width: 0 4px 4px 0;
}

@keyframes risk-edge-breathe {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}
</style>
