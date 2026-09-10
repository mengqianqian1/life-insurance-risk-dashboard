// 模拟数据
import type {
  DashboardData,
  InsuranceProject,
  ProjectCompareData,
  ProjectDetail,
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

export const PROJECT_POOL: ProjectSeed[] = [
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

/* ============================================================PROJECT_POOL
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

/* ============================================================
 * 项目详情 & 对比数据
 * ========================================================== */

const TEAM_POOL: string[][] = [
  ['张伟', '李明', '王芳', '陈静'],
  ['李娜', '刘洋', '杨帆'],
  ['王强', '赵磊', '黄敏', '周婷', '徐涛'],
  ['刘洋', '陈静', '马超'],
  ['陈静', '杨帆', '赵磊', '孙莉'],
  ['杨帆', '黄敏', '周婷'],
  ['赵磊', '徐涛', '孙莉', '马超'],
  ['黄敏', '周婷', '徐涛'],
  ['周婷', '徐涛', '孙莉', '马超', '张伟'],
  ['徐涛', '孙莉', '马超'],
  ['孙莉', '马超', '张伟', '李明'],
  ['马超', '张伟', '李娜', '王强']
]

const PROJECT_DESC: Record<string, string[]> = {
  high: [
    '该项目当前风险等级较高，主要核保规则校验失败率超过阈值，需要重点关注核保流程优化。建议加强核保系统自动化校验能力，建立实时监控预警机制。',
    '项目理赔资金存在缺口，精算准备金计提不足。需要尽快与财务部门沟通协调，补充准备金或调整理赔策略。',
    '反洗钱风控命中高风险名单，需要启动专项复核流程，配合监管部门完成调查工作。'
  ],
  medium: [
    '项目整体运行平稳，但保单质检不合格率有所上升。建议加强质检培训，优化质检流程，提升业务人员合规意识。',
    '客户回访失联率偏高，影响客户满意度评估。建议建立多渠道回访机制，提升客户沟通覆盖率。',
    '渠道返佣出现异常波动，需要与渠道方进行沟通，确认返佣计算规则是否存在歧义。'
  ],
  low: [
    '项目运行良好，各项指标正常。建议继续保持当前节奏，关注市场变化，适时调整产品策略。',
    '核心系统运行稳定，响应时长在正常范围内。建议定期进行系统性能评估，确保业务高峰期稳定运行。',
    '电子保单归档率接近目标值，建议优化归档流程，提升自动化归档比例。'
  ]
}

/**
 * 模拟接口：根据项目ID获取项目详情
 */
export function fetchProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = PROJECT_POOL.findIndex((p) => projectId === 'P' + (PROJECT_POOL.indexOf(p) + 1) || projectId.startsWith('P'))
      const numericId = parseInt(projectId.replace('P', ''), 10)
      const poolIdx = !isNaN(numericId) ? numericId - 1 : idx
      
      if (poolIdx < 0 || poolIdx >= PROJECT_POOL.length) {
        resolve(null)
        return
      }

      const seed = PROJECT_POOL[poolIdx]
      const rand = mulberry32(hashString('detail-' + projectId))
      const riskRoll = rand()
      let riskLevel: RiskLevel
      if (riskRoll < 0.25) riskLevel = 'high'
      else if (riskRoll < 0.6) riskLevel = 'medium'
      else riskLevel = 'low'

      const progress = Number((40 + rand() * 55).toFixed(1))
      let errorRate: number
      if (riskLevel === 'high') errorRate = Number((4 + rand() * 8).toFixed(2))
      else if (riskLevel === 'medium') errorRate = Number((1.5 + rand() * 3).toFixed(2))
      else errorRate = Number((0.3 + rand() * 1.5).toFixed(2))

      const startDate = new Date(2025, Math.floor(rand() * 6), Math.floor(rand() * 28) + 1)
      const expectedEnd = new Date(startDate.getTime() + (90 + rand() * 180) * 24 * 3600 * 1000)

      const descArr = PROJECT_DESC[riskLevel]
      const description = descArr[Math.floor(rand() * descArr.length)]

      resolve({
        projectId,
        projectName: seed.name,
        owner: seed.owner,
        riskLevel,
        progress,
        errorRate,
        startDate: startDate.toISOString().slice(0, 10),
        expectedEndDate: expectedEnd.toISOString().slice(0, 10),
        totalPolicies: Math.floor(1000 + rand() * 5000),
        totalPremium: Number((500 + rand() * 3000).toFixed(1)),
        teamMembers: TEAM_POOL[poolIdx % TEAM_POOL.length],
        description,
        keyMetrics: [
          { label: '核保通过率', value: String(Number((70 + rand() * 25).toFixed(1))), unit: '%' },
          { label: '理赔时效', value: String(Number((2 + rand() * 5).toFixed(1))), unit: '天' },
          { label: '客户满意度', value: String(Number((80 + rand() * 18).toFixed(1))), unit: '%' },
          { label: '续期率', value: String(Number((85 + rand() * 12).toFixed(1))), unit: '%' }
        ],
        productInfo: {
          category: '长期保障型保险',
          targetCustomer: '25-55 岁家庭及企业核心成员',
          coverage: '身故保障、重疾保障、长期现金价值',
          valueProposition: '以稳定保障和长期储蓄为核心，覆盖客户全生命周期风险。'
        },
        salesData: {
          targetPremium: Number((2800 + rand() * 2600).toFixed(1)),
          completionRate: Number((62 + rand() * 34).toFixed(1)),
          monthlyPolicies: Math.floor(180 + rand() * 620),
          renewalRate: Number((82 + rand() * 15).toFixed(1)),
          channelData: [
            { name: '代理人', value: Math.floor(35 + rand() * 20) },
            { name: '银保渠道', value: Math.floor(18 + rand() * 18) },
            { name: '线上直销', value: Math.floor(12 + rand() * 16) },
            { name: '团险渠道', value: 100 }
          ]
        },
        valueMetrics: [
          { label: '预计年度价值', value: String(Math.floor(680 + rand() * 820)), unit: '万元', trend: Number((3 + rand() * 16).toFixed(1)) },
          { label: '客户覆盖人数', value: String(Math.floor(4800 + rand() * 9200)), unit: '人', trend: Number((2 + rand() * 12).toFixed(1)) },
          { label: '风险保障额度', value: String((1.2 + rand() * 2.8).toFixed(1)), unit: '亿元', trend: Number((1 + rand() * 10).toFixed(1)) },
          { label: '预计续期贡献', value: String(Math.floor(320 + rand() * 520)), unit: '万元', trend: Number((4 + rand() * 14).toFixed(1)) }
        ],
        riskAnalysis: {
          summary: description,
          factors: [
            { label: '核保质量', level: riskLevel, value: `${Math.max(72, 100 - errorRate * 4).toFixed(1)}%` },
            { label: '销售合规', level: riskLevel === 'high' ? 'medium' : 'low', value: `${(91 + rand() * 7).toFixed(1)}%` },
            { label: '续期稳定性', level: riskLevel === 'low' ? 'low' : 'medium', value: `${(82 + rand() * 15).toFixed(1)}%` }
          ],
          action: riskLevel === 'high' ? '建议 24 小时内完成专项复核，项目负责人跟进闭环。' : '建议按周复盘风险指标，持续跟踪异常变化。'
        },
        alerts: riskLevel === 'high'
          ? [
              { alertId: `D-${projectId}-01`, projectName: seed.name, alertLevel: 'high', description: '项目风险等级较高，请优先完成核保与准备金专项复核。', alertTime: new Date().toISOString() },
              { alertId: `D-${projectId}-02`, projectName: seed.name, alertLevel: 'medium', description: '近期销售合规指标波动，建议核查重点渠道业务记录。', alertTime: new Date(Date.now() - 3600000).toISOString() }
            ]
          : riskLevel === 'medium'
            ? [{ alertId: `D-${projectId}-01`, projectName: seed.name, alertLevel: 'medium', description: '项目存在需要关注的经营波动，请在本周内完成跟踪。', alertTime: new Date().toISOString() }]
            : []
      })
    }, 200 + Math.random() * 200)
  })
}

