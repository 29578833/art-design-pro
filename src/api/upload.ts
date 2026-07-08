import request from '@/utils/http'
import { HttpError } from '@/utils/http/error'
import { ApiStatus } from '@/utils/http/status'

/** 上传接口返回 */
export interface UploadFileResult {
  /** 文件名 */
  name: string
  /** OSS 访问地址 */
  url: string
}

export interface UploadFileOptions {
  /** 表单字段名，默认 file */
  fieldName?: string
  /** 上传地址，默认 /file/upload */
  url?: string
  /** 附件分类 ID */
  pid?: number
  /** 是否显示成功提示 */
  showSuccessMessage?: boolean
  /** 是否显示错误提示 */
  showErrorMessage?: boolean
}

/** 后台上传接口：/adminapi/file/upload */
const DEFAULT_UPLOAD_URL = '/file/upload'

interface AdminUploadResponse {
  /** 文件 OSS 地址 */
  src: string
}

/** 解析上传地址 */
export function resolveUploadUrl() {
  return import.meta.env.VITE_UPLOAD_URL || DEFAULT_UPLOAD_URL
}

function normalizeUploadResult(src: string, fileName: string): UploadFileResult {
  if (!src) {
    throw new HttpError('上传失败，未返回文件地址', ApiStatus.error)
  }

  return {
    name: fileName,
    url: src
  }
}

/**
 * 上传文件到 OSS，返回文件地址
 * 对应接口：POST /adminapi/file/upload
 */
export async function uploadFile(
  file: File | Blob,
  options: UploadFileOptions = {}
): Promise<UploadFileResult> {
  const {
    fieldName = 'file',
    url = resolveUploadUrl(),
    pid = 0,
    showSuccessMessage = false,
    showErrorMessage = true
  } = options

  const fileName = file instanceof File ? file.name : `upload-${Date.now()}.png`
  const formData = new FormData()
  formData.append(fieldName, file, fileName)
  formData.append('pid', String(pid))

  try {
    const data = await request.post<AdminUploadResponse>({
      url,
      data: formData,
      showSuccessMessage,
      showErrorMessage
    })

    return normalizeUploadResult(data.src, fileName)
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }
    throw new HttpError(error instanceof Error ? error.message : '上传失败', ApiStatus.error)
  }
}

/** 上传文件并直接返回 OSS URL */
export async function uploadFileGetUrl(
  file: File | Blob,
  options?: UploadFileOptions
): Promise<string> {
  const result = await uploadFile(file, options)
  return result.url
}

/** 批量上传文件 */
export async function uploadFiles(
  files: Array<File | Blob>,
  options?: UploadFileOptions
): Promise<UploadFileResult[]> {
  return Promise.all(files.map((file) => uploadFile(file, options)))
}

/** 批量上传并返回 URL 列表 */
export async function uploadFilesGetUrls(
  files: Array<File | Blob>,
  options?: UploadFileOptions
): Promise<string[]> {
  const results = await uploadFiles(files, options)
  return results.map((item) => item.url)
}
