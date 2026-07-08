import { uploadFile } from '@/api/upload'
import request from '@/utils/http'
import { HttpError } from '@/utils/http/error'
import { ApiStatus } from '@/utils/http/status'
import type { DrivingLicenseOcrData, DrivingLicenseOcrResult } from '@/types/recycle/ocr'

const OCR_TIMEOUT = 60000
const FUEL_TYPES = ['汽油', '柴油', '纯电动', '插电混动', '油电混动']
const EMISSION_STANDARDS = ['国一', '国二', '国三', '国四', '国五', '国六', '新能源']

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

/** 从 OCR 结果推断燃料类型 */
export function parseFuelTypeFromOcr(data: DrivingLicenseOcrData): string {
  const text = `${data.inspection_record || ''}${data.vehicle_type || ''}${data.model || ''}`

  for (const fuelType of FUEL_TYPES) {
    if (text.includes(fuelType)) return fuelType
  }

  if (/纯电|电动/.test(text)) return '纯电动'
  if (/混动/.test(text)) return '油电混动'

  return ''
}

/** 从 OCR 结果推断排放标准 */
export function parseEmissionStandardFromOcr(data: DrivingLicenseOcrData): string {
  const text = `${data.inspection_record || ''}${data.vehicle_type || ''}${data.model || ''}`

  for (const standard of EMISSION_STANDARDS) {
    if (text.includes(standard)) return standard
  }

  return ''
}

/** 从注册日期提取年份 */
export function extractYearFromRegDate(regDate: string): string {
  const match = regDate.match(/^(\d{4})/)
  return match?.[1] || ''
}