/**
 * 模拟接口：根据项目ID获取对比数据（本月 vs 上月）
 */
export function fetchProjectCompare(projectId: string): Promise<ProjectCompareData | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const numericId = parseInt(projectId.replace('P', ''), 10)
      const poolIdx = !isNaN(numericId) ? numericId - 1 : -1

      if (poolIdx < 0 || poolIdx >= PROJECT_POOL.length) {
        resolve(null)
        return
      }

      const seed = PROJECT_POOL[poolIdx]
      const rand = mulberry32(hashString('compare-' + projectId))

      // 上月基准数据
      const prevProgress = Number((35 + rand() * 50).toFixed(1))
      const prevErrorRate = Number((1 + rand() * 5).toFixed(2))
      const prevPolicies = Math.floor(800 + rand() * 4000)
      const prevPremium = Number((400 + rand() * 2500).toFixed(1))

      // 本月数据（带波动）
      const progressDelta = (rand() - 0.4) * 8 // -3.2 ~ 4.8
      const errorDelta = (rand() - 0.4) * 2 // -0.8 ~ 0.4
      const policiesDelta = Math.floor((rand() - 0.3) * 800)
      const premiumDelta = Number(((rand() - 0.3) * 500).toFixed(1))

      const currProgress = Math.min(100, Math.max(0, Number((prevProgress + progressDelta).toFixed(1))))
      const currErrorRate = Math.max(0, Number((prevErrorRate + errorDelta).toFixed(2)))
      const currPolicies = Math.max(0, prevPolicies + policiesDelta)
      const currPremium = Math.max(0, Number((prevPremium + premiumDelta).toFixed(1)))

      // 计算变化率
      const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return 0
        return Number((((curr - prev) / prev) * 100).toFixed(1))
      }

      // 月度趋势（近6个月）
      const months: { month: string; progress: number; errorRate: number }[] = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const label = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
        const mRand = mulberry32(hashString(`trend-${projectId}-${i}`))
        months.push({
          month: label,
          progress: Number((30 + mRand() * 60).toFixed(1)),
          errorRate: Number((0.5 + mRand() * 6).toFixed(2))
        })
      }

      resolve({
        projectId,
        projectName: seed.name,
        currentMonth: {
          progress: currProgress,
          errorRate: currErrorRate,
          policies: currPolicies,
          premium: currPremium
        },
        previousMonth: {
          progress: prevProgress,
          errorRate: prevErrorRate,
          policies: prevPolicies,
          premium: prevPremium
        },
        changes: {
          progress: calcChange(currProgress, prevProgress),
          errorRate: calcChange(currErrorRate, prevErrorRate),
          policies: calcChange(currPolicies, prevPolicies),
          premium: calcChange(currPremium, prevPremium)
        },
        monthlyTrend: months
      })
    }, 200 + Math.random() * 200)
  })
}
