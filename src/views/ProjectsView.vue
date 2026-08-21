<template>
  <div class="view">
    <div class="panel projects-panel">
      <div class="panel-header">
        <div class="panel-title">项目明细</div>
        <div class="toolbar">
          <span class="toolbar-label">风险等级</span>
          <el-select v-model="riskFilter" placeholder="全部">
            <el-option label="全部等级" value="all" />
            <el-option
              v-for="r in riskLevels"
              :key="r"
              :label="RISK_LEVEL_LABEL[r]"
              :value="r"
            />
          </el-select>
          <el-input
            v-model="keyword"
            placeholder="搜索项目名称 / 负责人"
            clearable
            :prefix-icon="Search"
          />
          <span class="panel-sub">{{ filteredProjects.length }} / {{ projects.length }} 个项目</span>
        </div>
      </div>
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 100px">项目编号</th>
              <th>项目名称</th>
              <th style="width: 120px">负责人</th>
              <th style="width: 120px">风险等级</th>
              <th style="width: 320px">完成进度</th>
              <th style="width: 120px">出错率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProjects" :key="p.projectId">
              <td>{{ p.projectId }}</td>
              <td class="cell-name">{{ p.projectName }}</td>
              <td>{{ p.owner }}</td>
              <td>
                <span class="risk-badge" :class="p.riskLevel">{{ levelLabel(p.riskLevel) }}</span>
              </td>
              <td>
                <div class="progress-bar">
                  <div class="progress-bar__track">
                    <div
                      class="progress-bar__fill"
                      :style="{ width: p.progress + '%', background: riskColor(p.riskLevel) }"
                    ></div>
                  </div>
                  <span class="progress-bar__text">{{ p.progress }}%</span>
                </div>
              </td>
              <td :style="{ color: errorColor(p.errorRate) }">{{ p.errorRate }}%</td>
            </tr>
            <tr v-if="filteredProjects.length === 0">
              <td colspan="6" class="empty-row">当前筛选下暂无项目</td>
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
import { RISK_LEVEL_COLOR, RISK_LEVEL_LABEL, type RiskLevel } from '@/types'

const { data, loading } = useDashboardStore()

const projects = computed(() => data.value?.projects ?? [])

type RiskFilter = 'all' | RiskLevel
const riskFilter = ref<RiskFilter>('all')
const keyword = ref('')
const riskLevels: RiskLevel[] = ['high', 'medium', 'low']

const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 }

const filteredProjects = computed(() => {
  let list = projects.value
  if (riskFilter.value !== 'all') {
    list = list.filter((p) => p.riskLevel === riskFilter.value)
  }
  const kw = keyword.value.trim()
  if (kw) {
    list = list.filter((p) => p.projectName.includes(kw) || p.owner.includes(kw))
  }
  return [...list].sort(
    (a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || b.errorRate - a.errorRate
  )
})

function levelLabel(level: RiskLevel): string {
  return RISK_LEVEL_LABEL[level]
}

function riskColor(level: RiskLevel): string {
  return RISK_LEVEL_COLOR[level]
}

function errorColor(rate: number): string {
  if (rate >= 5) return 'var(--risk-high)'
  if (rate >= 2) return 'var(--risk-medium)'
  return 'var(--risk-low)'
}
</script>

<style scoped>
.projects-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.cell-name {
  color: var(--text-primary);
  font-weight: 500;
}
.empty-row {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
}
</style>
