import { uploadFile } from '@/api/upload'
import request from '@/utils/http'
import { HttpError } from '@/utils/http/error'
import { ApiStatus } from '@/utils/http/status'
import type { DrivingLicenseOcrResult } from '@/types/recycle/recovery/vehicles/ocr'

const OCR_TIMEOUT = 60000

/** 解析 OCR 接口地址：adminapi → api/scrap/ocr/recognize */
export function resolveOcrRecognizeUrl() {
  const customUrl = import.meta.env.VITE_OCR_RECOGNIZE_URL
  if (customUrl) return customUrl

  const apiUrl = import.meta.env.VITE_API_URL || ''
  if (apiUrl.includes('/adminapi')) {
    return apiUrl.replace(/\/adminapi\/?$/, '/api/scrap/ocr/recognize')
  }

  return '/api/scrap/ocr/recognize'
}

/** 行驶证 OCR 识别（需先上传图片获取 URL） */
export function recognizeDrivingLicense(imageUrl: string) {
  return request.post<DrivingLicenseOcrResult>({
    url: resolveOcrRecognizeUrl(),
    data: { image_url: imageUrl },
    timeout: OCR_TIMEOUT,
    showSuccessMessage: false
  })
}

/** 上传行驶证并识别 */
export async function recognizeDrivingLicenseByFile(file: File | Blob) {
  const { url } = await uploadFile(file, { showSuccessMessage: false })
  const result = await recognizeDrivingLicense(url)

  if (!result.success || !result.data) {
    throw new HttpError(result.message || '行驶证识别失败', ApiStatus.error)
  }

  return result
}

/** 从注册日期提取年份 */
export function extractYearFromRegDate(regDate: string): string {
  const match = regDate.match(/^(\d{4})/)
  return match?.[1] || ''
}
