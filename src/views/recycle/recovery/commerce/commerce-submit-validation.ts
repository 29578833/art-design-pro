import type {
  AcceptAgentData,
  AcceptOwnerData,
  AcceptSyncFiles,
  AcceptVehicleData
} from '@/types/recycle/accept'

export interface CommerceMissingSection {
  fields: string[]
  images: string[]
}

export interface CommerceMissingData {
  owner: CommerceMissingSection
  vehicle: CommerceMissingSection
  agent: CommerceMissingSection
}

function hasVal(val: unknown) {
  return val !== undefined && val !== null && String(val).trim() !== ''
}

/** 列表提交商务部前的字段校验（对齐 admin validateRequiredFields，仅字段不含图片） */
export function validateCommerceSubmitFields(editData: AcceptSyncFiles): CommerceMissingData {
  const owner = (editData.owner || {}) as AcceptOwnerData
  const vehicle = (editData.vehicle || {}) as AcceptVehicleData
  const agent = (editData.agent || {}) as AcceptAgentData
  const isPersonal = String(owner.syq) === '2'

  const missing: CommerceMissingData = {
    owner: { fields: [], images: [] },
    vehicle: { fields: [], images: [] },
    agent: { fields: [], images: [] }
  }

  if (!hasVal(owner.sfzmmc)) missing.owner.fields.push('证件类型')
  if (!hasVal(owner.syr)) missing.owner.fields.push(isPersonal ? '所有人姓名' : '企业完整名称')
  if (!hasVal(owner.sfzmhm))
    missing.owner.fields.push(isPersonal ? '身份证号码' : '统一社会信用代码')
  if (!hasVal(owner.dh)) missing.owner.fields.push('联系电话')
  if (!hasVal(owner.dz)) missing.owner.fields.push(isPersonal ? '联系地址' : '企业注册地址')

  if (!hasVal(vehicle.clsbdh)) missing.vehicle.fields.push('车架号')
  if (!hasVal(vehicle.hphm)) missing.vehicle.fields.push('号牌号码')
  if (!hasVal(vehicle.hpzl)) missing.vehicle.fields.push('号牌种类')
  if (!hasVal(vehicle.cllx)) missing.vehicle.fields.push('车辆类型')
  if (!hasVal(vehicle.syxz)) missing.vehicle.fields.push('使用性质')
  if (!hasVal(vehicle.xszbh)) missing.vehicle.fields.push('行驶证编号')
  if (!hasVal(vehicle.czbh)) missing.vehicle.fields.push('产证编号')
  if (!hasVal(vehicle.ppxh)) missing.vehicle.fields.push('品牌型号')
  if (!hasVal(vehicle.ccdjrq)) missing.vehicle.fields.push('注册登记日期')
  if (!hasVal(vehicle.rlzl)) missing.vehicle.fields.push('燃料种类')
  if (!hasVal(vehicle.fdjh)) missing.vehicle.fields.push('发动机号码')
  if (!hasVal(vehicle.cwkc)) missing.vehicle.fields.push('车长(mm)')
  if (!hasVal(vehicle.cwkk)) missing.vehicle.fields.push('车宽(mm)')
  if (!hasVal(vehicle.cwkg)) missing.vehicle.fields.push('车高(mm)')
  if (!hasVal(vehicle.zbzl)) missing.vehicle.fields.push('整备质量(kg)')
  if (!hasVal(vehicle.zzl)) missing.vehicle.fields.push('总质量(kg)')
  if (!hasVal(vehicle.hdzk)) missing.vehicle.fields.push('核定载人数')
  if (!hasVal(vehicle.csys)) missing.vehicle.fields.push('车身颜色')

  if (agent.jbr || agent.jbrsfzmhm || agent.jbrdh) {
    if (!hasVal(agent.jbr)) missing.agent.fields.push('代理人姓名')
    if (!hasVal(agent.jbrsfzmhm)) missing.agent.fields.push('代理人证件号码')
    if (!hasVal(agent.jbrdh)) missing.agent.fields.push('代理人联系电话')
  }

  return missing
}

export function countCommerceMissing(missing: CommerceMissingData) {
  return (
    missing.owner.fields.length +
    missing.owner.images.length +
    missing.vehicle.fields.length +
    missing.vehicle.images.length +
    missing.agent.fields.length +
    missing.agent.images.length
  )
}
