import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 实时时间，默认每秒刷新
 */
export function useNow(intervalMs = 1000) {
  const now = ref(new Date())
  let timer: number | undefined

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = new Date()
    }, intervalMs)
  })

  onBeforeUnmount(() => {
    if (timer !== undefined) window.clearInterval(timer)
  })

  // watchEffect((onCleanup) => {
  //   const timer = setInterval(() => {
  //     now.value = new Date()
  //   }, intervalMs)
  //   onCleanup(() => clearInterval(timer))   // ★ 自动清理
  // })
  

  return { now }
}
