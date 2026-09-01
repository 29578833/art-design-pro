/**
 * 上传进度全局状态
 *
 * 统一维护当前所有进行中的上传任务，供「上传进度提示」全局组件渲染。
 * 凡是以 FormData 发起的上传请求（在 @/utils/http 的请求拦截器自动识别），
 * 都会自动登记 / 更新 / 结束任务，用户无需在每个上传入口重复实现进度逻辑。
 *
 * @module utils/upload-progress
 */

import { computed, reactive } from 'vue'

/** 上传任务状态 */
export type UploadTaskStatus = 'uploading' | 'done' | 'error'

/** 上传任务 */
export interface UploadProgressTask {
  /** 任务唯一标识 */
  id: string
  /** 上传文件名 */
  name: string
  /** 进度百分比 0 - 100 */
  progress: number
  /** 状态 */
  status: UploadTaskStatus
}

interface UploadProgressState {
  tasks: UploadProgressTask[]
}

const state = reactive<UploadProgressState>({ tasks: [] })

let seed = 0

/** 开始一个上传任务，返回任务 id */
export function startUploadTask(name: string): string {
  const id = `upload-${Date.now()}-${++seed}`
  state.tasks.push({ id, name, progress: 0, status: 'uploading' })
  return id
}

/** 更新上传任务进度（0-100） */
export function updateUploadTask(id: string, progress: number): void {
  const task = state.tasks.find((item) => item.id === id)
  if (!task) return
  task.progress = Math.max(0, Math.min(100, Math.round(progress)))
}

/** 结束上传任务，短暂保留后移除，让用户看到完成 / 失败反馈 */
export function finishUploadTask(id: string, status: Exclude<UploadTaskStatus, 'uploading'>): void {
  const task = state.tasks.find((item) => item.id === id)
  if (!task) return
  task.progress = 100
  task.status = status

  // 保留 2s 再移除，避免进度条瞬间消失
  setTimeout(() => {
    const index = state.tasks.findIndex((item) => item.id === id)
    if (index >= 0) state.tasks.splice(index, 1)
  }, 2000)
}

/** 读取上传进度状态（供组件使用） */
export function useUploadProgress() {
  const tasks = computed(() => state.tasks)
  /** 当前正在进行中的任务 */
  const activeTasks = computed(() => state.tasks.filter((item) => item.status === 'uploading'))
  /** 是否有进行中的任务 */
  const hasActive = computed(() => activeTasks.value.length > 0)

  return { tasks, activeTasks, hasActive }
}
