<template>
  <div class="view">
    <div class="panel upload-panel">
      <div class="panel-header">
        <div class="panel-title">大文件分片上传</div>
        <span class="panel-sub">
          单片 {{ chunkSizeText }}（MD5 指纹去重 · 分片上传 · 服务端合并）
        </span>
      </div>

      <div class="upload-body">
        <label class="file-picker">
          <input type="file" :disabled="state === 'hashing' || state === 'uploading'" @change="onFileChange" />
          <span>{{ file ? file.name : '点击选择文件（建议 > 10MB 观察分片上传效果）' }}</span>
        </label>

        <div v-if="file" class="file-meta">
          大小 {{ sizeText(file.size) }} · 切成 <b>{{ totalChunk }}</b> 片 · 上传前先增量计算文件 MD5
        </div>

        <div class="actions">
          <el-button
            type="primary"
            :disabled="!file || state === 'hashing' || state === 'uploading'"
            :loading="state === 'hashing'"
            @click="start"
          >
            {{ state === 'hashing' ? 'MD5 计算中' : state === 'done' ? '重新上传' : '开始上传' }}
          </el-button>
          <el-button :disabled="state === 'hashing' || state === 'uploading'" @click="reset">重选文件</el-button>
        </div>

        <div v-if="state !== 'idle'" class="progress-wrap">
          <el-progress
            :percentage="Math.floor(percent)"
            :indeterminate="state === 'hashing'"
            :duration="2"
            :status="progressStatus"
            :stroke-width="14"
          />
          <div class="progress-meta">
            <span v-if="state === 'hashing'">正在计算文件 MD5 指纹（大文件需要几秒）…</span>
            <span v-else-if="state === 'uploading'">分片上传中 {{ doneChunk }}/{{ totalChunk }} 片</span>
            <span v-else-if="state === 'done'">上传完成，服务端已合并</span>
            <span v-else-if="state === 'failed'">上传失败：{{ errorMsg }}</span>
          </div>
        </div>

        <div v-if="result" class="result-tip">
          合并结果：<b>{{ result.fileName }}</b>（{{ sizeText(result.size) }}）·
          <a :href="downloadUrl" target="_blank">点击下载验证</a>
        </div>
      </div>

      <!-- 底部：服务端已合并文件列表 -->
      <div class="server-files">
        <div class="list-title">
          服务器文件列表
          <el-button size="small" text @click="loadFiles">刷新</el-button>
        </div>
        <table v-if="files.length" class="data-table">
          <thead>
            <tr>
              <th>文件名</th>
              <th style="width: 120px">大小</th>
              <th style="width: 180px">时间</th>
              <th style="width: 100px">下载</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in files" :key="f.name">
              <td class="cell-name">{{ f.name }}</td>
              <td>{{ sizeText(f.size) }}</td>
              <td>{{ new Date(f.time).toLocaleString() }}</td>
              <td><a :href="`${BASE_URL}/file/download/${encodeURIComponent(f.name)}`">下载</a></td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty">暂无文件，上传后这里会列出合并结果</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { chunkUpload } from '@/utils/requestExport'
import { get } from '@/api/request'

interface ServerFile {
  name: string
  size: number
  time: string
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const CHUNK_SIZE = 5 * 1024 * 1024 // 与 requestExport.ts 默认单片 5MB 保持一致

type UploadState = 'idle' | 'hashing' | 'uploading' | 'done' | 'failed'

const file = ref<File | null>(null)
const state = ref<UploadState>('idle')
const percent = ref(0)
const errorMsg = ref('')
const result = ref<{ fileName: string; size: number } | null>(null)
const files = ref<ServerFile[]>([])

const totalChunk = computed(() => (file.value ? Math.ceil(file.value.size / CHUNK_SIZE) : 0))
/** onProgress 按片回调：已完成片数 = percent 换算 */
const doneChunk = computed(() => Math.round((percent.value / 100) * totalChunk.value))
const chunkSizeText = `${CHUNK_SIZE / 1024 / 1024}MB`
const downloadUrl = computed(() =>
  result.value ? `${BASE_URL}/file/download/${encodeURIComponent(result.value.fileName)}` : ''
)
const progressStatus = computed(() => {
  if (state.value === 'done') return 'success'
  if (state.value === 'failed') return 'exception'
  return undefined
})

function sizeText(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) selectFile(input.files[0])
}

function selectFile(f: File) {
  reset()
  file.value = f
}

async function start() {
  if (!file.value) return
  state.value = 'hashing'
  percent.value = 0
  errorMsg.value = ''
  result.value = null
  try {
    const merged = await chunkUpload({
      file: file.value,
      chunkSize: CHUNK_SIZE,
      // 首个进度回调到来即说明 MD5 完成并进入分片上传
      onProgress: (p) => {
        if (state.value === 'hashing') state.value = 'uploading'
        percent.value = p
      },
      onSuccess: (data) => {
        state.value = 'done'
        percent.value = 100
        result.value = data
        ElMessage.success(`上传合并完成：${data.fileName}`)
        loadFiles()
      }
    })
    // onSuccess 未触发时兜底取返回值
    if (!result.value && merged) {
      state.value = 'done'
      result.value = merged
      loadFiles()
    }
  } catch (err) {
    state.value = 'failed'
    errorMsg.value = err instanceof Error ? err.message : '未知错误'
  }
}

function reset() {
  file.value = null
  state.value = 'idle'
  percent.value = 0
  errorMsg.value = ''
  result.value = null
}

/** 服务端已合并文件列表（走统一封装的 GET，自动解包 data） */
async function loadFiles() {
  try {
    files.value = await get<ServerFile[]>('/file/list')
  } catch {
    /* 服务端未启动时静默 */
  }
}

onMounted(loadFiles)
</script>

<style scoped>
.upload-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  gap: 16px;
  overflow: auto;
}
.upload-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.file-picker {
  display: block;
  border: 1px dashed var(--border-color, #3a4a6b);
  border-radius: 8px;
  padding: 22px;
  text-align: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.2s;
}
.file-picker:hover {
  border-color: var(--accent, #4c8dff);
}
.file-picker input {
  display: none;
}
.file-picker span {
  color: var(--text-primary);
}
.file-meta {
  font-size: 12px;
  color: var(--text-secondary);
}
.actions {
  display: flex;
  gap: 10px;
}
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.progress-meta {
  font-size: 12px;
  color: var(--text-secondary);
}
.result-tip {
  font-size: 12px;
  color: var(--text-secondary);
}
.result-tip a {
  color: var(--accent, #4c8dff);
}
.list-title {
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.server-files .empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 24px 0;
  font-size: 12px;
}
.server-files a {
  color: var(--accent, #4c8dff);
}
</style>
