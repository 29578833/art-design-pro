import request from '@/utils/http'
import type {
  AcceptAuthSmsParams,
  AcceptDictUsernameOption,
  AcceptIdCardOcrData,
  AcceptInitFormParams,
  AcceptInitFormResult,
  AcceptList,
  AcceptListItem,
  AcceptListParams,
  AcceptLicenseOcrData,
  AcceptOriginFields,
  AcceptRegCertOcrData,
  AcceptSaveAgentParams,
  AcceptSaveOwnerParams,
  AcceptSaveVehicleParams,
  AcceptSubmitResult,
  AcceptSyncFiles,
  AcceptUploadResult
} from '@/types/recycle/accept'
import type { DrivingLicenseOcrData } from '@/types/recycle/ocr'

function resolvePagination(params: AcceptListParams) {
  return {
    page: Number(params.page ?? params.current ?? 1),
    limit: Number(params.limit ?? params.size ?? 20)
  }
}

/** 回收业务下的商务部对接受理列表（本地数据源） */
export async function fetchAcceptLocalList(params: AcceptListParams): Promise<AcceptList> {
  const { page, limit } = resolvePagination(params)
  const res = await request.get<{ list: AcceptListItem[]; total: number } | AcceptListItem[]>({
    url: '/scrap/accept_local/list',
    params: {
      page,
      limit,
      is_vehicle_mgmt: params.is_vehicle_mgmt ?? '',
      clsbdh: params.clsbdh?.trim() || '',
      yhsjhm: params.yhsjhm?.trim() || '',
      platform: params.platform || '',
      syr: params.syr?.trim() || '',
      syrsmrz: params.syrsmrz ?? '',
      jbr: params.jbr?.trim() || '',
      jbrsmrz: params.jbrsmrz ?? '',
      zt: params.zt || '',
      startsj: params.startsj || '',
      endsj: params.endsj || ''
    }
  })

  const list = Array.isArray(res) ? res : res.list || []
  const total = Array.isArray(res) ? list.length : Number(res.total || 0)
  return { records: list, total, current: page, size: limit }
}

/** 受理人字典列表 */
export function fetchAcceptDictUsernameList() {
  return request.get<AcceptDictUsernameOption[]>({
    url: '/scrap/accept/dict_username_list'
  })
}

/** 车信盟登录验证码 */
export function fetchAcceptSendSms(data: { mobile: string }) {
  return request.post({
    url: '/scrap/accept/send_sms',
    params: data,
    showSuccessMessage: true
  })
}

/** 车信盟验证码登录（mobile/captcha 需 SM2 加密） */
export function fetchAcceptPhoneLogin(data: { mobile: string; captcha: string }) {
  return request.post({
    url: '/scrap/accept/phone_login',
    params: data,
    showSuccessMessage: true
  })
}

/** 获取受理编辑数据（本地 accept_local，列表提交校验用） */
export function fetchAcceptLocalScrapFiles(params: { vehicle_id?: number; cjid?: string }) {
  return request.get<AcceptSyncFiles>({
    url: '/scrap/accept_local/get_scrap_files',
    params
  })
}

/** 初始化受理表单（创建/绑定 owner_sync） */
export function fetchAcceptInitForm(data: AcceptInitFormParams) {
  return request.post<AcceptInitFormResult>({
    url: '/scrap/accept/init_form',
    params: data
  })
}

/** 从同步表获取受理编辑数据 */
export function fetchAcceptSyncFiles(params: { vehicle_id?: number; cjid?: string }) {
  return request.get<AcceptSyncFiles>({
    url: '/scrap/accept/get_scrap_files_from_sync',
    params
  })
}

/** 影像材料缓存 */
export function fetchAcceptFilesCache(vehicleId: number) {
  return request.get<{
    bfcj?: Record<string, { url?: string; cjid?: string }>
    appendList?: unknown[]
    djid?: string
  }>({
    url: '/scrap/accept/get_scrap_files_cache',
    params: { vehicle_id: vehicleId }
  })
}

