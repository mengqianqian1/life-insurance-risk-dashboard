import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig
} from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 后端统一响应结构约定：
 * { code: 0, data: T, msg: 'ok' }
 * code === 0 视为成功，其余为业务错误
 */
export interface ApiResponse<T = unknown> {
  code: number
  data: T
  msg: string
}

/** 业务错误（code 非 0），携带状态码便于上层区分处理 */
export class ApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/** 需要放行 code 的接口（如登录返回 401 时仍希望拿到 body 自行处理） */
const WHITE_CODES: number[] = []

/**
 * axios 二次封装：
 * - 统一 baseURL / 超时 / Content-Type
 * - 请求拦截：自动携带 token
 * - 响应拦截：统一解包 ApiResponse，业务错误与 HTTP 错误统一处理
 * - 泛型方法 get/post/put/delete 直接返回 Promise<T>（已解包 data）
 */
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

/* ---------------- 请求拦截器 ---------------- */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 读取 token 并注入 Authorization
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/* ---------------- 响应拦截器 ---------------- */
service.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResponse
    // 非标准结构（如文件流 / 第三方接口）不校验业务码
    if (res === null || typeof res !== 'object' || !('code' in res)) {
      return response
    }
    // 白名单内的错误码交给业务自行处理，不弹全局提示
    if (res.code !== 0 && WHITE_CODES.includes(res.code)) {
      return Promise.reject(new ApiError(res.code, res.msg))
    }
    if (res.code !== 0) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new ApiError(res.code, res.msg))
    }
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    // HTTP 层错误统一处理
    const status = error.response?.status
    const message = error.response?.data?.msg || error.message

    switch (status) {
      case 401:
        ElMessage.error('登录已过期，请重新登录')
        localStorage.removeItem('token')
        // 跳转登录页（大屏项目无登录页，预留注释）
        // window.location.href = '/login'
        break
      case 403:
        ElMessage.error('没有权限访问该资源')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器开小差了，请稍后重试')
        break
      default:
        ElMessage.error(message || '网络异常，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

/**
 * 统一解包：从 axios 响应中取出业务 data
 * - 标准结构 { code, data, message } → 返回 res.data
 * - 非标准结构（文件流等）→ 返回原始数据
 */
function unwrap<T>(response: AxiosResponse): T {
  const res = response.data as ApiResponse
  if (res === null || typeof res !== 'object' || !('code' in res)) {
    return res as unknown as T
  }
  console.log(res.data,'-----------------T');
  return res.data as T
}

/**
 * 核心请求方法：泛型 T 为解包后的数据类型
 */
function request<T>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config).then((response) => unwrap<T>(response))
}

/** 便捷方法：带 query 的 GET */
export function get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  // 组装 GET 请求配置：url + query 参数，config 放最后以便覆盖默认项
  return request<T>({ url, method: 'get', params, ...config })
}

/** 便捷方法：JSON body 的 POST */
export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ url, method: 'post', data, ...config })
}

/** 便捷方法：全量更新 PUT */
export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ url, method: 'put', data, ...config })
}

/** 便捷方法：删除 DELETE（支持 query） */
export function del<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
  return request<T>({ url, method: 'delete', params, ...config })
}

export default service
