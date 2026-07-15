import {
  fetchAcceptArchive,
  fetchAcceptInitForm,
  fetchAcceptOriginFields,
  fetchAcceptSubmit,
  fetchAcceptSubmitResult,
  fetchAcceptSyncFiles
} from '@/api/recycle/accept'
import type { AcceptHplx, AcceptSubmitResult, AcceptSyq } from '@/types/recycle/accept'
import { fetchVehicleDetail } from '@/api/recycle/vehicle'
import type { ScrapVehicle } from '@/types/recycle/vehicle'
import { ElMessage } from 'element-plus'
import type AgentStep from './agent-step.vue'
import type MaterialsStep from './materials-step.vue'
import type OwnerStep from './owner-step.vue'
import type VehicleStep from './vehicle-step.vue'
import { ARCHIVE_STEPS, HPLX_OPTIONS, SYQ_OPTIONS } from './archive-constants'
import { formatDate, imgUrl, str } from './archive-utils'
import { isStepComplete } from './archive-validation'
import type {
  ArchiveAgentForm,
  ArchiveAgentImages,
  ArchiveLinkInfo,
  ArchiveMaterialImages,
  ArchiveOwnerForm,
  ArchiveOwnerImages,
  ArchiveVehicleForm,
  ArchiveVehicleImages
} from './types'

interface StepRefs {
  owner: Ref<InstanceType<typeof OwnerStep> | null>
  vehicle: Ref<InstanceType<typeof VehicleStep> | null>
  agent: Ref<InstanceType<typeof AgentStep> | null>
  materials: Ref<InstanceType<typeof MaterialsStep> | null>
}

interface UseVehicleArchiveEditOptions {
  vehicleId: Ref<number>
  vehicleRow?: Ref<ScrapVehicle | null | undefined>
  stepRefs: StepRefs
  onSuccess?: () => void
}

