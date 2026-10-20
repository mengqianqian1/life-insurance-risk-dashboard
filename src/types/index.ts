/**
 * 风险等级 type 把业务的"固定枚举值"用类型锁死  字符串字面量联合类型
 */
export type RiskLevel = 'high' | 'medium' | 'low'

/**
 * 时间范围筛选
 */
export type TimeRange = 'today' | 'week' | 'month' | 'quarter'

/**
 * 项目基础信息
 */
export interface InsuranceProject {
  projectId: string
  projectName: string
  riskLevel: RiskLevel
  /** 完成进度 0-100 */
  progress: number
  /** 出错率 0-100 */
  errorRate: number
  /** 项目负责人 */
  owner: string
}

/**
 * 风险告警
 */
export interface RiskAlert {
  alertId: string
  projectName: string
  alertLevel: RiskLevel
  description: string
  /** ISO 时间字符串 */
  alertTime: string
}

/**
 * 顶部统计指标卡片聚合数据
 */
export interface StatSummary {
  totalProjects: number
  highRiskCount: number
  /** 平均完成进度 0-100 */
  avgProgress: number
  /** 平均出错率 0-100 */
  avgErrorRate: number
}

/**
 * 风险等级占比统计
 */
export interface RiskLevelStat {
  level: RiskLevel
  count: number
  percent: number
}

/**
 * 出错率趋势点
 */
export interface TrendPoint {
  /** 时间标签，如 08:00 */
  time: string
  /** 出错率 0-100 */
  errorRate: number
}

/**
 * 大屏整体聚合数据（一次筛选返回）
 */
export interface DashboardData {
  stat: StatSummary
  projects: InsuranceProject[]
  riskLevelStats: RiskLevelStat[]
  trend: TrendPoint[]
  alerts: RiskAlert[]
}

/**
 * 项目详情（含扩展信息）
 */
export interface ProjectDetail {
  projectId: string
  projectName: string
  owner: string
  riskLevel: RiskLevel
  progress: number
  errorRate: number
  /** 项目启动日期 */
  startDate: string
  /** 预计完成日期 */
  expectedEndDate: string
  /** 累计保单数 */
  totalPolicies: number
  /** 累计保费（万元） */
  totalPremium: number
  /** 团队成员 */
  teamMembers: string[]
  /** 项目描述 */
  description: string
  /** 关键指标列表 */
  keyMetrics: { label: string; value: string; unit?: string }[]
  /** 产品与项目定位 */
  productInfo: {
    category: string
    targetCustomer: string
    coverage: string
    valueProposition: string
  }
  /** 销售经营数据 */
  salesData: {
    targetPremium: number
    completionRate: number
    monthlyPolicies: number
    renewalRate: number
    channelData: { name: string; value: number }[]
  }
  /** 项目价值贡献 */
  valueMetrics: { label: string; value: string; unit?: string; trend: number }[]
  /** 风险分析与处置建议 */
  riskAnalysis: {
    summary: string
    factors: { label: string; level: RiskLevel; value: string }[]
    action: string
  }
  /** 详情页重要告警 */
  alerts: RiskAlert[]
}

/**
 * 项目对比数据（本月 vs 上月）
 */
export interface ProjectCompareData {
  projectId: string
  projectName: string
  /** 当前月数据 */
  currentMonth: {
    progress: number
    errorRate: number
    policies: number
    premium: number
  }
  /** 上月数据 */
  previousMonth: {
    progress: number
    errorRate: number
    policies: number
    premium: number
  }
  /** 变化率（百分比，正数为上升，负数为下降） */
  changes: {
    progress: number
    errorRate: number
    policies: number
    premium: number
  }
  /** 月度趋势（近6个月） */
  monthlyTrend: {
    month: string
    progress: number
    errorRate: number
  }[]
}

/**
 * 风险等级中文映射
 */
export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
}

/**
 * 风险等级颜色映射（hex）
 */
export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  high: '#ff4d5e',
  medium: '#ffb020',
  low: '#2ecf7a'
}

/**
 * 时间范围中文映射
 */
export const TIME_RANGE_LABEL: Record<TimeRange, string> = {
  today: '今日',
  week: '本周',
  month: '本月',
  quarter: '本季'
}