/** 车辆属地回显 */
export function fetchAcceptOriginFields(params: { vehicle_id?: number; cjid?: string }) {
  return request.get<AcceptOriginFields>({
    url: '/scrap/accept/get_vehicle_origin_fields',
    params
  })
}

/** 保存所有人信息 */
export function fetchAcceptSaveOwner(data: AcceptSaveOwnerParams) {
  return request.post({
    url: '/scrap/accept/save_owner',
    params: data,
    showSuccessMessage: true
  })
}

/** 保存车辆信息 */
export function fetchAcceptSaveVehicle(data: AcceptSaveVehicleParams) {
  return request.post({
    url: '/scrap/accept/save_vehicle',
    params: data,
    showSuccessMessage: true
  })
}

/** 保存代理人信息 */
export function fetchAcceptSaveAgent(data: AcceptSaveAgentParams) {
  return request.post({
    url: '/scrap/accept/save_agent',
    params: data,
    showSuccessMessage: true
  })
}

/** 实名认证短信/扫码 */
export function fetchAcceptAuthSms(data: AcceptAuthSmsParams) {
  return request.post({
    url: '/scrap/accept/auth_send_sms',
    params: data,
    showSuccessMessage: true
  })
}

/** 提交至商务部 */
export function fetchAcceptSubmit(vehicleId: number) {
  return request.post<AcceptSubmitResult>({
    url: '/scrap/accept/submit',
    params: { vehicle_id: vehicleId },
    showSuccessMessage: true
  })
}

/** 获取提交结果 */
export function fetchAcceptSubmitResult(vehicleId: number) {
  return request.get<AcceptSubmitResult>({
    url: '/scrap/accept/get_submit_result',
    params: { vehicle_id: vehicleId }
  })
}

/** 抓取车辆档案 */
export function fetchAcceptArchive(vehicleId: number) {
  return request.get({
    url: '/scrap/accept/fetch_archive',
    params: { vehicle_id: vehicleId },
    showSuccessMessage: true
  })
}

/** 营业执照 OCR */
export function fetchAcceptRecognizeLicense(imageUrl: string) {
  return request.post<AcceptLicenseOcrData>({
    url: '/scrap/accept/recognize_license',
    params: { image_url: imageUrl },
    timeout: 60000
  })
}

/** 行驶证 OCR（路由拼写为 licens） */
export function fetchAcceptRecognizeDrivingLicense(imageUrl: string) {
  return request.post<DrivingLicenseOcrData>({
    url: '/scrap/accept/recognize_driving_licens',
    params: { image_url: imageUrl },
    timeout: 60000
  })
}

/** 产证 OCR */
export function fetchAcceptRecognizeRegCert(imageUrl: string) {
  return request.post<AcceptRegCertOcrData>({
    url: '/scrap/accept/recognize_registration_cert',
    params: { image_url: imageUrl },
    timeout: 60000
  })
}

/** 身份证 OCR */
export function fetchAcceptRecognizeIdCard(imageUrl: string, side?: 'front' | 'back' | '') {
  return request.post<AcceptIdCardOcrData>({
    url: '/scrap/accept/recognize_id_card',
    params: { image_url: imageUrl, side: side || '' },
    timeout: 60000
  })
}

/** 统一上传图片（有 vehicle_id 时写 sync） */
export async function fetchAcceptUploadImage(options: {
  file: File | Blob
  vehicle_id?: number
  field?: string
  lx?: string
}) {
  const formData = new FormData()
  const fileName = options.file instanceof File ? options.file.name : `upload-${Date.now()}.png`
  formData.append('file', options.file, fileName)
  if (options.vehicle_id) formData.append('vehicle_id', String(options.vehicle_id))
  if (options.field) formData.append('field', options.field)
  if (options.lx) formData.append('lx', options.lx)

  const res = await request.post<AcceptUploadResult>({
    url: '/scrap/accept/upload_image_all',
    data: formData,
    showSuccessMessage: false
  })

  const raw = res?.url
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') return raw.src || raw.url || ''
  return ''
}
