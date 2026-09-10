<template>
    <section class="business-row">
      <div class="panel product-panel">
        <div class="panel-header"><div class="panel-title">产品定位与项目价值</div><span class="panel-sub">业务画像</span></div>
        <div class="panel-body product-body">
          <div class="product-facts">
            <div><span>产品类别</span><strong>{{ detail.productInfo.category }}</strong></div>
            <div><span>目标客群</span><strong>{{ detail.productInfo.targetCustomer }}</strong></div>
            <div><span>保障范围</span><strong>{{ detail.productInfo.coverage }}</strong></div>
          </div>
          <p class="value-proposition">{{ detail.productInfo.valueProposition }}</p>
        </div>
      </div>
      <div class="panel sales-panel">
        <div class="panel-header"><div class="panel-title">销售经营情况</div><span class="panel-sub">截至当前周期</span></div>
        <div class="panel-body sales-body">
          <div class="sales-summary">
            <div><span>目标保费</span><strong>{{ detail.salesData.targetPremium.toLocaleString() }}<small> 万元</small></strong></div>
            <div><span>目标达成</span><strong>{{ detail.salesData.completionRate }}<small>%</small></strong></div>
            <div><span>本月保单</span><strong>{{ detail.salesData.monthlyPolicies.toLocaleString() }}<small> 件</small></strong></div>
            <div><span>续期率</span><strong>{{ detail.salesData.renewalRate }}<small>%</small></strong></div>
          </div>
          <div class="channel-bars">
            <div v-for="channel in detail.salesData.channelData" :key="channel.name" class="channel-item">
              <span>{{ channel.name }}</span><i><b :style="{ width: Math.min(channel.value, 100) + '%' }"></b></i><em>{{ channel.value }}%</em>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="business-row lower-business-row">
      <div class="panel value-panel">
        <div class="panel-header"><div class="panel-title">项目价值贡献</div><span class="panel-sub">经营预测</span></div>
        <div class="panel-body value-grid">
          <div v-for="metric in detail.valueMetrics" :key="metric.label" class="value-card">
            <span>{{ metric.label }}</span><strong>{{ metric.value }}<small>{{ metric.unit }}</small></strong><em>较上周期 +{{ metric.trend }}%</em>
          </div>
        </div>
      </div>
      <div class="panel risk-panel">
        <div class="panel-header"><div class="panel-title">风险分析与处置</div><span class="risk-tag" :class="'risk-' + detail.riskLevel">{{ RISK_LEVEL_LABEL[detail.riskLevel] }}</span></div>
        <div class="panel-body risk-analysis-body">
          <p class="risk-summary">{{ detail.riskAnalysis.summary }}</p>
          <div class="risk-factors">
            <div v-for="factor in detail.riskAnalysis.factors" :key="factor.label" class="factor-item">
              <span>{{ factor.label }}</span><strong>{{ factor.value }}</strong><b :class="'risk-' + factor.level">{{ RISK_LEVEL_LABEL[factor.level] }}</b>
            </div>
          </div>
          <div class="risk-action"><span>处置建议</span>{{ detail.riskAnalysis.action }}</div>
        </div>
      </div>
    </section>
</template>

<script setup lang="ts">
import { RISK_LEVEL_LABEL, type ProjectDetail } from '@/types'
defineProps<{ detail: ProjectDetail }>()
</script>

<style scoped>
.business-row { flex: 0 0 auto; display: grid; grid-template-columns: 1fr 1.2fr; gap: var(--gap); }
.lower-business-row { grid-template-columns: 1.1fr 1fr; }
.risk-tag { padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600; }
.risk-tag.risk-high { background: rgba(255, 77, 94, 0.15); color: var(--risk-high); }
.risk-tag.risk-medium { background: rgba(255, 176, 32, 0.15); color: var(--risk-medium); }
.risk-tag.risk-low { background: rgba(46, 207, 122, 0.15); color: var(--risk-low); }
.product-body, .sales-body, .risk-analysis-body { min-height: 170px; }
.product-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.product-facts div, .sales-summary div { display: flex; flex-direction: column; gap: 7px; }
.product-facts span, .sales-summary span, .value-card span, .risk-action span { color: var(--text-secondary); font-size: 12px; }
.product-facts strong { color: var(--text-primary); font-size: 13px; line-height: 1.45; }
.value-proposition { margin-top: 18px; padding: 12px 14px; border-left: 3px solid var(--color-cyan); background: rgba(24, 224, 255, 0.06); color: var(--text-regular); font-size: 13px; line-height: 1.6; }
.sales-body { display: grid; grid-template-columns: 1.15fr 1fr; gap: 22px; }
.sales-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.sales-summary strong { color: var(--color-cyan); font-size: 20px; font-variant-numeric: tabular-nums; }
.sales-summary small, .value-card small { color: var(--text-secondary); font-size: 11px; font-weight: normal; }
.channel-bars { display: flex; flex-direction: column; justify-content: center; gap: 12px; }
.channel-item { display: grid; grid-template-columns: 58px 1fr 38px; align-items: center; gap: 8px; color: var(--text-regular); font-size: 12px; }
.channel-item i { height: 6px; overflow: hidden; background: rgba(64, 158, 255, 0.12); border-radius: 3px; }
.channel-item b { display: block; height: 100%; background: linear-gradient(90deg, var(--color-primary), var(--color-cyan)); border-radius: 3px; }
.channel-item em { color: var(--text-primary); font-style: normal; text-align: right; }
.value-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.value-card { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: rgba(64, 158, 255, 0.07); border: 1px solid rgba(64, 158, 255, 0.1); }
.value-card strong { color: var(--text-primary); font-size: 20px; }
.value-card em { color: var(--risk-low); font-size: 11px; font-style: normal; }
.risk-summary { margin-bottom: 12px; color: var(--text-regular); font-size: 12px; line-height: 1.55; }
.risk-factors { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.factor-item { display: flex; flex-direction: column; gap: 6px; padding: 9px; background: rgba(64, 158, 255, 0.06); }
.factor-item span { color: var(--text-secondary); font-size: 11px; }
.factor-item strong { color: var(--text-primary); font-size: 16px; }
.factor-item b { font-size: 11px; font-weight: normal; }
.factor-item b.risk-high { color: var(--risk-high); }.factor-item b.risk-medium { color: var(--risk-medium); }.factor-item b.risk-low { color: var(--risk-low); }
.risk-action { margin-top: 12px; color: var(--text-regular); font-size: 12px; line-height: 1.5; }.risk-action span { margin-right: 10px; color: var(--color-cyan); }
</style>
