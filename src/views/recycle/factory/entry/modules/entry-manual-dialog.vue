<template>
  <ElDialog
    v-model="dialogVisible"
    width="580px"
    align-center
    destroy-on-close
    :show-close="true"
    class="entry-manual-dialog"
    style="padding: 0 !important"
    @closed="handleClosed"
  >
    <template #header>
      <div class="entry-dialog-header">
        <div>
          <div class="entry-dialog-title">手动登记入库</div>
          <div class="entry-dialog-subtitle">搜索车辆档案后完成入库登记</div>
        </div>
      </div>
    </template>

    <div class="entry-manual-steps">
      <div v-for="(label, index) in stepLabels" :key="label" class="entry-manual-step">
        <div
          class="entry-manual-step-dot"
          :class="{
            'is-done': index < currentStepIndex,
            'is-active': index === currentStepIndex
          }"
        >
          {{ index < currentStepIndex ? '✓' : index + 1 }}
        </div>
        <span
          class="entry-manual-step-label"
          :class="{
            'is-done': index < currentStepIndex,
            'is-active': index === currentStepIndex
          }"
        >
          {{ label }}
        </span>
        <div
          v-if="index === 0"
          class="entry-manual-step-line"
          :class="{ 'is-done': currentStepIndex > 0 }"
        />
      </div>
    </div>

    <div class="entry-manual-body">
      <template v-if="step === 'search'">
        <div class="entry-manual-search">
          <ArtSvgIcon icon="ri:search-line" class="entry-manual-search-icon" />
          <ElInput
            v-model="searchQuery"
            placeholder="搜索车牌号 / 档案号 / 车主姓名"
            clearable
            @input="debouncedLoadVehicles"
          />
        </div>

        <div v-loading="loadingVehicles" class="entry-manual-archive-list">
          <div v-if="!loadingVehicles && !vehicles.length" class="entry-manual-empty">
            未找到匹配的车辆档案
          </div>
          <div
            v-for="item in vehicles"
            :key="item.id"
            class="entry-manual-archive-card"
            :class="{
              'is-selected': selectedVehicle?.id === item.id,
              'is-disabled': !item.order_id
            }"
            @click="handleSelectVehicle(item)"
          >
            <div class="entry-manual-archive-icon">
              <ArtSvgIcon icon="ri:car-line" />
            </div>
            <div class="entry-manual-archive-main">
              <div class="entry-manual-archive-top">
                <span class="entry-manual-plate">{{ item.plate_no || '—' }}</span>
                <span class="entry-manual-model">{{ getVehicleInfo(item) }}</span>
              </div>
              <div class="entry-manual-archive-meta">
                档案号：{{ getArchiveNo(item) }} · 车主：{{ item.owner_name || '—' }}
                <template v-if="getInspectorName(item)">
                  · 质检员：{{ getInspectorName(item) }}
                </template>
                <span v-if="!item.order_id" class="entry-manual-no-order"
                  >（未关联订单，不可登记）</span
                >
              </div>
            </div>
            <ArtSvgIcon
              v-if="selectedVehicle?.id === item.id"
              icon="ri:checkbox-circle-fill"
              class="entry-manual-check"
            />
          </div>
        </div>
      </template>

      <template v-else-if="selectedVehicle">
        <div class="entry-manual-summary">
          <div>
            <div class="entry-manual-summary-plate">{{ selectedVehicle.plate_no || '—' }}</div>
            <div class="entry-manual-summary-sub">
              {{ getVehicleInfo(selectedVehicle) }} · {{ getArchiveNo(selectedVehicle) }}
            </div>
          </div>
          <div v-if="vehicleWeight > 0" class="entry-manual-summary-weight">
            <div class="entry-manual-summary-weight-label">净重（估）</div>
            <div class="entry-manual-summary-weight-value">{{ vehicleWeight }} kg</div>
          </div>
        </div>

        <div class="entry-tip">分配仓库和库位后，车辆将正式入库，状态变为"待领料"。</div>

        <ElForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
          class="entry-form"
        >
          <ElFormItem prop="warehouse_area_id">
            <template #label>
              <span class="entry-field-label">入库仓库</span>
            </template>
            <ElSelect
              v-model="formData.warehouse_area_id"
              placeholder="请选择仓库"
              class="entry-field-control"
              @change="handleAreaChange"
            >
              <ElOption
                v-for="area in warehouseAreas"
                :key="area.id"
                :label="area.area_name"
                :value="area.id"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem prop="location_id">
            <template #label>
              <span class="entry-field-label">库位编码 <span class="entry-required">*</span></span>
            </template>
            <ElSelect
              v-model="formData.location_id"
              :placeholder="locationPlaceholder"
              :disabled="!formData.warehouse_area_id || loadingLocations"
              :loading="loadingLocations"
              class="entry-field-control"
            >
              <ElOption
                v-for="loc in locationOptions"
                :key="loc.id"
                :label="getLocationLabel(loc)"
                :value="loc.id"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <span class="entry-field-label">入库单号（人工编码）</span>
            </template>
            <ElInput
              v-model="formData.manual_entry_no"
              placeholder="请输入自编入库单号"
              class="entry-field-control"
            />
          </ElFormItem>

          <ElFormItem>
            <template #label>
              <span class="entry-field-label">入库ID（系统生成）</span>
            </template>
            <div class="entry-no-preview">{{ previewEntryNo }}</div>
          </ElFormItem>
        </ElForm>
      </template>
    </div>

    <template #footer>
      <div class="entry-manual-footer">
        <ElButton class="entry-btn-cancel" @click="dialogVisible = false">取消</ElButton>
        <template v-if="step === 'search'">
          <ElButton
            type="primary"
            class="entry-btn-confirm"
            :disabled="!canGoNext"
            @click="goWarehouseStep"
          >
            下一步：填写入库信息
          </ElButton>
        </template>
        <template v-else>
          <ElButton class="entry-btn-cancel" @click="step = 'search'">上一步</ElButton>
          <ElButton
            type="primary"
            class="entry-btn-confirm"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ submitting ? '登记中…' : '确认入库登记' }}
          </ElButton>
        </template>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { fetchVehicleList } from '@/api/recycle/vehicle'
  import {
    fetchWarehouseAreas,
    fetchWarehouseLocations,
    saveWarehouseEntry
  } from '@/api/recycle/warehouse'
  import type { ScrapVehicle } from '@/types/recycle/recovery/vehicles/vehicle'
  import type {
    WarehouseAreaOption,
    WarehouseLocationOption
  } from '@/types/recycle/warehouse/warehouse'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const stepLabels = ['选择车辆档案', '填写入库信息']
  const step = ref<'search' | 'warehouse'>('search')
  const searchQuery = ref('')
  const vehicles = ref<ScrapVehicle[]>([])
  const loadingVehicles = ref(false)
  const selectedVehicle = ref<ScrapVehicle | null>(null)
  const warehouseAreas = ref<WarehouseAreaOption[]>([])
  const locationOptions = ref<WarehouseLocationOption[]>([])
  const loadingLocations = ref(false)
  const submitting = ref(false)
  const formRef = ref<FormInstance>()

  const formData = reactive({
    warehouse_area_id: undefined as number | undefined,
    location_id: undefined as number | undefined,
    manual_entry_no: ''
  })

  const rules: FormRules = {
    warehouse_area_id: [{ required: true, message: '请选择入库仓库', trigger: 'change' }],
    location_id: [{ required: true, message: '请选择库位编码', trigger: 'change' }]
  }

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const currentStepIndex = computed(() => (step.value === 'search' ? 0 : 1))

  const canGoNext = computed(() => Boolean(selectedVehicle.value?.order_id))

  const vehicleWeight = computed(() => {
    const row = selectedVehicle.value
    if (!row) return 0
    return Number(row.weigh_net || row.weight || row.qc_weight || 0)
  })

  const previewEntryNo = computed(() => {
    const now = new Date()
    const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    return `RK${date}${String(Date.now()).slice(-4)}`
  })

  const locationPlaceholder = computed(() => {
    if (!formData.warehouse_area_id) return '请先选择入库仓库'
    if (loadingLocations.value) return '加载库位中…'
    if (!locationOptions.value.length) return '该仓库暂无可用库位'
    return '请选择库位编码'
  })

  function getArchiveNo(row: ScrapVehicle): string {
    return row.vehicle_no || row.archive_no || String(row.id)
  }

  function getVehicleInfo(row: ScrapVehicle): string {
    return (
      row.brand_model || row.vehicle_info || `${row.brand || ''} ${row.model || ''}`.trim() || '—'
    )
  }

  function getInspectorName(row: ScrapVehicle): string {
    return String(row.inspector_name || row.qc_inspector_name || '')
  }

  function getLocationLabel(loc: WarehouseLocationOption): string {
    const code = loc.location_no || '—'
    const suffix = loc.status === 1 ? '（已占用）' : ''
    if (loc.area) return `${loc.area}-${code}${suffix}`
    return `${code}${suffix}`
  }

  async function loadVehicles() {
    loadingVehicles.value = true
    try {
      const res = await fetchVehicleList({
        keyword: searchQuery.value.trim(),
        tab: 'all',
        current: 1,
        size: 50
      })
      vehicles.value = res.records
    } catch {
      vehicles.value = []
    } finally {
      loadingVehicles.value = false
    }
  }

  const debouncedLoadVehicles = useDebounceFn(loadVehicles, 300)

  async function loadWarehouseAreas() {
    try {
      warehouseAreas.value = (await fetchWarehouseAreas()) || []
    } catch {
      warehouseAreas.value = []
    }
  }

  async function loadLocations(areaId: number) {
    loadingLocations.value = true
    locationOptions.value = []
    try {
      locationOptions.value = await fetchWarehouseLocations(areaId)
    } catch {
      locationOptions.value = []
    } finally {
      loadingLocations.value = false
    }
  }

  function handleSelectVehicle(item: ScrapVehicle) {
    if (!item.order_id) {
      ElMessage.warning('该车辆未关联订单，无法手动登记入库')
      return
    }
    selectedVehicle.value = item
  }

  function goWarehouseStep() {
    if (!canGoNext.value) return
    step.value = 'warehouse'
  }

  async function handleAreaChange(areaId: number) {
    formData.location_id = undefined
    if (areaId) {
      await loadLocations(areaId)
    } else {
      locationOptions.value = []
    }
  }

  function resetState() {
    step.value = 'search'
    searchQuery.value = ''
    vehicles.value = []
    selectedVehicle.value = null
    formData.warehouse_area_id = undefined
    formData.location_id = undefined
    formData.manual_entry_no = ''
    locationOptions.value = []
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    if (!selectedVehicle.value?.id || !selectedVehicle.value.order_id) return
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid || !formData.location_id) return

    submitting.value = true
    try {
      const row = selectedVehicle.value
      const remarkParts = [formData.manual_entry_no.trim()].filter(Boolean)

      await saveWarehouseEntry({
        order_id: row.order_id,
        vehicle_id: row.id,
        location_id: formData.location_id,
        plate_no: row.plate_no,
        vehicle_info: getVehicleInfo(row),
        customer_name: row.owner_name,
        customer_phone: row.owner_phone,
        vehicle_weight: vehicleWeight.value || undefined,
        remark: remarkParts.join(' ')
      })
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetState()
  }

  let searchTimer: ReturnType<typeof setTimeout> | undefined

  watch(searchQuery, () => {
    if (!props.visible) return
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      loadVehicles()
    }, 300)
  })

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        resetState()
        loadVehicles()
        loadWarehouseAreas()
      }
    }
  )
