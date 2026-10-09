import { ElMessage } from 'element-plus'
import { batchFillUploadSlots } from './utils'

/**
 * 批量上传通用流程：按槽位顺序上传并给出统一提示。
 * 三个 step 组件的 handleBatchUpload 逻辑此前完全重复，此处收敛为一处。
 */
export function useBatchUpload() {
  const batchUploading = ref(false)

  /**
   * @param fields 槽位字段顺序
   * @param files  选中的文件
   * @param upload 单个字段的上传实现
   * @param disabled 只读/禁用时直接跳过
   */
  async function runBatchUpload<T extends string>(
    fields: readonly T[],
    files: File[],
    upload: (field: T, file: File) => Promise<void>,
    disabled = false
  ) {
    if (disabled || batchUploading.value || !files.length) return
    batchUploading.value = true
    try {
      const { filled, excess } = await batchFillUploadSlots(fields, files, upload)
      if (!filled) {
        ElMessage.warning('未能上传图片，请重试')
      } else if (excess > 0) {
        ElMessage.warning(`已按顺序填入 ${filled} 张，还有 ${excess} 张超出槽位`)
      } else {
        ElMessage.success(`已按顺序上传 ${filled} 张图片`)
      }
    } finally {
      batchUploading.value = false
    }
  }

  return { batchUploading, runBatchUpload }
}
