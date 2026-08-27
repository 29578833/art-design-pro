import type { AcceptSyncFiles } from '@/types/recycle/recovery/commerce/accept'
import type {
  ScrapVehicleDetail,
  VehicleDimStatus,
  VehicleFlowStep
} from '@/types/recycle/recovery/vehicles/vehicle'
import { previewIndexAt as previewIndexAtUrls, resolveDismantlePhotoUrl, buildEntryPhotoSlots } from '../vehicle-archive/archive-utils'

/** 对齐 xinguang_api ScrapVehicleServices 状态常量 */
const VEHICLE_STATUS = {
  ACCEPT_PENDING: 3,
  QC: 2,
  DISMANTLE_PENDING: 4,
  CANCEL_PENDING: 5,
  COMPLETED: 6
} as const

const DIM_NOT_STARTED = { label: '未开始', color: '#d9d9d9', bg: '#f5f5f5' }

/** 三维度状态计算，与列表接口 computeDimStatus 保持一致 */
export function computeDimStatus(status: number): VehicleDimStatus {
  const tow =
    status === VEHICLE_STATUS.ACCEPT_PENDING
      ? { label: '待派单', color: '#fa8c16', bg: '#fff7e6' }
      : status >= VEHICLE_STATUS.QC
        ? { label: '拖车完成', color: '#52c41a', bg: '#f6ffed' }
        : DIM_NOT_STARTED

  let factory = DIM_NOT_STARTED
  if (status === VEHICLE_STATUS.ACCEPT_PENDING) {
    factory = { label: '待入厂', color: '#fa8c16', bg: '#fff7e6' }
  } else if (status === VEHICLE_STATUS.QC) {
    factory = { label: '待查验', color: '#fa8c16', bg: '#fff7e6' }
  } else if (status === VEHICLE_STATUS.DISMANTLE_PENDING) {
    factory = { label: '已领料', color: '#fa8c16', bg: '#fff7e6' }
  } else if (status >= VEHICLE_STATUS.CANCEL_PENDING) {
    factory = { label: '已拆解', color: '#52c41a', bg: '#f6ffed' }
  }

  let cancel = DIM_NOT_STARTED
  if (status === VEHICLE_STATUS.CANCEL_PENDING) {
    cancel = { label: '待缴库', color: '#fa8c16', bg: '#fff7e6' }
  } else if (status >= VEHICLE_STATUS.COMPLETED) {
    cancel = { label: '已注销', color: '#52c41a', bg: '#f6ffed' }
  }

  return { tow, factory, cancel }
}

/** 解析详情三维度状态：优先接口/列表 dim_status，否则按 status 计算 */
export function resolveDimStatus(
  detail: Pick<ScrapVehicleDetail, 'status' | 'dim_status' | 'status_text'>,
  fallback?: VehicleDimStatus
): VehicleDimStatus {
  if (detail.dim_status) return detail.dim_status
  if (fallback) return fallback
  return computeDimStatus(Number(detail.status) || 0)
}

export interface PhotoSlot {
  key: string
  label: string
  url: string
}

export interface FlowStepView {
  label: string
  done: boolean
  current?: boolean
  time: string
  note: string
  desc: string
}

export interface FactoryStepView {
  label: string
  desc: string
  time: string
  status: 'done' | 'current' | 'pending'
  badge: string
}

export interface LogItemView {
  title: string
  operator_name: string
  time: string
  description: string
}

export const DISMANTLE_PHOTO_FIELDS = [
  { key: 'cjzp', label: '车架照' },
  { key: 'photo_frame2', label: '车架照2' },
  { key: 'fdjzp', label: '发动机照' },
  { key: 'bsqzp', label: '变速箱照' },
  { key: 'fxjzp', label: '方向器照' },
  { key: 'qqzp', label: '前桥照' },
  { key: 'hqzp', label: '后桥照' },
  { key: 'gybwzp', label: '钢印部照片' }
] as const

