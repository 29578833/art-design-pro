import { fetchAcceptSyncFiles } from '@/api/recycle/accept'
import { fetchVehicleDetail } from '@/api/recycle/vehicle'
import type { AcceptHplx, AcceptSyq } from '@/types/recycle/recovery/commerce/accept'
import type { ScrapVehicle } from '@/types/recycle/recovery/vehicles/vehicle'
import { formatDate, imgUrl, parseImageArray, str } from './utils'
import type { ArchiveFormState } from './use-archive-form-state'

interface UseArchiveLoaderOptions {
  form: ArchiveFormState
  /** 当前生效的车辆 ID（create 模式为新创建 ID）。 */
  activeVehicleId: Ref<number>
  /** 列表行数据（编辑模式下有 order_id / owner_sync_id 等补充字段）。 */
  vehicleRow?: Ref<ScrapVehicle | null | undefined>
  linkedOrderId: Ref<number>
  pendingOrderId: Ref<number>
  existingOwnerSyncId: Ref<number>
  isSubmitted: Ref<boolean>
  cjid: Ref<string>
}

/** 把后端查询结果写入表单状态的加载器。 */
export function useArchiveLoader(options: UseArchiveLoaderOptions) {
  const {
    form,
    activeVehicleId,
    vehicleRow,
    linkedOrderId,
    pendingOrderId,
    existingOwnerSyncId,
    isSubmitted,
    cjid
  } = options

  /** 载入 vehicle/detail 基础信息（编辑模式打开时）。 */
  async function loadVehicleData() {
    if (!activeVehicleId.value) return
    const detail = await fetchVehicleDetail(activeVehicleId.value)
    linkedOrderId.value = Number(
      detail.order_id || vehicleRow?.value?.order_id || pendingOrderId.value || 0
    )
    form.linkInfo.order_no = str(detail.order_no)
    form.linkInfo.archive_no = str(detail.vehicle_no || detail.archive_no)
    form.linkInfo.tow_order_no = str((detail as Record<string, unknown>).tow_order_no)
    form.linkInfo.lead_no = str((detail as Record<string, unknown>).lead_no)
    existingOwnerSyncId.value = Number(detail.owner_sync_id || 0)

    if (detail.syq) form.syq.value = Number(detail.syq) as AcceptSyq
    const { ownerForm, vehicleForm, agentForm } = form
    ownerForm.syr = str(detail.owner_name)
    ownerForm.dh = str(detail.owner_phone)
    ownerForm.sfzmhm = str(detail.owner_id_card)
    ownerForm.dz = str(detail.owner_address)
    ownerForm.sfzmmc = form.isPersonal.value ? 'A' : 'N'
    vehicleForm.clsbdh = str(detail.vin)
    vehicleForm.hphm = str(detail.plate_no)
    vehicleForm.clpp1 = str(detail.brand)
    vehicleForm.clxh = str(detail.model)
    vehicleForm.ppxh = str(detail.brand_model || `${detail.brand || ''}${detail.model || ''}`)
    vehicleForm.csys = str(detail.color)
    vehicleForm.fdjh = str(detail.engine_no)
    vehicleForm.ccdjrq = str(detail.reg_date)
    vehicleForm.delivery_method = str(detail.delivery_method) || 'self'
    vehicleForm.tow_pickup_address = str(detail.tow_pickup_address)
    vehicleForm.tow_pickup_latlng = str(detail.tow_pickup_latlng)
    vehicleForm.tow_pickup_contact = str(detail.tow_pickup_contact)
    vehicleForm.tow_pickup_phone = str(detail.tow_pickup_phone)
    vehicleForm.self_delivery_address = str(detail.self_delivery_address)
    vehicleForm.self_delivery_latlng = str(detail.self_delivery_latlng)
    vehicleForm.self_delivery_name = str(detail.self_delivery_name)
    vehicleForm.self_delivery_phone = str(detail.self_delivery_phone)
    vehicleForm.settlement_type = str(detail.settlement_type) || 'personal'
    vehicleForm.settlement_method = str(detail.settlement_method)
    vehicleForm.settlement_amount = str(detail.settlement_amount)
    vehicleForm.bank_name = str(detail.bank_name)
    vehicleForm.bank_branch = str(detail.bank_branch)
    vehicleForm.bank_card_no = str(detail.bank_card_no)
    vehicleForm.remark = str(detail.remark)
    if (detail.has_agent === 0) form.hasAgent.value = false
    agentForm.jbr = str(detail.agent_name)
    agentForm.jbrdh = str(detail.agent_phone)
    form.dismantlePhotos.value = (detail.dismantle_photos || {}) as Record<string, string>
  }

  /** 用受理系统（车信盟）sync 数据覆盖表单。 */
  function processAcceptData(sync: Awaited<ReturnType<typeof fetchAcceptSyncFiles>>) {
    if (!sync) return
    cjid.value = str(sync.cjid || sync.id)
    if (sync.is_submitted_commerce) isSubmitted.value = true

    const {
      ownerForm,
      ownerImages,
      vehicleForm,
      vehicleImages,
      agentForm,
      agentImages,
      qksmMaterials
    } = form
    const o = sync.owner || {}
    const v = sync.vehicle || {}
    const a = sync.agent || {}
    const ownerImgs = sync.owner_images || {}
    const vehicleImgs = sync.vehicle_images || {}
    const agentImgs = sync.agent_images || {}

    if (o.syq) form.syq.value = Number(o.syq) as AcceptSyq
    if (o.hplx) form.hplx.value = Number(o.hplx) as AcceptHplx
    ownerForm.sfzmmc = form.isPersonal.value ? 'A' : 'N'
    if (o.syr) ownerForm.syr = str(o.syr)
    if (o.sfzmhm) ownerForm.sfzmhm = str(o.sfzmhm)
    if (o.dh) ownerForm.dh = str(o.dh)
    if (o.dz) ownerForm.dz = str(o.dz)
    if (o.sfzmmc) ownerForm.sfzmmc = form.isPersonal.value ? 'A' : str(o.sfzmmc)
    if (o.hpzl) ownerForm.hpzl = str(o.hpzl)
    if (o.syrsmrz !== undefined && o.syrsmrz !== null) ownerForm.syrsmrz = str(o.syrsmrz)

    const syrImg = imgUrl(ownerImgs.syrzp)
    if (syrImg) {
      if (form.isPersonal.value) ownerImages.sfz1zp = syrImg
      else ownerImages.syrzp = syrImg
    }
    const sfz1 = imgUrl(ownerImgs.sfz1zp)
    if (sfz1 && form.isPersonal.value) ownerImages.sfz1zp = sfz1
    const sfz2 = imgUrl(ownerImgs.sfz2zp)
    if (sfz2) ownerImages.sfz2zp = sfz2
    const qksm = imgUrl(ownerImgs.qksmzp)
    if (qksm) ownerImages.qksmzp = qksm

    Object.keys(vehicleForm).forEach((k) => {
      // 收款银行卡来自关联订单，不要被受理 sync 覆盖
      if (k === 'bank_name' || k === 'bank_branch' || k === 'bank_card_no') return
      if (v[k] !== undefined && v[k] !== null && v[k] !== '') {
        ;(vehicleForm as Record<string, unknown>)[k] = k === 'ccdjrq' ? formatDate(v[k]) : str(v[k])
      }
    })
    if (v.cllx) {
      vehicleForm.cllx = str(v.cllx)
      form.cllxPath.value = str(v.cllx)
    }
    if (v.hpzl) {
      vehicleForm.hpzl = str(v.hpzl)
      ownerForm.hpzl = str(v.hpzl)
    }
    const xszzp = imgUrl(vehicleImgs.xszzp)
    if (xszzp) vehicleImages.xszzp = xszzp
    const xszzpfy = imgUrl(vehicleImgs.xszzpfy)
    if (xszzpfy) vehicleImages.xszzpfy = xszzpfy
    const xszbmzp = imgUrl(vehicleImgs.xszbmzp)
    if (xszbmzp) vehicleImages.xszbmzp = xszbmzp
    const czzp = imgUrl(vehicleImgs.czzp)
    if (czzp) vehicleImages.czzp = czzp
    qksmMaterials.cqksmzp = imgUrl(vehicleImgs.cqksmzp)
    qksmMaterials.sfzmzp = parseImageArray(vehicleImgs.sfzmzp)
    qksmMaterials.cqzmzp = parseImageArray(vehicleImgs.cqzmzp)
    qksmMaterials.wtdbzp = parseImageArray(vehicleImgs.wtdbzp)
    // 产权变更页：读取 vehicle sync.tcjczp（JSON 数组字符串，支持多图），兼容旧数据 owner_sync.blpzzp
    const ownerChangeUrls = parseImageArray(vehicleImgs.tcjczp)
    form.ownerChangeImages.value = ownerChangeUrls.length
      ? ownerChangeUrls
      : parseImageArray(ownerImgs.blpzzp)

    if (a.jbr || a.jbrdh || a.jbrsfzmhm || Number(a.has_agent) === 1) form.hasAgent.value = true
    if (a.jbr) agentForm.jbr = str(a.jbr)
    if (a.jbrsfzmhm) agentForm.jbrsfzmhm = str(a.jbrsfzmhm)
    if (a.jbrdh) agentForm.jbrdh = str(a.jbrdh)
    if (a.jbrsmrz !== undefined && a.jbrsmrz !== null) agentForm.jbrsmrz = str(a.jbrsmrz)
    const jbr1 = imgUrl(agentImgs.jbrsfz1zp)
    if (jbr1) agentImages.jbrsfz1zp = jbr1
    const jbr2 = imgUrl(agentImgs.jbrsfz2zp)
    if (jbr2) agentImages.jbrsfz2zp = jbr2
    const jbrzp = imgUrl(agentImgs.jbrzp)
    if (jbrzp) agentImages.jbrzp = jbrzp

    ownerForm.syq = String(form.syq.value)
    ownerForm.zcbj = form.hplx.value === 3 ? '0' : '1'
    ownerForm.sfyd = form.hplx.value === 1 ? '0' : '1'
  }

  /** 拉取并按车辆 ID 覆盖受理 sync 数据。 */
  async function loadAcceptDataByVehicleId() {
    if (!activeVehicleId.value) return
    const sync = await fetchAcceptSyncFiles({ vehicle_id: activeVehicleId.value })
    processAcceptData(sync)
  }

  return { loadVehicleData, processAcceptData, loadAcceptDataByVehicleId }
}
