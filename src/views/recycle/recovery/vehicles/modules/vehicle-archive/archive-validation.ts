import type {
  ArchiveAgentForm,
  ArchiveAgentImages,
  ArchiveMaterialImages,
  ArchiveOwnerForm,
  ArchiveOwnerImages,
  ArchiveVehicleForm,
  ArchiveVehicleImages
} from './types'
import { hasVal, nonZero } from './archive-utils'

interface StepValidationContext {
  isPersonal: boolean
  hasAgent: boolean
  ownerForm: ArchiveOwnerForm
  ownerImages: ArchiveOwnerImages
  vehicleForm: ArchiveVehicleForm
  vehicleImages: ArchiveVehicleImages
  agentForm: ArchiveAgentForm
  agentImages: ArchiveAgentImages
  materialImages: ArchiveMaterialImages
  ownerAuthed: boolean
  agentAuthed: boolean
}

/** 判断指定步骤是否已完成（对齐 admin isStepComplete）。 */
export function isStepComplete(stepNo: number, ctx: StepValidationContext) {
  if (stepNo === 1) return isOwnerStepComplete(ctx)
  if (stepNo === 2) return isVehicleStepComplete(ctx)
  if (stepNo === 3) return isAgentStepComplete(ctx)
  if (stepNo === 4) return isAuthStepComplete(ctx)
  if (stepNo === 5) return isMaterialsStepComplete(ctx)
  return false
}

/** 步骤 1：所有人信息。 */
export function isOwnerStepComplete(
  ctx: Pick<StepValidationContext, 'isPersonal' | 'ownerForm' | 'ownerImages'>
) {
  const { isPersonal, ownerForm, ownerImages } = ctx
  if (!hasVal(ownerForm.sfzmmc) || !hasVal(ownerForm.syr) || !hasVal(ownerForm.sfzmhm)) return false
  if (!hasVal(ownerForm.dh) || !hasVal(ownerForm.dz)) return false
  if (isPersonal) {
    return hasVal(ownerImages.sfz1zp || ownerImages.syrzp) && hasVal(ownerImages.sfz2zp)
  }
  return hasVal(ownerImages.syrzp)
}

/** 步骤 2：车辆信息。 */
export function isVehicleStepComplete(
  ctx: Pick<StepValidationContext, 'vehicleForm' | 'vehicleImages'>
) {
  const { vehicleForm, vehicleImages } = ctx
  if (
    !hasVal(vehicleImages.xszzp) ||
    !hasVal(vehicleImages.xszzpfy) ||
    !hasVal(vehicleImages.xszbmzp) ||
    !hasVal(vehicleImages.czzp)
  )
    return false
  if (!hasVal(vehicleForm.clsbdh) || !hasVal(vehicleForm.hphm) || !hasVal(vehicleForm.hpzl))
    return false
  if (!hasVal(vehicleForm.cllx) || !hasVal(vehicleForm.syxz) || !hasVal(vehicleForm.xszbh))
    return false
  if (!hasVal(vehicleForm.czbh) || !hasVal(vehicleForm.ppxh)) return false
  if (!hasVal(vehicleForm.ccdjrq) || !hasVal(vehicleForm.rlzl) || !hasVal(vehicleForm.fdjh))
    return false
  if (!hasVal(vehicleForm.csys)) return false
  if (!nonZero(vehicleForm.cwkc) || !nonZero(vehicleForm.cwkk) || !nonZero(vehicleForm.cwkg))
    return false
  if (!nonZero(vehicleForm.pl) || !nonZero(vehicleForm.gl)) return false
  if (!nonZero(vehicleForm.zbzl) || !nonZero(vehicleForm.zzl) || !nonZero(vehicleForm.hdzk))
    return false
  if (!hasVal(vehicleForm.delivery_method) || !hasVal(vehicleForm.settlement_type)) return false
  if (!hasVal(vehicleForm.settlement_method)) return false
  if (vehicleForm.delivery_method === 'tow') {
    if (
      !hasVal(vehicleForm.tow_pickup_address) ||
      !hasVal(vehicleForm.tow_pickup_contact) ||
      !hasVal(vehicleForm.tow_pickup_phone)
    )
      return false
  } else if (vehicleForm.delivery_method === 'self') {
    if (
      !hasVal(vehicleForm.self_delivery_address) ||
      !hasVal(vehicleForm.self_delivery_name) ||
      !hasVal(vehicleForm.self_delivery_phone)
    )
      return false
  }
  if (
    !hasVal(vehicleForm.bank_name) ||
    !hasVal(vehicleForm.bank_branch) ||
    !hasVal(vehicleForm.bank_card_no)
  )
    return false
  return true
}

/** 步骤 3：代理人信息。 */
export function isAgentStepComplete(
  ctx: Pick<StepValidationContext, 'hasAgent' | 'agentForm' | 'agentImages'>
) {
  const { hasAgent, agentForm, agentImages } = ctx
  if (!hasAgent) return true
  return (
    hasVal(agentImages.jbrsfz1zp) &&
    hasVal(agentImages.jbrsfz2zp) &&
    hasVal(agentImages.jbrzp) &&
    hasVal(agentForm.jbr) &&
    hasVal(agentForm.jbrsfzmhm) &&
    hasVal(agentForm.jbrdh)
  )
}

/** 步骤 4：实名认证。 */
export function isAuthStepComplete(
  ctx: Pick<StepValidationContext, 'hasAgent' | 'ownerAuthed' | 'agentAuthed'>
) {
  const { hasAgent, ownerAuthed, agentAuthed } = ctx
  if (!ownerAuthed) return false
  if (hasAgent && !agentAuthed) return false
  return true
}

/** 步骤 5：影像材料。 */
export function isMaterialsStepComplete(ctx: StepValidationContext) {
  const { isPersonal, hasAgent, ownerImages, vehicleImages, agentImages, materialImages } = ctx
  if (!hasVal(materialImages.photo_front) || !hasVal(materialImages.photo_side)) return false
  if (isPersonal) {
    if (!hasVal(ownerImages.sfz1zp || ownerImages.syrzp) || !hasVal(ownerImages.sfz2zp))
      return false
  } else if (!hasVal(ownerImages.syrzp)) {
    return false
  }
  if (
    !hasVal(vehicleImages.xszzp) ||
    !hasVal(vehicleImages.xszzpfy) ||
    !hasVal(vehicleImages.xszbmzp) ||
    !hasVal(vehicleImages.czzp)
  )
    return false
  if (hasAgent) {
    if (
      !hasVal(agentImages.jbrsfz1zp) ||
      !hasVal(agentImages.jbrsfz2zp) ||
      !hasVal(agentImages.jbrzp)
    )
      return false
  }
  return true
}
