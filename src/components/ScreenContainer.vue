<template>
  <div class="screen-viewport">
    <div class="screen-stage" :style="stageStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useScreenAdapter, DESIGN_WIDTH } from '@/composables/useScreenAdapter'

const { scale, stageHeight } = useScreenAdapter()


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
</style>
