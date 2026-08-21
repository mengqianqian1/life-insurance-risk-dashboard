import { onBeforeUnmount, onMounted, ref } from 'vue'

export const DESIGN_WIDTH = 1920

/**
 * 大屏自适应：宽度固定 1920 设计稿，按视口宽度 scale 铺满；
 * stage 高度 = 视口高度 / scale，宽高均 100% 占满视口，无黑边。
 * 内容区用 flex 自适应高度，图表由 ResizeObserver 监听容器尺寸 resize。
 */
export function useScreenAdapter() {
  const scale = ref(1)
  const stageHeight = ref(1080)

  function update() {
    const w = window.innerWidth
    const h = window.innerHeight
    // scale 与 stageHeight 用同一来源 s，确保 stageHeight * scale 精确 = 视口高度
    const s = w / DESIGN_WIDTH
    scale.value = s
    stageHeight.value = s > 0 ? h / s : h
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
  })

  return { scale, stageHeight }
}