</script>

<style scoped lang="scss">
  .entry-dialog-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: #111827;
  }

  .entry-dialog-subtitle {
    margin-top: 2px;
    font-size: 12px;
    line-height: 16px;
    color: #9ca3af;
  }

  .entry-manual-steps {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 1px solid #f3f4f6;
  }

  .entry-manual-step {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .entry-manual-step-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 10px;
    font-weight: 700;
    color: #8c8c8c;
    background: #e8e8e8;
    border-radius: 50%;

    &.is-active {
      color: #fff;
      background: #1890ff;
    }

    &.is-done {
      color: #fff;
      background: #52c41a;
    }
  }

  .entry-manual-step-label {
    font-size: 12px;
    font-weight: 500;
    color: #8c8c8c;

    &.is-active {
      color: #1890ff;
    }

    &.is-done {
      color: #52c41a;
    }
  }

  .entry-manual-step-line {
    width: 32px;
    height: 1px;
    margin: 0 4px;
    background: #e8e8e8;

    &.is-done {
      background: #52c41a;
    }
  }

  .entry-manual-body {
    max-height: calc(88vh - 200px);
    padding: 20px 24px;
    overflow-y: auto;
  }

  .entry-manual-search {
    position: relative;
    margin-bottom: 16px;

    :deep(.el-input__wrapper) {
      padding-left: 36px;
    }
  }

  .entry-manual-search-icon {
    position: absolute;
    top: 50%;
    left: 12px;
    z-index: 1;
    font-size: 16px;
    color: #9ca3af;
    transform: translateY(-50%);
  }

  .entry-manual-archive-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 120px;
  }

  .entry-manual-empty {
    padding: 40px 0;
    font-size: 14px;
    color: #9ca3af;
    text-align: center;
  }

  .entry-manual-archive-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    cursor: pointer;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition:
      border-color 0.2s,
      background 0.2s;

    &:hover:not(.is-disabled) {
      border-color: #91d5ff;
    }

    &.is-selected {
      background: #e6f7ff;
      border-color: #1890ff;
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  .entry-manual-archive-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 16px;
    color: #8c8c8c;
    background: #f5f5f5;
    border-radius: 50%;

    .is-selected & {
      color: #fff;
      background: #1890ff;
    }
  }

  .entry-manual-archive-main {
    flex: 1;
    min-width: 0;
  }

  .entry-manual-archive-top {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 2px;
  }

  .entry-manual-plate {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .entry-manual-model {
    font-size: 12px;
    color: #9ca3af;
  }

  .entry-manual-archive-meta {
    font-size: 12px;
    line-height: 18px;
    color: #9ca3af;
  }

  .entry-manual-no-order {
    color: #ff4d4f;
  }

  .entry-manual-check {
    flex-shrink: 0;
    font-size: 20px;
    color: #1890ff;
  }

  .entry-manual-summary {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    margin-bottom: 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .entry-manual-summary-plate {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .entry-manual-summary-sub {
    margin-top: 2px;
    font-size: 12px;
    color: #6b7280;
  }

  .entry-manual-summary-weight {
    margin-left: auto;
    text-align: right;
  }

  .entry-manual-summary-weight-label {
    font-size: 12px;
    color: #9ca3af;
  }

  .entry-manual-summary-weight-value {
    font-size: 14px;
    font-weight: 600;
    color: #1890ff;
  }

  .entry-tip {
    padding: 12px;
    margin-bottom: 16px;
    font-size: 12px;
    line-height: 1.5;
    color: #1890ff;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
  }

  .entry-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
      height: 26px !important;
      padding: 0;
      line-height: 32px !important;
    }
  }

  .entry-field-label {
    font-size: 14px;
    line-height: 16px;
    color: #4b5563;
  }

  .entry-required {
    color: #ff4d4f;
  }

  .entry-field-control {
    width: 100%;

    :deep(.el-select__wrapper),
    :deep(.el-input__wrapper) {
      min-height: 36px;
      font-size: 14px;
      border-radius: 4px;
      box-shadow: 0 0 0 1px #d1d5db inset;
    }

    :deep(.el-select__wrapper.is-focused),
    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px #1890ff inset;
    }
  }

  .entry-no-preview {
    width: 100%;
    padding: 8px 12px;
    font-size: 12px;
    line-height: 20px;
    color: #6b7280;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .entry-manual-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .entry-btn-cancel {
    height: 36px;
    padding: 0 16px;
    font-size: 14px;
    color: #4b5563;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 4px;

    &:hover {
      color: #4b5563;
      background: #f9fafb;
      border-color: #d1d5db;
    }
  }

  .entry-btn-confirm {
    height: 36px;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 500;
    background: #1890ff;
    border-color: #1890ff;
    border-radius: 4px;

    &:hover {
      background: #096dd9;
      border-color: #096dd9;
    }
  }
</style>

<style lang="scss">
  .entry-manual-dialog {
    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 20px;
      width: 28px;
      height: 28px;
    }
  }
</style>
