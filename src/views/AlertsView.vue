<template>
  <div class="view">
    <div class="panel alerts-panel">
      <div class="panel-header">
        <div class="panel-title">告警中心</div>
        <div class="toolbar">
          <el-radio-group v-model="filter">
            <el-radio-button v-for="t in tabs" :key="t.key" :value="t.key">
              {{ t.label }} ({{ countOf(t.key) }})
            </el-radio-button>
          </el-radio-group>
          <el-input
            v-model="keyword"
            placeholder="搜索项目名称 / 告警内容"
            clearable
            :prefix-icon="Search"
          />
        </div>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 110px">告警 ID</th>
              <th style="width: 200px">项目名称</th>
              <th style="width: 110px">告警等级</th>
              <th>告警内容</th>
              <th style="width: 180px">发生时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in filteredAlerts" :key="a.alertId">
              <td>{{ a.alertId }}</td>
              <td class="cell-name">{{ a.projectName }}</td>
              <td>
                <span class="risk-badge" :class="a.alertLevel">{{ levelLabel(a.alertLevel) }}</span>
              </td>
              <td class="cell-desc">{{ a.description }}</td>
              <td>{{ formatTime(a.alertTime) }}</td>
            </tr>
            <tr v-if="filteredAlerts.length === 0">
              <td colspan="5" class="empty-row">当前筛选下暂无告警</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="loading && !data" class="loading-mask">数据加载中...</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useDashboardStore } from '@/composables/useDashboardStore'
import { RISK_LEVEL_LABEL, type RiskLevel } from '@/types'

const { data, loading } = useDashboardStore()

const alerts = computed(() => data.value?.alerts ?? [])

type FilterKey = 'all' | RiskLevel
const filter = ref<FilterKey>('all')
const keyword = ref('')

const tabs: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'high', label: '高风险' },
  { key: 'medium', label: '中风险' },
  { key: 'low', label: '低风险' }
]

const filteredAlerts = computed(() => {
  let list =
    filter.value === 'all'
      ? alerts.value
      : alerts.value.filter((a) => a.alertLevel === filter.value)
  const kw = keyword.value.trim()
  if (kw) {
    list = list.filter((a) => a.projectName.includes(kw) || a.description.includes(kw))
  }
  return list
})

function countOf(key: FilterKey): number {
  if (key === 'all') return alerts.value.length
  return alerts.value.filter((a) => a.alertLevel === key).length
}

function levelLabel(level: RiskLevel): string {
  return RISK_LEVEL_LABEL[level]
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
.alerts-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.cell-name {
  color: var(--text-primary);
  font-weight: 500;
}
.cell-desc {
  white-space: normal;
  word-break: break-all;
  color: var(--text-regular);
}
.empty-row {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}
</style>
