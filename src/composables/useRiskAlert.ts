import { readonly, ref } from 'vue'

const alerting = ref(false)
let alertTimer: ReturnType<typeof setTimeout> | undefined

export function triggerRiskAlert(duration = 8000) {
  alerting.value = true

  if (alertTimer) {
    clearTimeout(alertTimer)
  }

  alertTimer = setTimeout(() => {
    alerting.value = false
    alertTimer = undefined
  }, duration)
}

export function useRiskAlert() {
  return { alerting: readonly(alerting), triggerRiskAlert }
}
