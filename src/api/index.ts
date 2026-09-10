/**
 * 业务 API 层：统一收口大屏所有接口
 * - 通过环境变量 VITE_USE_MOCK 控制走 mock 还是真实后端
 *   （.env 中设置 VITE_USE_MOCK=false 即切换到真实接口）
 * - 所有函数返回 Promise<T>，调用方无需关心 mock / 真实差异
 */
import { get } from './request'
import {
  fetchDashboardData as mockDashboard,
  fetchProjectDetail as mockDetail,
  fetchProjectCompare as mockCompare
} from '@/mock'
import type { DashboardData, ProjectCompareData, ProjectDetail, TimeRange } from '@/types'

/** 是否走 mock 数据（默认 true，保证 Demo 无后端可跑） */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/**
 * 获取大屏聚合数据（指标卡 / 风险占比 / 进度对比 / 趋势 / 告警）
 * GET /dashboard?range=week
 */
export function getDashboardData(range: TimeRange): Promise<DashboardData> {
  if (USE_MOCK) return mockDashboard(range)
  return get<DashboardData>('/dashboard', { range })
}

/**
 * 获取项目详情
 * GET /project/:projectId/detail
 */
export function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  if (USE_MOCK) return mockDetail(projectId)
  return get<ProjectDetail | null>(`/project/${projectId}/detail`)
}

/**
 * 获取项目月度对比数据（本月 vs 上月）
 * GET /project/:projectId/compare
 */
export function getProjectCompare(projectId: string): Promise<ProjectCompareData | null> {
  if (USE_MOCK) return mockCompare(projectId)
  return get<ProjectCompareData | null>(`/project/${projectId}/compare`)
}
