import service from '@/api/request'
import type { AxiosRequestConfig } from 'axios'
// 大文件上传，分片上传
import SparkMD5 from 'spark-md5'


export function exportFile(url:string,params:Record<string,any>,fileName:string){
    // AxiosRequestConfig 代表什么？axios 请求配置对象，包含了请求的各种参数和选项，如请求方法，请求头，请求体，响应类型，超时时间等。

    const config: AxiosRequestConfig={
        method:'post',
        url,
        data:params,
        responseType:'blob', // 关键：接收二进制文件流
        timeout:30000,//导出文件，超时时间调大
    }

    return service(config).then(res=>{
        // 创建一个blob对象，用于存储二进制数据

        const blob=new Blob([res.data])
        // 创建一个临时的 a 标签，用于触发下载操作

        const blobUrl=URL.createObjectURL(blob)
        // 创建一个 a 标签，设置其 href 为 blobUrl，download 属性为文件名

        const a=document.createElement('a')
        // 关键：设置 a 标签的 href 为 blobUrl，这样点击时就会触发下载操作

        a.href=blobUrl
        // 关键：设置 a 标签的 download 属性为文件名，这样下载的文件名就是指定的名字

        a.download=fileName
        // 关键：将 a 标签添加到 body 中，这样才能触发点击事件
        document.body.appendChild(a)
        // 关键：触发 a 标签的点击事件，开始下载
        a.click()
        // 关键：下载完成后，移除 a 标签和 blobUrl，释放内存
        document.body.removeChild(a)
        // 释放 blobUrl 对象，避免内存泄漏

        URL.revokeObjectURL(blobUrl) // 释放内存
  
    })
}
// 导入：单文件导入

// 导入请求：POST，FormData上传文件
export function importFile(url: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
  const config: AxiosRequestConfig = {
    method: 'post',
    url,
    data: formData,
   
    timeout: 60000 // 大文件导入超时设置更长
  }
  return service(config)
}




/**
 * 分片上传参数
 * @param file 原始文件
 * @param chunkSize 每块大小，单位字节，默认 5MB
 * @param onProgress 上传进度回调
 * @param onSuccess 全部上传完成回调
 * @param onError 出错回调
 */
export interface ChunkUploadOptions {
  file: File
  chunkSize?: number
  onProgress?: (percent: number) => void
  onSuccess?: (result: any) => void
  onError?: (err: Error) => void
}

/**
 * 【核心】增量计算文件MD5，大文件不会爆内存
 */
function calculateFileMD5(file: File, chunkSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()
    let currentChunk = 0
    const totalChunks = Math.ceil(file.size / chunkSize)

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const blob = file.slice(start, end)
      reader.readAsArrayBuffer(blob)
    }

    reader.onload = (e) => {
      spark.append(e.target?.result as ArrayBuffer)
      currentChunk++
      if (currentChunk < totalChunks) {
        loadNext()
      } else {
        // 全部读取完成，拿到md5
        const md5 = spark.end()
        resolve(md5)
      }
    }

    reader.onerror = () => {
      reject(new Error('MD5计算失败'))
    }
    loadNext()
  })
}

/**
 * 分片上传主函数
 */
export async function chunkUpload(options: ChunkUploadOptions) {
  const {
    file,
    chunkSize = 5 * 1024 * 1024, // 默认每块5MB
    onProgress,
    onSuccess,
    onError
  } = options

  try {
    // 1、先计算文件MD5，作为fileKey，唯一标识文件内容（文件名相同内容不同，md5不一样）
    const fileMD5 = await calculateFileMD5(file, chunkSize)
    const totalSize = file.size
    const totalChunk = Math.ceil(totalSize / chunkSize)

    // ✅【断点续传前置】可选：请求后端，查询该MD5已上传的分片列表，跳过已上传分片
    // const { uploadedChunkList } = await service({
    //   method:'post',
    //   url:'/api/file/getUploadedChunk',
    //   data:{ fileKey: fileMD5 }
    // })

    // 2、循环上传每一个分片
    for (let chunkIndex = 0; chunkIndex < totalChunk; chunkIndex++) {
      // 如果开启断点续传：if(uploadedChunkList.includes(chunkIndex)) continue

      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, totalSize)
      const chunkBlob = file.slice(start, end)

      const formData = new FormData()
      formData.append('chunk', chunkBlob) // 当前分片二进制
      formData.append('fileKey', fileMD5) // ✅ 使用MD5作为文件唯一标识
      formData.append('chunkIndex', String(chunkIndex))
      formData.append('totalChunk', String(totalChunk))
      formData.append('fileName', file.name)

      const config: AxiosRequestConfig = {
        method: 'post',
        url: '/file/uploadChunk', // baseURL 已含 /api，此处勿再带 /api 前缀
        data: formData,
        timeout: 60000,
      }
      await service(config)

      // 更新上传进度
      const uploadedSize = (chunkIndex + 1) * chunkSize
      const percent = Math.min((uploadedSize / totalSize) * 100, 100)
      onProgress?.(percent)
    }

    // 3、分片全部传完，调用合并接口
    const mergeRes = await service({
      method: 'post',
      url: '/file/mergeChunk', // baseURL 已含 /api，此处勿再带 /api 前缀
      data: {
        fileKey: fileMD5,
        fileName: file.name,
        totalChunk
      }
    })

    onSuccess?.(mergeRes.data)
    return mergeRes.data
  } catch (err) {
    onError?.(err as Error)
    throw err
  }
}