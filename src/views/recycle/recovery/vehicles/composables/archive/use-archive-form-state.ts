import type { AcceptHplx, AcceptSyq } from '@/types/recycle/recovery/commerce/accept'
import { ARCHIVE_STEPS, HPLX_OPTIONS, SYQ_OPTIONS } from './constants'
import { isStepComplete } from './validation'
import type {
  ArchiveAgentForm,
  ArchiveAgentImages,
  ArchiveLinkInfo,
  ArchiveOwnerForm,
  ArchiveOwnerImages,
  ArchiveQksmMaterials,
  ArchiveVehicleForm,
  ArchiveVehicleImages
} from './types'

/** 档案表单默认值（重置时复用，避免两处维护）。 */
const DEFAULT_OWNER_FORM: ArchiveOwnerForm = {
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
}

const DEFAULT_VEHICLE_FORM: ArchiveVehicleForm = {
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
  tow_pickup_latlng: '',
  tow_pickup_contact: '',
  tow_pickup_phone: '',
  self_delivery_address: '',
  self_delivery_latlng: '',
  self_delivery_name: '',
  self_delivery_phone: '',
  settlement_type: 'personal',
  settlement_method: '',
  settlement_amount: '',
  bank_name: '',
  bank_branch: '',
  bank_card_no: '',
  remark: ''
}

const DEFAULT_AGENT_FORM: ArchiveAgentForm = {
  jbr: '',
  jbrsfzmhm: '',
  jbrdh: '',
  jbrsmrz: ''
}

/** 清空字符串字段对象（原地保留响应式引用）。 */
function clearStringFields<T extends Record<string, string | string[]>>(target: T) {
  ;(Object.keys(target) as (keyof T)[]).forEach((key) => {
    if (Array.isArray(target[key])) (target[key] as string[]) = []
    else (target[key] as string) = ''
  })
}

/**
 * 档案编辑表单状态：所有表单/图片/关联单号的响应式容器、派生标签与步骤完成态、重置逻辑。
 * 仅承载数据，不发请求——加载与提交流程见 use-archive-loader / use-vehicle-archive-edit。
 */
export function useArchiveFormState() {
  const hplx = ref<AcceptHplx>(1)
  const syq = ref<AcceptSyq>(2)
  const hasAgent = ref(true)
  const cllxPath = ref('')

  const linkInfo = reactive<ArchiveLinkInfo>({
    order_no: '',
    archive_no: '',
    tow_order_no: '',
    lead_no: ''
  })

  const ownerForm = reactive<ArchiveOwnerForm>({ ...DEFAULT_OWNER_FORM })
  const ownerImages = reactive<ArchiveOwnerImages>({
    syrzp: '',
    sfz1zp: '',
    sfz2zp: '',
    qksmzp: ''
  })
  /** 产权变更页（vehicle sync.tcjczp，JSON 数组字符串，支持多图）。 */
  const ownerChangeImages = ref<string[]>([])

  const vehicleForm = reactive<ArchiveVehicleForm>({ ...DEFAULT_VEHICLE_FORM })
  const vehicleImages = reactive<ArchiveVehicleImages>({
    xszzp: '',
    xszzpfy: '',
    xszbmzp: '',
    czzp: ''
  })
  const qksmMaterials = reactive<ArchiveQksmMaterials>({
    cqksmzp: '',
    sfzmzp: [],
    cqzmzp: [],
    wtdbzp: []
  })

  const agentForm = reactive<ArchiveAgentForm>({ ...DEFAULT_AGENT_FORM })
  const agentImages = reactive<ArchiveAgentImages>({
    jbrsfz1zp: '',
    jbrsfz2zp: '',
    jbrzp: ''
  })
  const dismantlePhotos = ref<Record<string, string>>({})

  const hplxLabel = computed(
    () => HPLX_OPTIONS.find((i) => i.value === hplx.value)?.label || '沪牌机动车'
  )
  const syqLabel = computed(
    () => SYQ_OPTIONS.find((i) => i.value === syq.value)?.label || '个人车辆'
  )
  const isCompany = computed(() => syq.value === 1)
  const isPersonal = computed(() => syq.value === 2)

  const validationCtx = computed(() => ({
    hplx: hplx.value,
    isPersonal: isPersonal.value,
    hasAgent: hasAgent.value,
    ownerForm,
    ownerImages,
    vehicleForm,
    vehicleImages,
    qksmMaterials,
    agentForm,
    agentImages,
    ownerAuthed: ownerForm.syrsmrz === '1',
    agentAuthed: agentForm.jbrsmrz === '1'
  }))

  const visibleSteps = computed(() => ARCHIVE_STEPS)
  const stepComplete = computed(() =>
    [1, 2, 3, 4, 5].map((n) => isStepComplete(n, validationCtx.value))
  )

  /** 重置所有表单字段为默认值（弹窗关闭/重新打开时调用）。 */
  function resetForms() {
    Object.assign(ownerForm, DEFAULT_OWNER_FORM)
    clearStringFields(ownerImages)
    ownerChangeImages.value = []
    Object.assign(vehicleForm, DEFAULT_VEHICLE_FORM)
    clearStringFields(vehicleImages)
    qksmMaterials.cqksmzp = ''
    qksmMaterials.sfzmzp = []
    qksmMaterials.cqzmzp = []
    qksmMaterials.wtdbzp = []
    Object.assign(agentForm, DEFAULT_AGENT_FORM)
    clearStringFields(agentImages)
    Object.assign(linkInfo, { order_no: '', archive_no: '', tow_order_no: '', lead_no: '' })
    dismantlePhotos.value = {}
    hasAgent.value = true
    cllxPath.value = ''
  }

  return {
    hplx,
    syq,
    hasAgent,
    cllxPath,
    linkInfo,
    ownerForm,
    ownerImages,
    ownerChangeImages,
    vehicleForm,
    vehicleImages,
    qksmMaterials,
    agentForm,
    agentImages,
    dismantlePhotos,
    hplxLabel,
    syqLabel,
    isCompany,
    isPersonal,
    visibleSteps,
    stepComplete,
    resetForms
  }
}

export type ArchiveFormState = ReturnType<typeof useArchiveFormState>
