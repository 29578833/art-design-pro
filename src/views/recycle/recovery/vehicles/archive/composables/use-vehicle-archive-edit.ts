import {
  fetchAcceptArchive,
  fetchAcceptInitForm,
  fetchAcceptOriginFields,
  fetchAcceptSubmit,
  fetchAcceptSubmitResult,
  fetchAcceptSyncFiles
} from '@/api/recycle/accept'
import type {
  AcceptHplx,
  AcceptSubmitResult,
  AcceptSyq
} from '@/types/recycle/recovery/commerce/accept'
import { fetchVehicleAssociateOrder, fetchVehicleDetail } from '@/api/recycle/vehicle'
import {
  isLeadOrder,
  isOrderVehicleLimitReached,
  type RecycleOrder
} from '@/types/recycle/recovery/orders/order'
import type { ScrapVehicle } from '@/types/recycle/recovery/vehicles/vehicle'
import { ElMessage } from 'element-plus'
import type AgentStep from '../components/AgentStep.vue'
import type MaterialsStep from '../components/MaterialsStep.vue'
import type OwnerStep from '../components/OwnerStep.vue'
import type VehicleStep from '../components/VehicleStep.vue'
import { HPLX_OPTIONS, SYQ_OPTIONS } from './constants'
import { str } from './utils'
import { useArchiveFormState } from './use-archive-form-state'
import { useArchiveLoader } from './use-archive-loader'

interface StepRefs {
  owner: Ref<InstanceType<typeof OwnerStep> | null>
  vehicle: Ref<InstanceType<typeof VehicleStep> | null>
  agent: Ref<InstanceType<typeof AgentStep> | null>
  materials: Ref<InstanceType<typeof MaterialsStep> | null>
}

interface UseVehicleArchiveEditOptions {
  vehicleId: Ref<number>
  mode?: Ref<'create' | 'edit'>
  vehicleRow?: Ref<ScrapVehicle | null | undefined>
  stepRefs: StepRefs
  /** 车信盟 Token 检测：无效时返回 false（登录框由调用方弹出），提交/抓取前调用 */
  checkCxmToken?: () => Promise<boolean>
  onSuccess?: () => void
  onCreated?: (id: number) => void
}