/** 办证注销只读照片字段，对齐编辑页第 5 步 CANCEL_PHOTO_ITEMS */
export const CANCEL_PHOTO_FIELDS = [
  { key: 'xhhpzp', label: '销毁号牌照' },
  { key: 'zxzmzp', label: '注销证明' },
  { key: 'lqrsfz1zp', label: '领取人' }
] as const

export function maskIdCard(val?: string) {
  if (!val) return '—'
  if (val.length <= 6) return val
  return val.substring(0, 4) + '****' + val.substring(val.length - 4)
}

export function maskPhone(val?: string) {
  if (!val) return '—'
  if (val.length <= 6) return val
  return val.substring(0, 3) + '****' + val.substring(val.length - 4)
}

export function getImgUrl(imgData: unknown) {
  if (!imgData) return ''
  if (typeof imgData === 'string') return imgData
  if (typeof imgData === 'object' && imgData !== null) {
    const o = imgData as Record<string, string>
    return o.url || o.src || o.att_dir || ''
  }
  return ''
}

/** 叠加受理同步数据（对齐 admin mergeAcceptSyncData） */
export function mergeAcceptSyncPatch(d: AcceptSyncFiles): Partial<ScrapVehicleDetail> {
  const owner = d.owner || {}
  const vehicle = d.vehicle || {}
  const agent = d.agent || {}
  const ownerImgs = d.owner_images || {}
  const vehicleImgs = d.vehicle_images || {}
  const agentImgs = d.agent_images || {}
  const patch: Partial<ScrapVehicleDetail> = {}

  const syrImg = getImgUrl(ownerImgs.syrzp)
  if (syrImg) patch.owner_license_image = syrImg
  const sfz1Img = getImgUrl(ownerImgs.sfz1zp)
  if (sfz1Img) patch.owner_id_front_image = sfz1Img
  const sfz2Img = getImgUrl(ownerImgs.sfz2zp)
  if (sfz2Img) patch.owner_id_back_image = sfz2Img
  const qksmImg = getImgUrl(ownerImgs.qksmzp)
  if (qksmImg) patch.owner_missing_image = qksmImg

  const xszzpImg = getImgUrl(vehicleImgs.xszzp)
  if (xszzpImg) patch.license_front_image = xszzpImg
  const xszzpfyImg = getImgUrl(vehicleImgs.xszzpfy)
  if (xszzpfyImg) patch.license_back_image = xszzpfyImg
  const xszbmzpImg = getImgUrl(vehicleImgs.xszbmzp)
  if (xszbmzpImg) patch.license_both_image = xszbmzpImg
  const czzpImg = getImgUrl(vehicleImgs.czzp)
  if (czzpImg) patch.cert_image = czzpImg
  const blpzzpImg = getImgUrl(vehicleImgs.blpzzp)
  if (blpzzpImg) patch.owner_change_image = blpzzpImg

  const jbrzpImg = getImgUrl(agentImgs.jbrzp)
  if (jbrzpImg) patch.agent_auth_image = jbrzpImg
  const jbrsfz1Img = getImgUrl(agentImgs.jbrsfz1zp)
  if (jbrsfz1Img) patch.agent_id_front_image = jbrsfz1Img
  const jbrsfz2Img = getImgUrl(agentImgs.jbrsfz2zp)
  if (jbrsfz2Img) patch.agent_id_back_image = jbrsfz2Img

  const tcjczpImg = getImgUrl(vehicleImgs.tcjczp)
  if (tcjczpImg) patch.photo_front = tcjczpImg
  const zczpImg = getImgUrl(vehicleImgs.zczp)
  if (zczpImg) patch.photo_side = zczpImg
  const gyzpImg = getImgUrl(vehicleImgs.gyzp)
  if (gyzpImg) patch.photo_back = gyzpImg
  const cjhzpImg = getImgUrl(vehicleImgs.cjhzp)
  if (cjhzpImg) patch.photo_interior = cjhzpImg

  if (owner.syr) patch.owner_name = String(owner.syr)
  if (owner.sfzmhm) patch.owner_id_number = String(owner.sfzmhm)
  if (owner.dh) patch.owner_phone = String(owner.dh)
  if (owner.dz) patch.owner_address = String(owner.dz)
  if (owner.syq) patch.syq = Number(owner.syq)

  if (vehicle.clsbdh) patch.vin = String(vehicle.clsbdh)
  if (vehicle.hphm) patch.plate_no = String(vehicle.hphm)
  if (vehicle.hpzl || owner.hpzl) patch.plate_type = String(vehicle.hpzl || owner.hpzl)
  if (vehicle.cllx) patch.vehicle_type = String(vehicle.cllx)
  if (vehicle.syxz) patch.fuel_nature = String(vehicle.syxz)
  if (vehicle.ccdjrq) patch.register_date = String(vehicle.ccdjrq)
  if (vehicle.rlzl) patch.fuel_type = String(vehicle.rlzl)
  if (vehicle.fdjh) patch.engine_no = String(vehicle.fdjh)
  if (vehicle.xszbh) patch.license_no = String(vehicle.xszbh)
  if (vehicle.czbh) patch.cert_no = String(vehicle.czbh)
  if (vehicle.clpp1) patch.brand_name = String(vehicle.clpp1)
  if (vehicle.clxh) patch.vehicle_model = String(vehicle.clxh)
  if (vehicle.ppxh || vehicle.clpp1) patch.brand_model = String(vehicle.ppxh || vehicle.clpp1)
  if (vehicle.csys) patch.color = String(vehicle.csys)
  if (vehicle.delivery_method) patch.delivery_method = String(vehicle.delivery_method)
  if (vehicle.settlement_type) patch.settlement_type = String(vehicle.settlement_type)
  if (vehicle.settlement_method) patch.settlement_method = String(vehicle.settlement_method)
  if (vehicle.settlement_amount) patch.settlement_amount = vehicle.settlement_amount
  if (vehicle.bank_name) patch.bank_name = String(vehicle.bank_name)
  if (vehicle.bank_branch) patch.bank_branch = String(vehicle.bank_branch)
  if (vehicle.bank_card_no) patch.bank_card_no = String(vehicle.bank_card_no)
  if (vehicle.remark) patch.remark = String(vehicle.remark)

  if (agent.jbr) {
    patch.agent_name = String(agent.jbr)
    patch.has_agent = 1
  }
  if (agent.jbrsfzmhm) patch.agent_id_number = String(agent.jbrsfzmhm)
  if (agent.jbrdh) patch.agent_phone = String(agent.jbrdh)

  return patch
}