/** 车辆档案编辑弹窗主流程（步骤逻辑在各 step 组件内）。 */
export function useVehicleArchiveEdit(options: UseVehicleArchiveEditOptions) {
  const { vehicleId, vehicleRow, stepRefs, onSuccess } = options

  const phase = ref<'scene' | 'form'>('scene')
  const initLoading = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const submitting = ref(false)
  const draftSaved = ref(false)
  const isSubmitted = ref(false)
  const existingOwnerSyncId = ref(0)

  const hplx = ref<AcceptHplx>(1)
  const syq = ref<AcceptSyq>(2)
  const cjid = ref('')
  const step = ref(1)
  const acceptTime = ref('')
  const submitResult = ref<AcceptSubmitResult | null>(null)
  const submitResultVisible = ref(false)
  const hasAgent = ref(true)
  const cllxPath = ref('')

  const hplxLabel = computed(
    () => HPLX_OPTIONS.find((i) => i.value === hplx.value)?.label || '沪牌机动车'
  )
  const syqLabel = computed(
    () => SYQ_OPTIONS.find((i) => i.value === syq.value)?.label || '个人车辆'
  )
  const isCompany = computed(() => syq.value === 1)
  const isPersonal = computed(() => syq.value === 2)

  const linkInfo = reactive<ArchiveLinkInfo>({
    order_no: '',
    archive_no: '',
    tow_order_no: '',
    lead_no: ''
  })

  const ownerForm = reactive<ArchiveOwnerForm>({
    syr: '',
    sfzmhm: '',
    dh: '',
    dz: '',
    sfzmmc: '',
    hpzl: '',
    syrsmrz: '',
    sfyd: '',
    zcbj: '',
    syq: ''
  })
  const ownerImages = reactive<ArchiveOwnerImages>({
    syrzp: '',
    sfz1zp: '',
    sfz2zp: '',
    qksmzp: '',
    blpzzp: ''
  })

  const vehicleForm = reactive<ArchiveVehicleForm>({
    clsbdh: '',
    hphm: '',
    hpzl: '',
    cllx: '',
    syxz: '',
    ccdjrq: '',
    rlzl: '',
    fdjh: '',
    fdjxh: '',
    xszbh: '',
    czbh: '',
    clpp1: '',
    clxh: '',
    ppxh: '',
    cwkc: '',
    cwkk: '',
    cwkg: '',
    gl: '',
    pl: '',
    hdzk: '',
    zbzl: '',
    zzl: '',
    csys: '',
    delivery_method: 'self',
    tow_pickup_address: '',
    tow_pickup_contact: '',
    tow_pickup_phone: '',
    self_delivery_address: '',
    self_delivery_name: '',
    self_delivery_phone: '',
    settlement_type: 'personal',
    settlement_method: '',
    settlement_amount: '',
    bank_name: '',
    bank_branch: '',
    bank_card_no: '',
    remark: ''
  })
  const vehicleImages = reactive<ArchiveVehicleImages>({
    xszzp: '',
    xszzpfy: '',
    xszbmzp: '',
    czzp: ''
  })
  const materialImages = reactive<ArchiveMaterialImages>({
    photo_front: '',
    photo_side: '',
    photo_back: '',
    photo_interior: ''
  })

  const agentForm = reactive<ArchiveAgentForm>({
    jbr: '',
    jbrsfzmhm: '',
    jbrdh: '',
    jbrsmrz: ''
  })
  const agentImages = reactive<ArchiveAgentImages>({
    jbrsfz1zp: '',
    jbrsfz2zp: '',
    jbrzp: ''
  })

  const authCompleted = computed(() => {
    if (ownerForm.syrsmrz !== '1') return false
    if (hasAgent.value && agentForm.jbrsmrz !== '1') return false
    return true
  })

  const validationCtx = computed(() => ({
    isPersonal: isPersonal.value,
    hasAgent: hasAgent.value,
    ownerForm,
    ownerImages,
    vehicleForm,
    vehicleImages,
    agentForm,
    agentImages,
    materialImages,
    ownerAuthed: ownerForm.syrsmrz === '1',
    agentAuthed: agentForm.jbrsmrz === '1'
  }))

  const stepComplete = computed(() =>
    [1, 2, 3, 4, 5].map((n) => isStepComplete(n, validationCtx.value))
  )

  async function loadOptions() {
    await stepRefs.vehicle.value?.loadOptions()
  }

  function resetState() {
    phase.value = 'scene'
    hplx.value = 1
    syq.value = 2
    cjid.value = ''
    step.value = 1
    draftSaved.value = false
    isSubmitted.value = false
    existingOwnerSyncId.value = 0
    submitResult.value = null
    submitResultVisible.value = false
    Object.assign(ownerForm, {
      syr: '',
      sfzmhm: '',
      dh: '',
      dz: '',
      sfzmmc: 'A',
      hpzl: '',
      syrsmrz: '',
      sfyd: '',
      zcbj: '',
      syq: '2'
    })
    ;(Object.keys(ownerImages) as (keyof ArchiveOwnerImages)[]).forEach(
      (key) => (ownerImages[key] = '')
    )
    Object.assign(vehicleForm, {
      clsbdh: '',
      hphm: '',
      hpzl: '',
      cllx: '',
      syxz: '',
      ccdjrq: '',
      rlzl: '',
      fdjh: '',
      fdjxh: '',
      xszbh: '',
      czbh: '',
      clpp1: '',
      clxh: '',
      ppxh: '',
      cwkc: '',
      cwkk: '',
      cwkg: '',
      gl: '',
      pl: '',
      hdzk: '',
      zbzl: '',
      zzl: '',
      csys: '',
      delivery_method: 'self',
      tow_pickup_address: '',
      tow_pickup_contact: '',
      tow_pickup_phone: '',
      self_delivery_address: '',
      self_delivery_name: '',
      self_delivery_phone: '',
      settlement_type: 'personal',
      settlement_method: '',
      settlement_amount: '',
      bank_name: '',
      bank_branch: '',
      bank_card_no: '',
      remark: ''
    })
    ;(Object.keys(vehicleImages) as (keyof ArchiveVehicleImages)[]).forEach(
      (key) => (vehicleImages[key] = '')
    )
    Object.assign(agentForm, { jbr: '', jbrsfzmhm: '', jbrdh: '', jbrsmrz: '' })
    ;(Object.keys(agentImages) as (keyof ArchiveAgentImages)[]).forEach(
      (key) => (agentImages[key] = '')
    )
    hasAgent.value = true
    cllxPath.value = ''
    stepRefs.owner.value?.clearOcrState()
    stepRefs.vehicle.value?.clearOcrState()
    stepRefs.agent.value?.clearOcrState()
    Object.assign(linkInfo, { order_no: '', archive_no: '', tow_order_no: '', lead_no: '' })
    ;(Object.keys(materialImages) as (keyof ArchiveMaterialImages)[]).forEach(
      (key) => (materialImages[key] = '')
    )
    stepRefs.materials.value?.clearScrapFiles()
  }

  async function loadVehicleData() {
    if (!vehicleId.value) return
    const detail = await fetchVehicleDetail(vehicleId.value)
    linkInfo.order_no = str(detail.order_no)
    linkInfo.archive_no = str(detail.vehicle_no || detail.archive_no)
    linkInfo.tow_order_no = str((detail as Record<string, unknown>).tow_order_no)
    linkInfo.lead_no = str((detail as Record<string, unknown>).lead_no)
    existingOwnerSyncId.value = Number(detail.owner_sync_id || 0)

    if (detail.syq) syq.value = Number(detail.syq) as AcceptSyq
    ownerForm.syr = str(detail.owner_name)
    ownerForm.dh = str(detail.owner_phone)
    ownerForm.sfzmhm = str(detail.owner_id_card)
    ownerForm.dz = str(detail.owner_address)
    ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
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
    vehicleForm.tow_pickup_contact = str(detail.tow_pickup_contact)
    vehicleForm.tow_pickup_phone = str(detail.tow_pickup_phone)
    vehicleForm.self_delivery_address = str(detail.self_delivery_address)
    vehicleForm.self_delivery_name = str(detail.self_delivery_name)
    vehicleForm.self_delivery_phone = str(detail.self_delivery_phone)
    vehicleForm.settlement_type = str(detail.settlement_type) || 'personal'
    vehicleForm.settlement_method = str(detail.settlement_method)
    vehicleForm.settlement_amount = str(detail.settlement_amount)
    vehicleForm.bank_name = str(detail.bank_name)
    vehicleForm.bank_branch = str(detail.bank_branch)
    vehicleForm.bank_card_no = str(detail.bank_card_no)
    vehicleForm.remark = str(detail.remark)
    if (detail.has_agent === 0) hasAgent.value = false
    agentForm.jbr = str(detail.agent_name)
    agentForm.jbrdh = str(detail.agent_phone)
    materialImages.photo_front = str((detail as Record<string, unknown>).photo_front)
    materialImages.photo_side = str((detail as Record<string, unknown>).photo_side)
    materialImages.photo_back = str((detail as Record<string, unknown>).photo_back)
    materialImages.photo_interior = str((detail as Record<string, unknown>).photo_interior)
  }

  function processAcceptData(sync: Awaited<ReturnType<typeof fetchAcceptSyncFiles>>) {
    if (!sync) return
    cjid.value = str(sync.cjid || sync.id)
    if (sync.is_submitted_commerce) isSubmitted.value = true

    const o = sync.owner || {}
    const v = sync.vehicle || {}
    const a = sync.agent || {}
    const ownerImgs = sync.owner_images || {}
    const vehicleImgs = sync.vehicle_images || {}
    const agentImgs = sync.agent_images || {}

    if (o.syq) syq.value = Number(o.syq) as AcceptSyq
    if (o.hplx) hplx.value = Number(o.hplx) as AcceptHplx
    ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
    if (o.syr) ownerForm.syr = str(o.syr)
    if (o.sfzmhm) ownerForm.sfzmhm = str(o.sfzmhm)
    if (o.dh) ownerForm.dh = str(o.dh)
    if (o.dz) ownerForm.dz = str(o.dz)
    if (o.sfzmmc) ownerForm.sfzmmc = isPersonal.value ? 'A' : str(o.sfzmmc)
    if (o.hpzl) ownerForm.hpzl = str(o.hpzl)
    if (o.syrsmrz !== undefined && o.syrsmrz !== null) ownerForm.syrsmrz = str(o.syrsmrz)

    const syrImg = imgUrl(ownerImgs.syrzp)
    if (syrImg) {
      if (isPersonal.value) ownerImages.sfz1zp = syrImg
      else ownerImages.syrzp = syrImg
    }
    const sfz1 = imgUrl(ownerImgs.sfz1zp)
    if (sfz1 && isPersonal.value) ownerImages.sfz1zp = sfz1
    const sfz2 = imgUrl(ownerImgs.sfz2zp)
    if (sfz2) ownerImages.sfz2zp = sfz2
    const qksm = imgUrl(ownerImgs.qksmzp)
    if (qksm) ownerImages.qksmzp = qksm

    Object.keys(vehicleForm).forEach((k) => {
      if (v[k] !== undefined && v[k] !== null && v[k] !== '') {
        ;(vehicleForm as Record<string, unknown>)[k] = k === 'ccdjrq' ? formatDate(v[k]) : str(v[k])
      }
    })
    if (v.cllx) {
      vehicleForm.cllx = str(v.cllx)
      cllxPath.value = str(v.cllx)
    }
    if (v.hpzl) {
      vehicleForm.hpzl = str(v.hpzl)
      ownerForm.hpzl = str(v.hpzl)
    }
    const xszzp = imgUrl(vehicleImgs.xszzp)
    if (xszzp) vehicleImages.xszzp = xszzp
    const xszzpfy = imgUrl(vehicleImgs.xszzpfy) || imgUrl(vehicleImgs.tcjczp)
    if (xszzpfy) vehicleImages.xszzpfy = xszzpfy
    const xszbmzp = imgUrl(vehicleImgs.xszbmzp)
    if (xszbmzp) vehicleImages.xszbmzp = xszbmzp
    const czzp = imgUrl(vehicleImgs.czzp)
    if (czzp) vehicleImages.czzp = czzp
    const blpzzp = imgUrl(vehicleImgs.blpzzp) || imgUrl(vehicleImgs.tcjczp)
    if (blpzzp) ownerImages.blpzzp = blpzzp

    if (a.jbr || a.jbrdh || a.jbrsfzmhm || Number(a.has_agent) === 1) hasAgent.value = true
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

    ownerForm.syq = String(syq.value)
    ownerForm.zcbj = hplx.value === 3 ? '0' : '1'
    ownerForm.sfyd = hplx.value === 1 ? '0' : '1'
  }

  async function loadAcceptDataByVehicleId() {
    if (!vehicleId.value) return
    const sync = await fetchAcceptSyncFiles({ vehicle_id: vehicleId.value })
    processAcceptData(sync)
  }

  async function openEditor() {
    if (!vehicleId.value) return
    if (vehicleRow?.value?.owner_sync_id) {
      existingOwnerSyncId.value = Number(vehicleRow.value.owner_sync_id)
    }
    if (Number(vehicleRow?.value?.is_submitted_commerce) === 1) {
      isSubmitted.value = true
    }
    loading.value = true
    try {
      await loadVehicleData()

      let echo: { hplx?: number; syq?: number; is_submitted_commerce?: number } | null = null
      if (existingOwnerSyncId.value) {
        try {
          const sync = await fetchAcceptSyncFiles({ vehicle_id: vehicleId.value })
          const owner = sync.owner || {}
          echo = {
            hplx: owner.hplx ? Number(owner.hplx) : undefined,
            syq: owner.syq ? Number(owner.syq) : undefined,
            is_submitted_commerce: Number(sync.is_submitted_commerce || 0)
          }
        } catch {
          echo = null
        }
      }

      try {
        const origin = await fetchAcceptOriginFields({ vehicle_id: vehicleId.value })
        if (String(origin.zcbj) === '0') hplx.value = 3
        else if (String(origin.sywd) === '1') hplx.value = 2
        else if (String(origin.sywd) === '0') hplx.value = 1
        else if (echo?.hplx) hplx.value = echo.hplx as AcceptHplx
        if (origin.syq) syq.value = Number(origin.syq) as AcceptSyq
        else if (echo?.syq) syq.value = echo.syq as AcceptSyq
      } catch {
        if (echo?.hplx) hplx.value = echo.hplx as AcceptHplx
        if (echo?.syq) syq.value = echo.syq as AcceptSyq
      }

      if (echo?.is_submitted_commerce === 1) {
        isSubmitted.value = true
        phase.value = 'form'
        await nextTick()
        await loadOptions()
        await loadAcceptDataByVehicleId()
        await stepRefs.materials.value?.loadScrapFiles()
        return
      }

      phase.value = 'scene'
    } finally {
      loading.value = false
    }
  }

  async function confirmScene() {
    if (!vehicleId.value) {
      ElMessage.warning('缺少车辆 ID')
      return
    }
    initLoading.value = true
    try {
      const res = await fetchAcceptInitForm({
        hplx: hplx.value,
        syq: syq.value,
        vehicle_id: vehicleId.value
      })
      cjid.value = str(res.cjid)
      acceptTime.value = new Date().toLocaleString('zh-CN').replace(/\//g, '-').slice(0, 16)
      ownerForm.syq = String(syq.value)
      ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
      ownerForm.zcbj = hplx.value === 3 ? '0' : '1'
      ownerForm.sfyd = hplx.value === 1 ? '0' : '1'
      phase.value = 'form'
      step.value = 1
      await nextTick()
      await loadOptions()
      if (existingOwnerSyncId.value) {
        await loadAcceptDataByVehicleId()
      }
      syq.value = Number(syq.value) as AcceptSyq
      ownerForm.syq = String(syq.value)
      ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
      onSuccess?.()
    } finally {
      initLoading.value = false
    }
  }

  async function saveCurrentStep() {
    if (!vehicleId.value || isSubmitted.value) return
    if (step.value === 1) await stepRefs.owner.value?.save()
    else if (step.value === 2) await stepRefs.vehicle.value?.save()
    else if (step.value === 3) await stepRefs.agent.value?.save()
  }

  async function handleSaveDraft() {
    if (isSubmitted.value) {
      ElMessage.warning('已提交至商务部，不可修改')
      return
    }
    saving.value = true
    try {
      await saveCurrentStep()
      draftSaved.value = true
      ElMessage.success('暂存成功')
    } finally {
      saving.value = false
    }
  }

  async function goToStep(target: number) {
    if (target < 1 || target > 5) return
    step.value = target
    if (target === 5) await stepRefs.materials.value?.loadScrapFiles()
  }

  async function goNext() {
    if (isSubmitted.value) {
      if (step.value < 5) step.value += 1
      return
    }
    saving.value = true
    try {
      await saveCurrentStep()
      draftSaved.value = true
      if (step.value < 5) {
        step.value += 1
        if (step.value === 5) await stepRefs.materials.value?.loadScrapFiles()
      }
    } finally {
      saving.value = false
    }
  }

  function goPrev() {
    if (step.value > 1) step.value -= 1
  }

  async function handleFetchArchive() {
    try {
      await fetchAcceptArchive(vehicleId.value)
    } catch {
      // http 层提示
    }
  }

  async function viewSubmitResult() {
    try {
      submitResult.value = await fetchAcceptSubmitResult(vehicleId.value)
      submitResultVisible.value = true
    } catch {
      // http 层提示
    }
  }

  async function handleSubmit() {
    if (!authCompleted.value) {
      ElMessage.warning('请先完成实名认证')
      return
    }
    if (!vehicleId.value) {
      ElMessage.warning('受理记录未初始化')
      return
    }
    submitting.value = true
    try {
      const res = await fetchAcceptSubmit(vehicleId.value)
      submitResult.value = res
      isSubmitted.value = true
      submitResultVisible.value = true
      onSuccess?.()
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetState()
  }

  return {
    phase,
    initLoading,
    loading,
    saving,
    submitting,
    draftSaved,
    isSubmitted,
    hplx,
    syq,
    cjid,
    step,
    acceptTime,
    submitResult,
    submitResultVisible,
    hasAgent,
    cllxPath,
    hplxLabel,
    syqLabel,
    isCompany,
    isPersonal,
    linkInfo,
    ownerForm,
    ownerImages,
    vehicleForm,
    vehicleImages,
    materialImages,
    agentForm,
    agentImages,
    authCompleted,
    stepComplete,
    hplxOptions: HPLX_OPTIONS,
    syqOptions: SYQ_OPTIONS,
    visibleSteps: ARCHIVE_STEPS,
    openEditor,
    confirmScene,
    handleSaveDraft,
    goToStep,
    goNext,
    goPrev,
    handleFetchArchive,
    viewSubmitResult,
    handleSubmit,
    handleClosed,
    loadAcceptDataByVehicleId
  }
}