/** 车辆档案编辑弹窗主流程：编排表单状态、加载器与步骤/提交动作（步骤内逻辑在各 step 组件）。 */
export function useVehicleArchiveEdit(options: UseVehicleArchiveEditOptions) {
  const { vehicleId, vehicleRow, stepRefs, checkCxmToken, onSuccess, onCreated } = options
  const mode = options.mode ?? ref<'create' | 'edit'>('edit')

  // ----- 流程控制状态 -----
  const createdVehicleId = ref(0)
  const selectedOrder = ref<RecycleOrder | null>(null)
  const pendingOrderId = ref(0)
  const linkedOrderId = ref(0)
  const activeVehicleId = computed(() =>
    mode.value === 'create' ? createdVehicleId.value : vehicleId.value
  )

  const phase = ref<'order' | 'scene' | 'form'>('scene')
  const initLoading = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const submitting = ref(false)
  const draftSaved = ref(false)
  const isSubmitted = ref(false)
  const existingOwnerSyncId = ref(0)
  const cjid = ref('')
  const step = ref(1)
  const pendingTargetStep = ref(0)
  const acceptTime = ref('')
  const submitResult = ref<AcceptSubmitResult | null>(null)
  const submitResultVisible = ref(false)

  // ----- 表单状态 + 后端加载器 -----
  const form = useArchiveFormState()
  const { loadVehicleData, loadAcceptDataByVehicleId } = useArchiveLoader({
    form,
    activeVehicleId,
    vehicleRow,
    linkedOrderId,
    pendingOrderId,
    existingOwnerSyncId,
    isSubmitted,
    cjid
  })

  async function loadOptions() {
    await stepRefs.vehicle.value?.loadOptions()
  }

  function applySelectedOrder(order: RecycleOrder | null) {
    selectedOrder.value = order
    pendingOrderId.value = order?.id ? Number(order.id) : 0
    if (order?.id) linkedOrderId.value = Number(order.id)
    form.linkInfo.order_no = order?.order_no ? str(order.order_no) : ''
    form.linkInfo.tow_order_no = order?.tow_no ? str(order.tow_no) : ''
    if (order) {
      const leadNo = str(order.lead_no)
      form.linkInfo.lead_no = leadNo || (isLeadOrder(order) ? str(order.order_no) : '')
    } else {
      form.linkInfo.lead_no = ''
    }
  }

  function resetState() {
    createdVehicleId.value = 0
    selectedOrder.value = null
    pendingOrderId.value = 0
    linkedOrderId.value = 0
    phase.value = 'scene'
    cjid.value = ''
    step.value = 1
    pendingTargetStep.value = 0
    draftSaved.value = false
    isSubmitted.value = false
    existingOwnerSyncId.value = 0
    submitResult.value = null
    submitResultVisible.value = false
    form.resetForms()
    stepRefs.owner.value?.clearOcrState()
    stepRefs.vehicle.value?.clearOcrState()
    stepRefs.agent.value?.clearOcrState()
    stepRefs.materials.value?.clearScrapFiles()
  }

  async function openEditor() {
    if (mode.value === 'create') {
      createdVehicleId.value = 0
      selectedOrder.value = null
      pendingOrderId.value = 0
      linkedOrderId.value = 0
      phase.value = 'order'
      return
    }
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
          const sync = await fetchAcceptSyncFiles({ vehicle_id: activeVehicleId.value })
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
        const origin = await fetchAcceptOriginFields({ vehicle_id: activeVehicleId.value })
        if (String(origin.zcbj) === '0') form.hplx.value = 3
        else if (String(origin.sywd) === '1') form.hplx.value = 2
        else if (String(origin.sywd) === '0') form.hplx.value = 1
        else if (echo?.hplx) form.hplx.value = echo.hplx as AcceptHplx
        if (origin.syq) form.syq.value = Number(origin.syq) as AcceptSyq
        else if (echo?.syq) form.syq.value = echo.syq as AcceptSyq
      } catch {
        if (echo?.hplx) form.hplx.value = echo.hplx as AcceptHplx
        if (echo?.syq) form.syq.value = echo.syq as AcceptSyq
      }

      const submitted =
        Number(vehicleRow?.value?.is_submitted_commerce) === 1 || echo?.is_submitted_commerce === 1
      if (submitted) {
        isSubmitted.value = true
        phase.value = 'form'
        await nextTick()
        await loadOptions()
        await loadAcceptDataByVehicleId()
        await stepRefs.materials.value?.loadScrapFiles()
        const hadPending = pendingTargetStep.value >= 1 && pendingTargetStep.value <= 5
        await applyPendingStep()
        // 已提交档案打开编辑时默认落到车辆信息步，方便改收款银行卡
        if (!hadPending) step.value = 2
        return
      }

      phase.value = 'scene'
      await applyPendingStep()
    } finally {
      loading.value = false
    }
  }

  function confirmOrderSkip() {
    applySelectedOrder(null)
    phase.value = 'scene'
  }

  function confirmOrderNext() {
    if (!selectedOrder.value?.id) {
      ElMessage.warning('请选择关联订单')
      return
    }
    if (isOrderVehicleLimitReached(selectedOrder.value)) {
      ElMessage.warning('该订单关联车辆数已达上限，请选择其他订单')
      return
    }
    applySelectedOrder(selectedOrder.value)
    phase.value = 'scene'
  }

  function backToOrderPicker() {
    phase.value = 'order'
  }

  async function confirmScene() {
    initLoading.value = true
    try {
      if (mode.value === 'edit' && !vehicleId.value) {
        ElMessage.warning('缺少车辆 ID')
        return
      }

      const initPayload: { hplx: AcceptHplx; syq: AcceptSyq; vehicle_id?: number } = {
        hplx: form.hplx.value,
        syq: form.syq.value
      }
      if (mode.value === 'edit') {
        initPayload.vehicle_id = vehicleId.value
      }

      const res = await fetchAcceptInitForm(initPayload)

      if (mode.value === 'create') {
        createdVehicleId.value = Number(res.vehicle_id)
        if (!createdVehicleId.value) {
          ElMessage.error('初始化车辆档案失败')
          return
        }
        existingOwnerSyncId.value = Number(res.owner_sync_id || 0)
        onCreated?.(createdVehicleId.value)

        if (pendingOrderId.value) {
          await fetchVehicleAssociateOrder({
            vehicle_id: createdVehicleId.value,
            order_id: pendingOrderId.value
          })
        }

        try {
          const detail = await fetchVehicleDetail(createdVehicleId.value)
          form.linkInfo.archive_no = str(detail.vehicle_no || detail.archive_no)
        } catch {
          // 档案号回显失败不阻断
        }
      }

      cjid.value = str(res.cjid)
      acceptTime.value = new Date().toLocaleString('zh-CN').replace(/\//g, '-').slice(0, 16)
      form.ownerForm.syq = String(form.syq.value)
      form.ownerForm.sfzmmc = form.isPersonal.value ? 'A' : 'N'
      form.ownerForm.zcbj = form.hplx.value === 3 ? '0' : '1'
      form.ownerForm.sfyd = form.hplx.value === 1 ? '0' : '1'
      phase.value = 'form'
      step.value = 1
      await nextTick()
      await loadOptions()
      if (existingOwnerSyncId.value) {
        await loadAcceptDataByVehicleId()
      }
      await applyPendingStep()
      onSuccess?.()
    } finally {
      initLoading.value = false
    }
  }

  async function saveCurrentStep() {
    if (!activeVehicleId.value) return
    if (isSubmitted.value) {
      // 已提交商务部后仅允许保存车辆步骤中的收款银行卡
      await stepRefs.vehicle.value?.save()
      return
    }
    if (step.value === 1) await stepRefs.owner.value?.save()
    else if (step.value === 2) await stepRefs.vehicle.value?.save()
    else if (step.value === 3) await stepRefs.agent.value?.save()
  }

  async function handleSaveBankInfo() {
    if (!activeVehicleId.value) return
    saving.value = true
    try {
      await stepRefs.vehicle.value?.save()
      ElMessage.success('收款信息已保存')
      onSuccess?.()
    } finally {
      saving.value = false
    }
  }

  async function handleSaveDraft() {
    if (isSubmitted.value) {
      await handleSaveBankInfo()
      return
    }
    saving.value = true
    try {
      await saveCurrentStep()
      draftSaved.value = true
    } finally {
      saving.value = false
    }
  }

  async function applyPendingStep() {
    const target = pendingTargetStep.value
    if (target < 1 || target > 5 || phase.value !== 'form') return
    pendingTargetStep.value = 0
    step.value = target
    if (step.value === 5) await stepRefs.materials.value?.loadScrapFiles()
  }

  async function goToStep(target: number) {
    if (target < 1 || target > 5) return
    if (phase.value !== 'form') {
      pendingTargetStep.value = target
      return
    }
    step.value = target
    if (step.value === 5) await stepRefs.materials.value?.loadScrapFiles()
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
    // 车信盟 Token 无效时弹出登录框，中止本次抓取
    if (checkCxmToken && !(await checkCxmToken())) return
    try {
      await fetchAcceptArchive(activeVehicleId.value)
    } catch {
      // http 层提示
    }
  }

  async function viewSubmitResult() {
    try {
      submitResult.value = await fetchAcceptSubmitResult(activeVehicleId.value)
      submitResultVisible.value = true
    } catch {
      // http 层提示
    }
  }

  async function handleSubmit() {
    if (!activeVehicleId.value) {
      ElMessage.warning('受理记录未初始化')
      return
    }
    // 车信盟 Token 无效时弹出登录框，中止本次提交
    if (checkCxmToken && !(await checkCxmToken())) return
    submitting.value = true
    try {
      const res = await fetchAcceptSubmit(activeVehicleId.value)
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
    mode,
    activeVehicleId,
    phase,
    initLoading,
    loading,
    saving,
    submitting,
    draftSaved,
    isSubmitted,
    cjid,
    step,
    acceptTime,
    submitResult,
    submitResultVisible,
    linkedOrderId,
    hplxOptions: HPLX_OPTIONS,
    syqOptions: SYQ_OPTIONS,
    // 表单状态（透传，保持弹窗使用的扁平接口）
    ...form,
    openEditor,
    confirmOrderSkip,
    confirmOrderNext,
    backToOrderPicker,
    selectedOrder,
    confirmScene,
    handleSaveDraft,
    handleSaveBankInfo,
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
