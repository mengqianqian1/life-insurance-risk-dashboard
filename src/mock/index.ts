import type {
  DashboardData,
  InsuranceProject,
  RiskAlert,
  RiskLevel,
  RiskLevelStat,
  StatSummary,
  TimeRange,
  TrendPoint
} from '@/types'

/* ============================================================
 * 静态数据池
 * ========================================================== */

interface ProjectSeed {
  name: string
  owner: string
}

const PROJECT_POOL: ProjectSeed[] = [
  { name: '智享人生终身寿险', owner: '张伟' },
  { name: '金生安康重疾险', owner: '李娜' },
  { name: '鑫如意年金保险', owner: '王强' },
  { name: '百万护驾意外险', owner: '刘洋' },
  { name: '福满堂两全保险', owner: '陈静' },
  { name: '安享e生医疗险', owner: '杨帆' },
  { name: '稳赢一生分红险', owner: '赵磊' },
  { name: '锦绣前程教育金', owner: '黄敏' },
  { name: '康健万能寿险', owner: '周婷' },
  { name: '盛世年华养老险', owner: '徐涛' },
  { name: '鸿运当头投连险', owner: '孙莉' },
  { name: '守护天使定期寿险', owner: '马超' }
]

const ALERT_DESC: Record<RiskLevel, string[]> = {
  high: [
    '核保规则校验失败率超过阈值 15%',
    '理赔资金缺口预警，缺口达 2300 万元',
    '精算准备金计提不足，偏差 -8.5%',
    '再保分出比例超出合约上限',
    '保单现金价值回溯偏差超限',
    '反洗钱命中高风险名单待复核'
  ],
  medium: [
    '保单质检不合格率较上周上升 3.2%',
    '客户回访失联率达 12%，偏高',
    '续期缴费逾期件数环比上升',
    '渠道返佣异常，触发中风险',
    '体检报告补录延迟超 24h',
    '电子签名合规校验告警'
  ],
  low: [
    '核心系统响应时长波动 120ms',
    '银保数据同步延迟 8 分钟',
    '渠道签单量小幅偏差 -1.5%',
    '电子保单归档率 96.4% 待优化',
    '回执回销率日内小幅波动',
    '客户信息字段完整率 98.1%'
  ]
}

interface RangeConfig {
  trendCount: number
  alertCount: number
  /** 时间跨度（毫秒），用于告警时间回溯 */
  alertSpanMs: number
  /** 趋势时间跨度，用于折线 x 轴 */
  trendSpanMs: number
}

const RANGE_CONFIG: Record<TimeRange, RangeConfig> = {
  today: { trendCount: 12, alertCount: 32, alertSpanMs: 12 * 3600 * 1000, trendSpanMs: 12 * 3600 * 1000 },
  week: { trendCount: 7, alertCount: 68, alertSpanMs: 7 * 24 * 3600 * 1000, trendSpanMs: 7 * 24 * 3600 * 1000 },
  month: { trendCount: 10, alertCount: 160, alertSpanMs: 30 * 24 * 3600 * 1000, trendSpanMs: 30 * 24 * 3600 * 1000 },
  quarter: { trendCount: 12, alertCount: 360, alertSpanMs: 90 * 24 * 3600 * 1000, trendSpanMs: 90 * 24 * 3600 * 1000 }
}

/* ============================================================
 * 可复现随机数（同一时间范围返回稳定数据，模拟接口稳定性）
 * ========================================================== */

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/* ============================================================
 * 各维度数据生成
 * ========================================================== */

function genProjects(range: TimeRange): InsuranceProject[] {
  const rand = mulberry32(hashString('proj-' + range))
  // 不同时间范围的整体风险系数，季度统计累计风险偏高
  const riskFactor: Record<TimeRange, number> = { today: 1, week: 1.05, month: 1.12, quarter: 1.2 }

  return PROJECT_POOL.map((p, i) => {
    const roll = rand()
    // 高风险约 25%，中风险 35%，低风险 40%，范围越大高风险占比略升
    const highThreshold = 0.22 + (riskFactor[range] - 1) * 0.5
    const midThreshold = highThreshold + 0.35
    let riskLevel: RiskLevel
    if (roll < highThreshold) riskLevel = 'high'
    else if (roll < midThreshold) riskLevel = 'medium'
    else riskLevel = 'low'

    const progressBase = 38 + rand() * 58 // 38 - 96
    let errorBase: number
    if (riskLevel === 'high') errorBase = 4.5 + rand() * 7.5
    else if (riskLevel === 'medium') errorBase = 1.8 + rand() * 3.5
    else errorBase = 0.3 + rand() * 1.6

    return {
      projectId: 'P' + pad(i + 1),
      projectName: p.name,
      owner: p.owner,
      riskLevel,
      progress: Number(progressBase.toFixed(1)),
      errorRate: Number(errorBase.toFixed(2))
    }
  })
}