export function isCommercialOwner(detail: ScrapVehicleDetail) {
  return Number(detail.syq) === 1 || detail.owner_type === 'company'
}

export function brandModelText(detail: ScrapVehicleDetail) {
  return detail.brand_model || [detail.brand, detail.model].filter(Boolean).join(' ') || '—'
}

export function deliveryText(detail: ScrapVehicleDetail) {
  if (detail.delivery_method_text) return detail.delivery_method_text
  if (detail.delivery_method === 'tow') return '需要拖车运输（预约上门取车）'
  if (detail.delivery_method === 'self') return '自行送车'
  return '—'
}

/** 拖车进度：后端返回 done/time/operator/desc */
export function mapTowProgressSteps(steps?: VehicleFlowStep[]): FlowStepView[] {
  return (steps || []).map((s) => ({
    label: s.label || '',
    done: !!s.done,
    time: s.time || '',
    note: s.operator || s.desc || '',
    desc: s.desc || ''
  }))
}

/** 注销办证等：后端返回 status(done/current/pending) */
export function mapStatusTimelineSteps(steps?: VehicleFlowStep[]): FlowStepView[] {
  return (steps || []).map((s) => {
    const status = s.status || (s.done ? 'done' : 'pending')
    return {
      label: s.label || '',
      done: status === 'done',
      current: status === 'current',
      time: s.time || '',
      note: s.desc || '',
      desc: s.desc || ''
    }
  })
}

