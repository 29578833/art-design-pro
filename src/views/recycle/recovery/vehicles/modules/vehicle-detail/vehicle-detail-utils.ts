import type { AcceptSyncFiles } from '@/types/recycle/accept'
import type { ScrapVehicleDetail, VehicleFlowStep } from '@/types/recycle/vehicle'

export interface PhotoSlot {
  key: string
  label: string
  url: string
}

export interface FlowStepView {
  label: string
  done: boolean
  time: string
  note: string
  desc: string
}

export interface FactoryStepView {
  label: string
  desc: string
  time: string
  state: 'done' | 'current' | 'pending'
  badge: string
}

export interface LogItemView {
  title: string
  operator_name: string
  time: string
}

export const DISMANTLE_PHOTO_FIELDS = [
  { key: 'cjzp', label: '车架照' },
  { key: 'fdjzp', label: '发动机照' },
  { key: 'bsqzp', label: '变速箱照' },
  { key: 'fxjzp', label: '方向器照' },
  { key: 'qqzp', label: '前桥照' },
  { key: 'hqzp', label: '后桥照' },
  { key: 'gybwzp', label: '钢印部照片' }
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

export function mapFlowSteps(steps?: VehicleFlowStep[]): FlowStepView[] {
  return (steps || []).map((s) => ({
    label: s.label || '',
    done: !!s.done,
    time: s.time || '',
    note: s.desc || s.operator || '',
    desc: s.desc || ''
  }))
}

export function buildFactorySteps(detail: ScrapVehicleDetail): FactoryStepView[] {
  const flow = detail.factory_flow || []
  const currentIdx = flow.findIndex((s) => !s.done)
  const idx = currentIdx === -1 ? flow.length : currentIdx
  return flow.map((step, i) => {
    const isDone = i < idx || (currentIdx === -1 && !!step.done)
    const isCurrent = i === idx && currentIdx !== -1
    let state: 'done' | 'current' | 'pending' = 'pending'
    if (isDone) state = 'done'
    else if (isCurrent) state = 'current'
    let badge = '待执行'
    if (isCurrent) badge = '当前'
    else if (isDone) badge = '已完成'
    return {
      label: step.label || '',
      desc: step.desc || '',
      time: step.time || '',
      state,
      badge
    }
  })
}

export function buildLogItems(detail: ScrapVehicleDetail): LogItemView[] {
  const logs = detail.operation_logs || detail.status_logs || []
  return logs.map((log) => ({
    title: log.title || '操作',
    operator_name: log.operator_name || '',
    time: log.time || ''
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

export function buildEntryPhotoItems(detail: ScrapVehicleDetail): PhotoSlot[] {
  return [
    { key: 'tow', label: '拖车单', url: detail.photo_front || '' },
    { key: 'whole', label: '整车照', url: detail.photo_side || '' },
    { key: 'rubbing', label: '车架拓印照', url: detail.photo_back || '' },
    { key: 'vin', label: '车架号照', url: detail.photo_interior || '' }
  ]
}

export function buildDismantlePhotoSlots(cache: Record<string, { url?: string }>): PhotoSlot[] {
  return DISMANTLE_PHOTO_FIELDS.map((item) => ({
    key: item.key,
    label: item.label,
    url: getImgUrl(cache[item.key])
  })).filter((s) => !!s.url)
}

export function previewUrls(slots: PhotoSlot[]) {
  return slots.map((s) => s.url).filter(Boolean)
}

export function openRecycleCert(scrapDjid: string, vehicleId?: number) {
  const id = scrapDjid || (vehicleId ? String(vehicleId) : '')
  if (id) window.open(`https://bfc.chexinmeng.com/hszma4?id=${id}`, '_blank')
}