function genRiskLevelStats(projects: InsuranceProject[]): RiskLevelStat[] {
  const total = projects.length
  const count: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0 }
  projects.forEach((p) => {
    count[p.riskLevel] += 1
  })
  return (['high', 'medium', 'low'] as RiskLevel[]).map((level) => ({
    level,
    count: count[level],
    percent: total === 0 ? 0 : Number(((count[level] / total) * 100).toFixed(1))
  }))
}

function genStat(projects: InsuranceProject[]): StatSummary {
  const total = projects.length
  const high = projects.filter((p) => p.riskLevel === 'high').length
  const avgProgress = total === 0 ? 0 : projects.reduce((s, p) => s + p.progress, 0) / total
  const avgError = total === 0 ? 0 : projects.reduce((s, p) => s + p.errorRate, 0) / total
  return {
    totalProjects: total,
    highRiskCount: high,
    avgProgress: Number(avgProgress.toFixed(1)),
    avgErrorRate: Number(avgError.toFixed(2))
  }
}

function buildTrendLabels(range: TimeRange, count: number): string[] {
  if (range === 'today') {
    // 09:00 起每小时
    return Array.from({ length: count }, (_, i) => `${pad(9 + i)}:00`)
  }
  if (range === 'week') {
    return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].slice(0, count)
  }
  if (range === 'month') {
    return Array.from({ length: count }, (_, i) => `${i + 1}日`)
  }
  return Array.from({ length: count }, (_, i) => `W${i + 1}`)
}

function genTrend(range: TimeRange, projects: InsuranceProject[]): TrendPoint[] {
  const cfg = RANGE_CONFIG[range]
  const rand = mulberry32(hashString('trend-' + range))
  const avgBase = projects.reduce((s, p) => s + p.errorRate, 0) / projects.length
  const labels = buildTrendLabels(range, cfg.trendCount)

  return labels.map((time, i) => {
    // 越靠近现在波动越大，且整体略升
    const trend = (i / cfg.trendCount) * avgBase * 0.4
    const wave = (rand() - 0.5) * avgBase * 0.9
    const val = Math.max(0.1, avgBase + trend + wave)
    return { time, errorRate: Number(val.toFixed(2)) }
  })
}

function genAlerts(range: TimeRange, projects: InsuranceProject[]): RiskAlert[] {
  const cfg = RANGE_CONFIG[range]
  const rand = mulberry32(hashString('alert-' + range))
  const now = Date.now()
  const list: RiskAlert[] = []

  for (let i = 0; i < cfg.alertCount; i++) {
    const proj = projects[Math.floor(rand() * projects.length)]
    const roll = rand()
    let level: RiskLevel
    if (roll < 0.4) level = 'high'
    else if (roll < 0.75) level = 'medium'
    else level = 'low'
    const descArr = ALERT_DESC[level]
    const description = descArr[Math.floor(rand() * descArr.length)]
    const offset = rand() * cfg.alertSpanMs
    const time = new Date(now - offset)

    list.push({
      alertId: 'A' + String(i + 1).padStart(4, '0'),
      projectName: proj.projectName,
      alertLevel: level,
      description,
      alertTime: time.toISOString()
    })
  }

  // 按时间倒序
  return list.sort((a, b) => b.alertTime.localeCompare(a.alertTime))
}

/* ============================================================
 * 对外异步接口（模拟网络请求）
 * ========================================================== */

/**
 * 模拟接口：根据时间范围获取大屏聚合数据
 */
export function fetchDashboardData(range: TimeRange): Promise<DashboardData> {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        const projects = genProjects(range)
        resolve({
          stat: genStat(projects),
          projects,
          riskLevelStats: genRiskLevelStats(projects),
          trend: genTrend(range, projects),
          alerts: genAlerts(range, projects)
        })
      },
      // 模拟接口耗时 300-500ms
      300 + Math.floor(Math.random() * 200)
    )
  })
}
