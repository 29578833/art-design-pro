<template>
  <ElDialog
    v-model="dialogVisible"
    width="860px"
    align-center
    destroy-on-close
    :show-close="false"
    class="qc-workbench-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="qc-header">
        <div class="qc-header-left">
          <div class="qc-header-icon">
            <ArtSvgIcon icon="ri:checkbox-circle-line" />
          </div>
          <div>
            <div class="qc-header-title">质检工单</div>
            <div class="qc-header-sub">
              {{ queueItem?.plate_no || '—' }} · {{ queueItem?.brand_model || '—' }} ·
              {{ queueItem?.inspection_no || '—' }}
            </div>
          </div>
        </div>
        <button type="button" class="qc-close-btn" @click="handleClose">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- 自定义步骤条 -->
    <div class="qc-step-bar">
      <div v-for="(label, i) in QC_STEP_LABELS" :key="label" class="qc-step-item">
        <div class="qc-step-node-wrap">
          <div
            class="qc-step-node"
            :class="{
              'is-done': i < currentStep,
              'is-active': i === currentStep
            }"
          >
            <ArtSvgIcon v-if="i < currentStep" icon="ri:check-line" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span
            class="qc-step-label"
            :class="{
              'is-done': i < currentStep,
              'is-active': i === currentStep
            }"
            >{{ label }}</span
          >
        </div>
        <div
          v-if="i < QC_STEP_LABELS.length - 1"
          class="qc-step-line"
          :class="{ 'is-done': i < currentStep }"
        />
      </div>
    </div>

    <div class="qc-body">
      <!-- Step1 入场信息 -->
      <div v-show="currentStep === 0" class="qc-step-panel">
        <div class="qc-section">
          <div class="qc-section-title">车辆信息</div>
          <div class="qc-readonly-grid">
            <div v-for="field in vehicleReadonlyFields" :key="field.label" class="qc-readonly-item">
              <span class="qc-readonly-label">{{ field.label }}</span>
              <span class="qc-readonly-value">{{ field.value }}</span>
            </div>
          </div>

          <div class="qc-form-grid">
            <div class="qc-form-field">
              <label class="qc-field-label">有无车牌（多选）</label>
              <div class="qc-toggle-row">
                <button
                  v-for="opt in PLATE_STATUS_OPTIONS"
                  :key="opt"
                  type="button"
                  class="qc-toggle-btn"
                  :class="{ 'is-active is-warn': step1Form.plate_status_arr.includes(opt) }"
                  @click="togglePlateStatus(opt)"
                  >{{ opt }}</button
                >
              </div>
            </div>

            <div class="qc-form-field">
              <label class="qc-field-label">是否注销<span class="required">*</span></label>
              <div class="qc-toggle-row">
                <button
                  v-for="opt in CANCELLED_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="qc-toggle-btn"
                  :class="{ 'is-active': step1Form.is_cancelled === opt.value }"
                  @click="step1Form.is_cancelled = opt.value"
                  >{{ opt.label }}</button
                >
              </div>
            </div>

            <div class="qc-form-field">
              <label class="qc-field-label">轮毂材质<span class="required">*</span></label>
              <div class="qc-toggle-row">
                <button
                  v-for="opt in WHEEL_MATERIAL_OPTIONS"
                  :key="opt"
                  type="button"
                  class="qc-toggle-btn"
                  :class="{ 'is-active': step1Form.wheel_material === opt }"
                  @click="step1Form.wheel_material = opt"
                  >{{ opt }}</button
                >
              </div>
            </div>

            <div class="qc-form-field">
              <label class="qc-field-label">车辆类型<span class="required">*</span></label>
              <ElSelect
                v-model="step1Form.factory_type"
                placeholder="请选择车辆类型"
                filterable
                clearable
                :loading="loadingCllx"
                class="qc-full-width"
              >
                <ElOption
                  v-for="opt in cllxOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </ElSelect>
            </div>
          </div>
        </div>

        <div class="qc-section">
          <div class="qc-section-title">称重计量</div>
          <div class="qc-weight-grid">
            <div class="qc-form-field">
              <label class="qc-field-label">毛重（kg）<span class="required">*</span></label>
              <ElInputNumber
                v-model="step1Form.weight"
                :min="0"
                :precision="2"
                placeholder="毛重"
                class="qc-full-width"
                controls-position="right"
              />
            </div>
            <div class="qc-form-field">
              <label class="qc-field-label">皮重（kg）</label>
              <ElInputNumber
                v-model="step1Form.tare_weight"
                :min="0"
                :precision="2"
                placeholder="皮重"
                class="qc-full-width"
                controls-position="right"
              />
            </div>
            <div class="qc-form-field">
              <label class="qc-field-label">扣杂（kg）</label>
              <ElInputNumber
                v-model="step1Form.deduction_weight"
                :min="0"
                :precision="2"
                placeholder="0"
                class="qc-full-width"
                controls-position="right"
              />
            </div>
            <div class="qc-form-field">
              <label class="qc-field-label">净重（kg）</label>
              <div class="qc-net-weight">{{ netWeightDisplay }}</div>
            </div>
          </div>
          <div class="qc-form-field qc-inspector-field">
            <label class="qc-field-label">负责质检员<span class="required">*</span></label>
            <ElSelect
              v-model="inspectorName"
              placeholder="请选择"
              filterable
              clearable
              :loading="loadingInspectors"
              class="qc-full-width"
            >
              <ElOption
                v-for="item in inspectorOptions"
                :key="item.id"
                :label="item.nickname || item.account"
                :value="item.nickname || item.account"
              />
            </ElSelect>
          </div>
        </div>

        <div class="qc-section">
          <div class="qc-section-title">入场照片（8张）</div>
          <input
            ref="photoInputRef"
            type="file"
            accept="image/*"
            class="qc-photo-input"
            @change="handlePhotoFileChange"
          />
          <div class="qc-photo-grid">
            <div
              v-for="photo in QC_ENTRY_PHOTO_CONFIG"
              :key="photo.field"
              class="qc-photo-slot"
              :class="{
                'has-photo': !!entryPhotos[photo.field],
                'is-uploading': uploadingPhotoField === photo.field
              }"
              @click="handleEmptyPhotoSlotClick(photo.field)"
            >
              <template v-if="entryPhotos[photo.field]">
                <button
                  type="button"
                  class="qc-photo-delete"
                  title="删除照片"
                  @click.stop="handleDeletePhoto(photo.field)"
                >
                  <ArtSvgIcon icon="ri:close-line" />
                </button>
                <ElImage
                  :src="entryPhotos[photo.field]"
                  :preview-src-list="[entryPhotos[photo.field]]"
                  fit="cover"
                  class="qc-photo-preview-image"
                  preview-teleported
                />
              </template>
              <ArtSvgIcon v-else icon="ri:camera-line" class="qc-photo-icon" />
              <span class="qc-photo-label">{{ photo.label }}</span>
            </div>
          </div>
        </div>

        <div class="qc-section">
          <div class="qc-section-title">监销设置</div>
          <div class="qc-toggle-row qc-monitor-row">
            <button
              v-for="opt in SUPERVISION_OPTIONS"
              :key="opt.value"
              type="button"
              class="qc-toggle-btn qc-monitor-btn"
              :class="{ 'is-active': step1Form.is_supervision === opt.value }"
              @click="step1Form.is_supervision = opt.value"
              >{{ opt.label }}</button
            >
          </div>
        </div>
      </div>

      <!-- Step2 质检查验 -->
      <div v-show="currentStep === 1" class="qc-step-panel">
        <div class="qc-legend">
          <span class="qc-legend-tag good">有（完好）</span>
          <span class="qc-legend-tag miss">缺（缺失）</span>
          <span class="qc-legend-hint">点击选择每个部件状态，缺失项自动计入扣款</span>
        </div>

        <div v-loading="loadingItems" class="qc-categories">
          <div v-for="cat in inspectionCategories" :key="cat.id" class="qc-category-card">
            <div class="qc-category-head" :style="{ background: getCategoryBg(cat.category_name) }">
              <div class="qc-category-icon-wrap">
                <ArtSvgIcon
                  :icon="getCategoryIcon(cat.category_name)"
                  :style="{ color: getCategoryColor(cat.category_name) }"
                />
              </div>
              <span
                class="qc-category-name"
                :style="{ color: getCategoryColor(cat.category_name) }"
              >
                {{ cat.category_name }}
              </span>
              <span class="qc-category-count">共{{ cat.items?.length || 0 }}项</span>
              <span v-if="getCatMissing(cat) > 0" class="qc-category-badge miss">
                缺失{{ getCatMissing(cat) }}
              </span>
              <span v-if="getCatDamaged(cat) > 0" class="qc-category-badge damage">
                损坏{{ getCatDamaged(cat) }}
              </span>
            </div>
            <div class="qc-category-body">
              <div v-for="item in cat.items" :key="item.id" class="qc-item-row">
                <span class="qc-item-name">{{ item.item_name }}</span>
                <button type="button" class="qc-item-camera" title="上传照片">
                  <ArtSvgIcon icon="ri:camera-line" />
                </button>
                <div class="qc-item-btns">
                  <button
                    type="button"
                    class="qc-result-btn present"
                    :class="{ active: getItemPresent(item, cat.category_name) }"
                    @click="setItemPresent(item, cat.category_name)"
                    >有</button
                  >
                  <button
                    type="button"
                    class="qc-result-btn missing"
                    :class="{ active: getItemMissing(item, cat.category_name) }"
                    @click="setItemMissing(item, cat.category_name)"
                    >缺</button
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="qc-deduct-bar">
          <div class="qc-deduct-stats">
            <div class="qc-deduct-stat">
              <span class="qc-deduct-label">缺失件</span>
              <span class="qc-deduct-value miss">{{ missingCount }}项</span>
            </div>
            <div class="qc-deduct-stat">
              <span class="qc-deduct-label">损坏件</span>
              <span class="qc-deduct-value damage">{{ damagedCount }}项</span>
            </div>
            <div class="qc-deduct-stat">
              <span class="qc-deduct-label">缺件扣款合计</span>
              <span class="qc-deduct-value total">¥{{ totalDeduction.toFixed(2) }}</span>
            </div>
          </div>
          <label class="qc-no-deduct">
            <ElCheckbox v-model="noDeductMissing" />
            <span>缺件免扣款</span>
          </label>
        </div>
      </div>

      <!-- Step3 质检报告 -->
      <div v-show="currentStep === 2" class="qc-step-panel">
        <div class="qc-summary-grid">
          <div class="qc-summary-card" style="background: #e6f7ff">
            <div class="qc-summary-label">车辆净重</div>
            <div class="qc-summary-value" style="color: #1677ff">{{ netWeightDisplay }}</div>
          </div>
          <div class="qc-summary-card" style="background: #fff1f0">
            <div class="qc-summary-label">缺失件数</div>
            <div class="qc-summary-value" style="color: #ff4d4f">{{ missingCount }}项</div>
          </div>
          <div class="qc-summary-card" style="background: #fff7e6">
            <div class="qc-summary-label">损坏件数</div>
            <div class="qc-summary-value" style="color: #fa8c16">{{ damagedCount }}项</div>
          </div>
          <div class="qc-summary-card" style="background: #fff1f0">
            <div class="qc-summary-label">缺件扣款</div>
            <div class="qc-summary-value" style="color: #ff4d4f"
              >¥{{ totalDeduction.toFixed(2) }}</div
            >
          </div>
        </div>

        <div v-if="abnormalItems.length > 0" class="qc-abnormal-card">
          <div class="qc-abnormal-title">质检异常清单</div>
          <div v-for="ab in abnormalItems" :key="ab.key" class="qc-abnormal-row">
            <div class="qc-abnormal-left">
              <ArtSvgIcon
                :icon="ab.status === 2 ? 'ri:close-circle-line' : 'ri:error-warning-line'"
                :class="ab.status === 2 ? 'text-red' : 'text-orange'"
              />
              <span :class="ab.status === 2 ? 'text-red' : 'text-orange'">{{ ab.name }}</span>
              <span class="qc-abnormal-type">（{{ ab.status === 2 ? '缺失' : '损坏' }}）</span>
            </div>
            <span v-if="ab.status === 2" class="qc-abnormal-amount">-¥{{ ab.amount }}</span>
          </div>
        </div>

        <div class="qc-conclusion-section">
          <label class="qc-field-label">质检结论<span class="required">*</span></label>
          <div class="qc-conclusion-btns">
            <button
              v-for="opt in QC_CONCLUSION_OPTIONS"
              :key="opt.value"
              type="button"
              class="qc-conclusion-btn"
              :style="getConclusionBtnStyle(opt)"
              @click="conclusionType = opt.value"
              >{{ opt.label }}</button
            >
          </div>
          <ElInput
            v-model="inspectorRemark"
            type="textarea"
            :rows="3"
            placeholder="质检员备注说明（损坏情况说明、特殊处理建议等）"
            class="qc-remark-input"
          />
        </div>

        <div class="qc-sign-bar">
          <div>
            <span class="qc-sign-muted">质检员：</span>
            <span class="qc-sign-value">{{
              inspectorName || queueItem?.inspector_name || '—'
            }}</span>
          </div>
          <div>
            <span class="qc-sign-muted">质检时间：</span>
            <span class="qc-sign-value">{{ checkTimeText }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="qc-footer">
        <span class="qc-footer-step">步骤 {{ currentStep + 1 }} / {{ QC_STEP_LABELS.length }}</span>
        <div class="qc-footer-actions">
          <ElButton @click="handleClose">取消</ElButton>
          <ElButton v-if="currentStep > 0" @click="prevStep">上一步</ElButton>
          <ElButton
            v-if="currentStep < 2"
            type="primary"
            :disabled="!canNext"
            :loading="submitting"
            @click="nextStep"
          >
            下一步
            <ArtSvgIcon icon="ri:arrow-right-s-line" class="qc-next-icon" />
          </ElButton>
          <ElButton
            v-if="currentStep === 2"
            type="success"
            :disabled="!conclusionType"
            :loading="submitting"
            @click="handleSubmit"
          >
            <ArtSvgIcon icon="ri:file-text-line" class="qc-next-icon" />
            生成质检报告
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { uploadFileGetUrl } from '@/api/upload'
  import { fetchCllxCascade } from '@/api/recycle/data-dict'
  import { fetchUserRoleList } from '@/api/recycle/role'
  import {
    createQuality,
    updateQuality,
    fetchInspectionItems,
    fetchQualityByOrder
  } from '@/api/recycle/quality'
  import { ElMessage } from 'element-plus'
  import { flattenCllxCascade, type CllxFlatOption } from '@/types/recycle/data-dict'
  import { QC_INSPECTOR_ROLE_ID, type ScrapUserRoleItem } from '@/types/recycle/role'
  import type {
    QualityQueueItem,
    QualityDetail,
    QualityCheckItem,
    InspectionCategory,
    InspectionItem,
    ItemStatus,
    ConclusionType,
    QualityUpdateItemParams,
    QualityCreateParams,
    QcEntryPhotoField
  } from '@/types/recycle/quality'
  import {
    QC_STEP_LABELS,
    PLATE_STATUS_OPTIONS,
    CANCELLED_OPTIONS,
    WHEEL_MATERIAL_OPTIONS,
    SUPERVISION_OPTIONS,
    QC_CATEGORY_COLORS,
    QC_CATEGORY_BG,
    QC_CATEGORY_ICONS,
    QC_ENTRY_PHOTO_CONFIG,
    createEmptyEntryPhotos,
    QC_CONCLUSION_OPTIONS
  } from '@/types/recycle/quality'

  interface Props {
    visible: boolean
    queueItem: QualityQueueItem | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const cllxOptions = ref<CllxFlatOption[]>([])
  const loadingCllx = ref(false)
  const inspectorOptions = ref<ScrapUserRoleItem[]>([])
  const loadingInspectors = ref(false)
  const photoInputRef = ref<HTMLInputElement>()
  const pendingPhotoField = ref<QcEntryPhotoField | ''>('')
  const uploadingPhotoField = ref<QcEntryPhotoField | ''>('')
  const entryPhotos = reactive(createEmptyEntryPhotos())

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const currentStep = ref(0)
  const submitting = ref(false)
  const checkId = ref(0)
  const inspectorName = ref('')

  const step1Form = reactive({
    plate_status_arr: [] as string[],
    is_cancelled: 0,
    wheel_material: '铁轮毂',
    factory_type: '',
    is_supervision: 0,
    weight: undefined as number | undefined,
    tare_weight: undefined as number | undefined,
    deduction_weight: undefined as number | undefined
  })

  const netWeight = computed(() => {
    const w =
      Number(step1Form.weight || 0) -
      Number(step1Form.tare_weight || 0) -
      Number(step1Form.deduction_weight || 0)
    return Math.max(0, Number(w.toFixed(2)))
  })

  const netWeightDisplay = computed(() => (step1Form.weight ? `${netWeight.value} kg` : '—'))

  const vehicleReadonlyFields = computed(() => [
    { label: '车牌号', value: props.queueItem?.plate_no || '—' },
    { label: 'VIN码', value: props.queueItem?.vin || '—' },
    { label: '品牌车型', value: props.queueItem?.brand_model || '—' },
    { label: '车辆类型', value: props.queueItem?.vehicle_type_text || '—' },
    { label: '车主姓名', value: props.queueItem?.owner_name || '—' },
    { label: '档案号', value: props.queueItem?.inspection_no || '—' }
  ])

  const loadingItems = ref(false)
  const inspectionCategories = ref<InspectionCategory[]>([])
  const noDeductMissing = ref(false)
  const itemResults = reactive<Record<string, ItemStatus | null>>({})

  const checkTimeText = computed(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  function makeItemKey(id: number, name: string, cat: string) {
    return `${id}_${name}_${cat}`
  }

  function getItemStatus(id: number, name: string, cat: string): ItemStatus | null {
    return itemResults[makeItemKey(id, name, cat)] ?? null
  }

  function getItemPresent(item: InspectionItem, cat: string) {
    const s = getItemStatus(item.id, item.item_name, cat)
    return s === 1 || s === null
  }

  function getItemMissing(item: InspectionItem, cat: string) {
    return getItemStatus(item.id, item.item_name, cat) === 2
  }

  function setItemPresent(item: InspectionItem, cat: string) {
    const key = makeItemKey(item.id, item.item_name, cat)
    itemResults[key] = itemResults[key] === 1 ? null : 1
  }

  function setItemMissing(item: InspectionItem, cat: string) {
    const key = makeItemKey(item.id, item.item_name, cat)
    itemResults[key] = itemResults[key] === 2 ? null : 2
  }

  function togglePlateStatus(opt: string) {
    const idx = step1Form.plate_status_arr.indexOf(opt)
    if (idx >= 0) step1Form.plate_status_arr.splice(idx, 1)
    else step1Form.plate_status_arr.push(opt)
  }

  function getCategoryColor(name: string) {
    return QC_CATEGORY_COLORS[name] || '#1677ff'
  }

  function getCategoryBg(name: string) {
    return QC_CATEGORY_BG[name] || '#E6F7FF'
  }

  function getCategoryIcon(name: string) {
    return QC_CATEGORY_ICONS[name] || 'ri:tools-line'
  }

  function getCatMissing(cat: InspectionCategory) {
    return (cat.items || []).filter(
      (it) => getItemStatus(it.id, it.item_name, cat.category_name) === 2
    ).length
  }

  function getCatDamaged(cat: InspectionCategory) {
    return (cat.items || []).filter(
      (it) => getItemStatus(it.id, it.item_name, cat.category_name) === 3
    ).length
  }

  const missingCount = computed(() => Object.values(itemResults).filter((v) => v === 2).length)

  const damagedCount = computed(() => Object.values(itemResults).filter((v) => v === 3).length)

  const totalDeduction = computed(() => {
    if (noDeductMissing.value) return 0
    let total = 0
    for (const cat of inspectionCategories.value) {
      for (const item of cat.items || []) {
        const status = getItemStatus(item.id, item.item_name, cat.category_name)
        if (status === 2 || status === 3) {
          total += Number(item.deduction_amount || 0)
        }
      }
    }
    return total
  })

  const abnormalItems = computed(() => {
    const list: { key: string; name: string; status: ItemStatus; amount: number }[] = []
    for (const cat of inspectionCategories.value) {
      for (const item of cat.items || []) {
        const status = getItemStatus(item.id, item.item_name, cat.category_name)
        if (status === 2 || status === 3) {
          list.push({
            key: makeItemKey(item.id, item.item_name, cat.category_name),
            name: item.item_name,
            status,
            amount: Number(item.deduction_amount || 0)
          })
        }
      }
    }
    return list
  })

  const conclusionType = ref<ConclusionType>(0)
  const inspectorRemark = ref('')

  const canNext = computed(() => {
    if (currentStep.value === 0) {
      return Number(step1Form.weight) > 0 && !!step1Form.factory_type && !!inspectorName.value
    }
    return true
  })

  function getConclusionBtnStyle(opt: (typeof QC_CONCLUSION_OPTIONS)[number]) {
    const active = conclusionType.value === opt.value
    return {
      borderColor: active ? opt.color : '#d9d9d9',
      color: active ? opt.color : '#595959',
      background: active ? `${opt.color}10` : undefined
    }
  }

  function handleEmptyPhotoSlotClick(field: QcEntryPhotoField) {
    if (entryPhotos[field] || uploadingPhotoField.value) return
    triggerPhotoUpload(field)
  }

  function handleDeletePhoto(field: QcEntryPhotoField) {
    entryPhotos[field] = ''
  }

  function triggerPhotoUpload(field: QcEntryPhotoField) {
    if (uploadingPhotoField.value) return
    pendingPhotoField.value = field
    photoInputRef.value?.click()
  }

  async function handlePhotoFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    const field = pendingPhotoField.value
    pendingPhotoField.value = ''
    if (!file || !field) return

    uploadingPhotoField.value = field
    try {
      entryPhotos[field] = await uploadFileGetUrl(file, { showSuccessMessage: true })
    } catch {
      // 错误已由 http 拦截器处理
    } finally {
      uploadingPhotoField.value = ''
    }
  }

  async function loadItems() {
    loadingItems.value = true
    try {
      inspectionCategories.value = (await fetchInspectionItems()) || []
    } catch {
      ElMessage.error('加载质检项目失败')
    } finally {
      loadingItems.value = false
    }
  }

  function buildStep1Payload(): Omit<QualityCreateParams, 'order_id' | 'vehicle_id'> {
    return {
      weight: step1Form.weight || 0,
      tare_weight: step1Form.tare_weight || 0,
      deduction_weight: step1Form.deduction_weight || 0,
      plate_status: step1Form.plate_status_arr.join(','),
      is_cancelled: step1Form.is_cancelled,
      wheel_material: step1Form.wheel_material,
      factory_type: step1Form.factory_type,
      is_supervision: step1Form.is_supervision,
      inspector_name: inspectorName.value || undefined,
      ...entryPhotos
    }
  }

  /** 提交全部质检项目（含完好项，后端会先清空再写入） */
  function buildAllItems(): QualityUpdateItemParams[] {
    const items: QualityUpdateItemParams[] = []
    for (const cat of inspectionCategories.value) {
      for (const item of cat.items || []) {
        const status = getItemStatus(item.id, item.item_name, cat.category_name) || 1
        items.push({
          item_name: item.item_name,
          item_category: cat.category_name,
          status,
          deduction_amount: item.deduction_amount ?? 0,
          damage_coefficient: 1
        })
      }
    }
    return items
  }

  function populateStep1FromCheck(check: QualityDetail) {
    checkId.value = check.id
    inspectorName.value = check.inspector_name || ''
    step1Form.weight = check.weight !== undefined ? Number(check.weight) : undefined
    step1Form.tare_weight = check.tare_weight !== undefined ? Number(check.tare_weight) : undefined
    step1Form.deduction_weight =
      check.deduction_weight !== undefined ? Number(check.deduction_weight) : undefined
    step1Form.plate_status_arr = check.plate_status
      ? check.plate_status.split(',').filter(Boolean)
      : []
    step1Form.is_cancelled = check.is_cancelled ?? 0
    step1Form.wheel_material = check.wheel_material || '铁轮毂'
    step1Form.factory_type = check.factory_type || ''
    step1Form.is_supervision = check.is_supervision ?? 0
    Object.assign(entryPhotos, createEmptyEntryPhotos(), {
      weight_image: check.weight_image || '',
      vin_rub_image: check.vin_rub_image || '',
      front_image: check.front_image || '',
      rear_image: check.rear_image || '',
      left_image: check.left_image || '',
      right_image: check.right_image || '',
      engine_image: check.engine_image || '',
      dashboard_image: check.dashboard_image || ''
    })
    inspectorRemark.value = check.remark || ''
    conclusionType.value = (check.conclusion_type || 0) as ConclusionType
  }

  function populateItemsFromCheck(savedItems: QualityCheckItem[]) {
    for (const saved of savedItems) {
      for (const cat of inspectionCategories.value) {
        if (cat.category_name !== saved.item_category) continue
        const catalogItem = cat.items?.find((i) => i.item_name === saved.item_name)
        if (catalogItem) {
          itemResults[makeItemKey(catalogItem.id, catalogItem.item_name, cat.category_name)] =
            saved.status
          break
        }
      }
    }
  }

  function resolveResumeStep(check: QualityDetail) {
    if ((check.items || []).length > 0) return 2
    if (Number(check.weight) > 0) return 1
    return 0
  }

  async function loadInspectors() {
    if (inspectorOptions.value.length) return
    loadingInspectors.value = true
    try {
      const list = await fetchUserRoleList({
        role_id: QC_INSPECTOR_ROLE_ID,
        page: 1,
        limit: 100
      })
      inspectorOptions.value = list
    } catch {
      inspectorOptions.value = []
    } finally {
      loadingInspectors.value = false
    }
  }

  async function loadCllxCascade() {
    if (cllxOptions.value.length) return
    loadingCllx.value = true
    try {
      const tree = (await fetchCllxCascade()) || []
      cllxOptions.value = flattenCllxCascade(tree)
    } catch {
      cllxOptions.value = []
    } finally {
      loadingCllx.value = false
    }
  }

  async function initWorkbench(item: QualityQueueItem) {
    resetForm()
    await Promise.all([loadCllxCascade(), loadInspectors()])
    try {
      const existing = await fetchQualityByOrder(item.order_id, item.vehicle_id)
      if (!existing?.id) return

      populateStep1FromCheck(existing)
      await loadItems()
      if (existing.items?.length) {
        populateItemsFromCheck(existing.items)
      }
      currentStep.value = resolveResumeStep(existing)
    } catch {
      // 无历史记录时保持新建流程
    }
  }

  watch(
    () => [props.visible, props.queueItem?.vehicle_id, props.queueItem?.order_id] as const,
    ([visible]) => {
      if (visible && props.queueItem) {
        initWorkbench(props.queueItem)
      }
    }
  )

  async function nextStep() {
    if (currentStep.value === 0) {
      submitting.value = true
      try {
        const step1Payload = buildStep1Payload()
        if (checkId.value) {
          await updateQuality({ id: checkId.value, ...step1Payload })
        } else {
          const res = await createQuality({
            order_id: props.queueItem?.order_id || 0,
            vehicle_id: props.queueItem?.vehicle_id || 0,
            ...step1Payload
          })
          checkId.value = res.id
        }
        if (!inspectionCategories.value.length) {
          await loadItems()
        }
        currentStep.value = 1
      } catch {
        // 错误已由 http 拦截器处理
      } finally {
        submitting.value = false
      }
    } else if (currentStep.value === 1) {
      submitting.value = true
      try {
        await updateQuality({
          id: checkId.value,
          items: buildAllItems()
        })
        currentStep.value = 2
      } catch {
        // 错误已由 http 拦截器处理
      } finally {
        submitting.value = false
      }
    }
  }

  function prevStep() {
    if (currentStep.value > 0) currentStep.value--
  }

  async function handleSubmit() {
    if (!checkId.value || !props.queueItem) return
    submitting.value = true
    try {
      await updateQuality({
        id: checkId.value,
        order_id: props.queueItem.order_id,
        vehicle_id: props.queueItem.vehicle_id,
        conclusion: conclusionType.value === 1 ? 1 : 2,
        conclusion_type: conclusionType.value,
        remark: inspectorRemark.value,
        items: buildAllItems(),
        ...buildStep1Payload()
      })
      emit('success')
    } catch {
      // 错误已由 http 拦截器处理
    } finally {
      submitting.value = false
    }
  }

  function handleClose() {
    dialogVisible.value = false
    resetForm()
  }

  function resetForm() {
    currentStep.value = 0
    checkId.value = 0
    inspectorName.value = ''
    step1Form.plate_status_arr = []
    step1Form.is_cancelled = 0
    step1Form.wheel_material = '铁轮毂'
    step1Form.factory_type = ''
    step1Form.is_supervision = 0
    step1Form.weight = undefined
    step1Form.tare_weight = undefined
    step1Form.deduction_weight = undefined
    Object.assign(entryPhotos, createEmptyEntryPhotos())
    uploadingPhotoField.value = ''
    pendingPhotoField.value = ''
    inspectionCategories.value = []
    noDeductMissing.value = false
    Object.keys(itemResults).forEach((k) => delete itemResults[k])
    conclusionType.value = 0
    inspectorRemark.value = ''
  }
</script>

<style lang="scss">
  .qc-workbench-dialog {
    padding: 0 !important;

    .el-dialog__header {
      padding: 0;
      margin: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 0;
      background: #fafafa;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>

<style scoped lang="scss">
  .qc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
  }

  .qc-header-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .qc-header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #1677ff;
    background: #e6f4ff;
    border-radius: 8px;
  }

  .qc-header-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
  }

  .qc-header-sub {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .qc-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 20px;
    color: #9ca3af;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover {
      background: #f3f4f6;
    }
  }

  .qc-step-bar {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid #f3f4f6;
  }

  .qc-step-item {
    display: flex;
    flex: 1;
    align-items: center;
  }

  .qc-step-node-wrap {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .qc-step-node {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 12px;
    font-weight: 700;
    color: #8c8c8c;
    background: #f5f5f5;
    border-radius: 50%;

    &.is-active {
      color: #fff;
      background: #1677ff;
    }

    &.is-done {
      color: #fff;
      background: #52c41a;
    }
  }

  .qc-step-label {
    font-size: 12px;
    font-weight: 500;
    color: #8c8c8c;

    &.is-active {
      color: #1677ff;
    }

    &.is-done {
      color: #52c41a;
    }
  }

  .qc-step-line {
    flex: 1;
    height: 1px;
    margin: 0 12px;
    background: #e8e8e8;

    &.is-done {
      background: #52c41a;
    }
  }

  .qc-body {
    max-height: calc(92vh - 200px);
    overflow-y: auto;
  }

  .qc-step-panel {
    padding: 24px;
  }

  .qc-section {
    margin-bottom: 20px;
  }

  .qc-section-title {
    padding-bottom: 6px;
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    border-bottom: 1px solid #f3f4f6;
  }

  .qc-readonly-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .qc-readonly-item {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 4px;
  }

  .qc-readonly-label {
    flex-shrink: 0;
    width: 64px;
    font-size: 12px;
    color: #9ca3af;
  }

  .qc-readonly-value {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .qc-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .qc-form-field {
    margin-bottom: 0;
  }

  .qc-field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #4b5563;
  }

  .required {
    color: #ff4d4f;
  }

  .qc-toggle-row {
    display: flex;
    gap: 8px;
  }

  .qc-toggle-btn {
    flex: 1;
    padding: 8px 0;
    font-size: 12px;
    font-weight: 500;
    color: #595959;
    cursor: pointer;
    background: #fff;
    border: 2px solid #d9d9d9;
    border-radius: 4px;
    transition: all 0.2s;

    &.is-active {
      color: #1677ff;
      background: #e6f4ff;
      border-color: #1677ff;
    }

    &.is-warn.is-active {
      color: #fa8c16;
      background: #fff7e6;
      border-color: #fa8c16;
    }
  }

  .qc-monitor-row .qc-monitor-btn {
    padding: 10px 0;
    font-size: 14px;
  }

  .qc-weight-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .qc-net-weight {
    padding: 8px 12px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.5rem;
    color: #1677ff;
    background: #e6f4ff;
    border-radius: 4px;
  }

  .qc-inspector-field {
    margin-top: 12px;
  }

  .qc-full-width {
    width: 100%;
  }

  .qc-photo-input {
    display: none;
  }

  .qc-photo-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .qc-photo-slot {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    cursor: pointer;
    border: 2px dashed #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      background: #e6f4ff;
      border-color: #1677ff;
    }

    &.has-photo {
      border-color: #1677ff;
      border-style: solid;
    }

    &.is-uploading {
      pointer-events: none;
      opacity: 0.6;
    }
  }

  .qc-photo-preview-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;

    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
      cursor: zoom-in;
    }
  }

  .qc-photo-delete {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    font-size: 18px;
    color: #fff;
    cursor: pointer;
    background: #ff4d4f;
    border: none;
    border-radius: 50%;
    transition: background 0.2s;
  }

  .qc-photo-icon {
    font-size: 16px;
    color: #9ca3af;
  }

  .qc-photo-label {
    position: relative;
    z-index: 1;
    padding: 2px 4px;
    font-size: 10px;
    line-height: 1.2;
    color: #9ca3af;
    text-align: center;
    background: rgb(255 255 255 / 85%);
    border-radius: 4px;
  }

  .qc-photo-slot.has-photo .qc-photo-label {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 4px;
    color: #fff;
    background: rgb(0 0 0 / 45%);
    border-radius: 0;
  }

  .qc-legend {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .qc-legend-tag {
    padding: 4px 8px;
    font-weight: 500;
    border-radius: 4px;

    &.good {
      color: #52c41a;
      background: #f6ffed;
    }

    &.miss {
      color: #ff4d4f;
      background: #fff1f0;
    }
  }

  .qc-legend-hint {
    margin-left: auto;
    color: #9ca3af;
  }

  .qc-categories {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .qc-category-card {
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .qc-category-head {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .qc-category-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: #fff;
    border-radius: 8px;
  }

  .qc-category-name {
    font-size: 14px;
    font-weight: 600;
  }

  .qc-category-count {
    margin-left: auto;
    font-size: 12px;
    color: #9ca3af;
  }

  .qc-category-badge {
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 12px;

    &.miss {
      color: #ff4d4f;
      background: #fee2e2;
    }

    &.damage {
      color: #fa8c16;
      background: #ffedd5;
    }
  }

  .qc-category-body {
    background: #fff;
  }

  .qc-item-row {
    display: flex;
    gap: 12px;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid #f9fafb;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f9fafb;
    }
  }

  .qc-item-name {
    flex: 1;
    font-size: 14px;
    color: #374151;
  }

  .qc-item-camera {
    display: flex;
    padding: 6px;
    color: #9ca3af;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;

    &:hover {
      color: #1677ff;
      background: #e6f4ff;
    }
  }

  .qc-item-btns {
    display: flex;
    gap: 6px;
  }

  .qc-result-btn {
    width: 36px;
    height: 28px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 4px;
    transition: all 0.2s;

    &.present {
      color: #52c41a;
      background: #f6ffed;

      &.active {
        color: #fff;
        background: #52c41a;
        border-color: #52c41a;
      }
    }

    &.missing {
      color: #ff4d4f;
      background: #fff1f0;

      &.active {
        color: #fff;
        background: #ff4d4f;
        border-color: #ff4d4f;
      }
    }
  }

  .qc-deduct-bar {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    margin-top: 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgb(0 0 0 / 5%);
  }

  .qc-deduct-stats {
    display: flex;
    gap: 24px;
  }

  .qc-deduct-label {
    font-size: 12px;
    color: #6b7280;
  }

  .qc-deduct-value {
    margin-left: 8px;
    font-weight: 700;

    &.miss {
      color: #ff4d4f;
    }

    &.damage {
      color: #fa8c16;
    }

    &.total {
      font-size: 18px;
      color: #ff4d4f;
    }
  }

  .qc-no-deduct {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    color: #4b5563;
    cursor: pointer;
  }

  .qc-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .qc-summary-card {
    padding: 16px;
    text-align: center;
    border-radius: 8px;
  }

  .qc-summary-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #6b7280;
  }

  .qc-summary-value {
    font-size: 20px;
    font-weight: 700;
  }

  .qc-abnormal-card {
    padding: 16px;
    margin-bottom: 20px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
  }

  .qc-abnormal-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
    color: #b91c1c;
  }

  .qc-abnormal-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 12px;
  }

  .qc-abnormal-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .qc-abnormal-type {
    color: #f87171;
  }

  .qc-abnormal-amount {
    font-weight: 500;
    color: #dc2626;
  }

  .text-red {
    color: #dc2626;
  }

  .text-orange {
    color: #ea580c;
  }

  .qc-conclusion-section {
    margin-bottom: 20px;
  }

  .qc-conclusion-btns {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .qc-conclusion-btn {
    flex: 1;
    padding: 8px 0;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    background: #fff;
    border: 2px solid #d9d9d9;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .qc-remark-input {
    :deep(.el-textarea__inner) {
      border-radius: 4px;
    }
  }

  .qc-sign-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    font-size: 14px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .qc-sign-muted {
    color: #9ca3af;
  }

  .qc-sign-value {
    font-weight: 500;
    color: #374151;
  }

  .qc-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
  }

  .qc-footer-step {
    font-size: 12px;
    color: #9ca3af;
  }

  .qc-footer-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .qc-next-icon {
    margin-left: 2px;
    font-size: 16px;
    vertical-align: -2px;
  }
</style>