/** 入厂拆解：后端 factory_flow 直接使用 status 字段 */
export function buildFactorySteps(flow?: VehicleFlowStep[]): FactoryStepView[] {
  return (flow || []).map((step) => {
    const status = step.status || 'pending'
    return {
      label: step.label || '',
      desc: step.desc || '',
      time: step.time || '',
      status,
      badge: status === 'done' ? '已完成' : status === 'current' ? '当前' : '待执行'
    }
  })
}

export function buildLogItems(logs?: ScrapVehicleDetail['operation_logs']): LogItemView[] {
  return (logs || []).map((log) => ({
    title: log.title || '操作',
    operator_name: log.operator_name || '',
    time: log.time || '',
    description: log.description || ''
  }))
}

export function buildOwnerPhotoSlots(detail: ScrapVehicleDetail): PhotoSlot[] {
  if (isCommercialOwner(detail)) {
    return [
      { key: 'license', label: '营业执照原件', url: detail.owner_license_image || '' },
      { key: 'missing', label: '缺失情况说明', url: detail.owner_missing_image || '' }
    ]
  }
  return [
    { key: 'id_front', label: '身份证正面', url: detail.owner_id_front_image || '' },
    { key: 'id_back', label: '身份证反面', url: detail.owner_id_back_image || '' },
    { key: 'missing', label: '缺失情况说明', url: detail.owner_missing_image || '' }
  ]
}

export function buildVehicleDocSlots(detail: ScrapVehicleDetail): PhotoSlot[] {
  const slots: PhotoSlot[] = [
    { key: 'xszzp', label: '行驶证正页', url: detail.license_front_image || '' },
    { key: 'xszzpfy', label: '行驶证副页', url: detail.license_back_image || '' },
    { key: 'xszbmzp', label: '正副背面', url: detail.license_both_image || '' },
    { key: 'czzp', label: '产证一二页', url: detail.cert_image || '' }
  ]
  if (detail.owner_change_image) {
    slots.push({
      key: 'blpzzp',
      label: '产权变更页（如有）',
      url: detail.owner_change_image
    })
  }
  return slots
}

export function buildAgentPhotoSlots(detail: ScrapVehicleDetail): PhotoSlot[] {
  return [
    { key: 'a1', label: '代理人身份证正面', url: detail.agent_id_front_image || '' },
    { key: 'a2', label: '代理人身份证反面', url: detail.agent_id_back_image || '' },
    { key: 'a3', label: '委托说明', url: detail.agent_auth_image || '' }
  ]
}

export function buildEntryPhotoItems(
  qualityPhotos?: Record<string, unknown> | null
): PhotoSlot[] {
  return buildEntryPhotoSlots(qualityPhotos)
}

export function buildDismantlePhotoSlots(
  cache: Record<string, { url?: string }>,
  dismantlePhotos?: Record<string, unknown> | null
): PhotoSlot[] {
  return DISMANTLE_PHOTO_FIELDS.map((item) => ({
    key: item.key,
    label: item.label,
    url: resolveDismantlePhotoUrl(item.key, cache, dismantlePhotos)
  }))
}

export function buildCancelPhotoSlots(cache: Record<string, { url?: string }>): PhotoSlot[] {
  return CANCEL_PHOTO_FIELDS.map((item) => ({
    key: item.key,
    label: item.label,
    url: getImgUrl(cache[item.key])
  }))
}

export function previewUrls(slots: PhotoSlot[]) {
  return slots.map((s) => s.url).filter(Boolean)
}

/** 计算当前槽位在过滤后预览列表中的索引。 */
export function previewIndexAt(slots: PhotoSlot[], index: number) {
  return previewIndexAtUrls(
    slots.map((s) => s.url),
    index
  )
}

export function openRecycleCert(scrapDjid: string, vehicleId?: number) {
  const id = scrapDjid || (vehicleId ? String(vehicleId) : '')
  if (id) window.open(`https://bfc.chexinmeng.com/hszma4?id=${id}`, '_blank')
}
