<template>
  <ElDialog
    v-model="dialogVisible"
    width="620px"
    align-center
    destroy-on-close
    class="work-create-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="work-dialog-header">
        <div>
          <div class="work-dialog-title">新建拆解工单</div>
          <div class="work-dialog-subtitle">从已领料出库车辆中选择，创建后进入拆解流程</div>
        </div>
      </div>
    </template>

    <div v-loading="loadingList" class="work-create-body">
      <div class="work-entry-limit-tip">
        <ArtSvgIcon icon="ri:error-warning-fill" class="work-entry-limit-icon" />
        <div class="work-entry-limit-text">
          <span class="work-entry-limit-title">进场通过限制：</span>
          车辆档案须在商务部完成"进场通过"审核后，方可创建拆解工单。未通过进场审核的档案仅可查看，不可选择。
        </div>
      </div>

      <div class="work-form-field">
        <label class="work-field-label">选择车辆档案 <span class="required">*</span></label>
        <ElInput
          v-model="searchKeyword"
          placeholder="搜索车牌号 / 档案号 / 车主"
          clearable
          class="work-vehicle-search"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" />
          </template>
        </ElInput>

        <div class="work-vehicle-list">
          <div v-if="!filteredVehicles.length" class="work-vehicle-empty">暂无可用车辆档案</div>
          <button
            v-for="item in filteredVehicles"
            :key="item.id"
            type="button"
            class="work-vehicle-item"
            :class="{
              'is-selected': selectedId === item.id,
              'is-disabled': isVehicleLocked(item)
            }"
            :disabled="isVehicleLocked(item)"
            @click="handleSelectVehicle(item)"
          >
            <div class="work-vehicle-radio">
              <ArtSvgIcon
                v-if="isVehicleLocked(item)"
                icon="ri:lock-line"
                class="work-vehicle-lock"
              />
              <ArtSvgIcon
                v-else-if="selectedId === item.id"
                icon="ri:checkbox-circle-fill"
                class="work-vehicle-checked"
              />
              <ArtSvgIcon v-else icon="ri:circle-line" class="work-vehicle-unchecked" />
            </div>
            <div class="work-vehicle-main">
              <div class="work-vehicle-row">
                <span class="work-vehicle-plate">{{ item.plate_no || '—' }}</span>
                <span class="work-vehicle-model">{{ vehicleModelText(item) }}</span>
              </div>
              <div class="work-vehicle-sub">
                档案号：{{ item.vehicle_no || item.archive_no || '—' }} · 车主：{{
                  item.owner_name || '—'
                }}
                · 库位：{{ item.warehouse_slot || '—' }}
              </div>
            </div>
            <div v-if="item.business_zt_text" class="work-vehicle-status">
              <div class="work-vehicle-status-label">商务部状态</div>
              <div
                class="work-vehicle-status-text"
                :style="{ color: getBusinessStatusColor(item) }"
              >
                {{ item.business_zt_text }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <div v-if="selectedVehicle" class="work-selected-summary">
        <div class="work-selected-title">已选车辆档案</div>
        <div class="work-selected-detail">
          <div>
            <span class="label">车牌：</span>
            <span>{{ selectedVehicle.plate_no || '—' }}</span>
          </div>
          <div>
            <span class="label">车型：</span>
            <span>{{ selectedVehicle.vehicle_model || '—' }}</span>
          </div>
          <div>
            <span class="label">库位：</span>
            <span>{{ selectedVehicle.warehouse_slot || '—' }}</span>
          </div>
          <div>
            <span class="label">车主：</span>
            <span>{{ selectedVehicle.owner_name || '—' }}</span>
          </div>
        </div>
      </div>

      <div class="work-form-field">
        <label class="work-field-label">负责拆解人员 <span class="required">*</span></label>
        <ElSelect
          v-model="leaderId"
          placeholder="请选择负责人"
          filterable
          clearable
          class="work-full-width"
          :loading="loadingStaff"
        >
          <ElOption
            v-for="staff in staffList"
            :key="staff.uid"
            :label="staff.nickname || `用户${staff.uid}`"
            :value="staff.uid"
          />
        </ElSelect>
      </div>

      <div class="work-tip">
        创建工单后进入待拆解流程。拆解工作全部线下完成后，在详情中操作「完成拆解」进入待缴库流程。
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="submitting" :disabled="!canSubmit" @click="handleSubmit">
        确认创建工单
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchMaterialStaffList } from '@/api/recycle/material'
  import { fetchPlateCreate, fetchPlatePendingVehicles } from '@/api/recycle/plate'
  import type { MaterialStaffOption } from '@/types/recycle/dismantle/product/material'
  import type { PlatePendingVehicle } from '@/types/recycle/dismantle/work/plate'
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

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const loadingList = ref(false)
  const loadingStaff = ref(false)
  const submitting = ref(false)
  const searchKeyword = ref('')
  const selectedId = ref<number>()
  const leaderId = ref<number>()
  const vehicles = ref<PlatePendingVehicle[]>([])
  const staffList = ref<MaterialStaffOption[]>([])

  const filteredVehicles = computed(() => {
    const q = searchKeyword.value.trim().toLowerCase()
    if (!q) return vehicles.value
    return vehicles.value.filter((item) => {
      const text = [
        item.plate_no,
        item.owner_name,
        item.brand,
        item.model,
        item.warehouse_slot,
        item.archive_no,
        item.vehicle_no
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return text.includes(q)
    })
  })

  function isVehicleLocked(item: PlatePendingVehicle) {
    if (item.is_locked === 1 || item.selectable === 0) return true
    const businessZt = Number(item.business_zt)
    return !Number.isFinite(businessZt) || businessZt < 30
  }

  function vehicleModelText(item: PlatePendingVehicle) {
    if (item.vehicle_model) return item.vehicle_model
    return [item.brand, item.model].filter(Boolean).join(' ')
  }

  function getBusinessStatusColor(item: PlatePendingVehicle) {
    const businessZt = Number(item.business_zt)
    if (businessZt >= 30) return '#52C41A'
    return '#666'
  }

  function handleSelectVehicle(item: PlatePendingVehicle) {
    if (isVehicleLocked(item)) return
    selectedId.value = item.id
  }

  const selectedVehicle = computed(() =>
    vehicles.value.find((item) => item.id === selectedId.value)
  )

  const canSubmit = computed(() => Boolean(selectedId.value && leaderId.value))

  async function loadVehicles() {
    loadingList.value = true
    try {
      vehicles.value = await fetchPlatePendingVehicles()
    } finally {
      loadingList.value = false
    }
  }

  async function loadStaff() {
    loadingStaff.value = true
    try {
      staffList.value = (await fetchMaterialStaffList()) || []
    } finally {
      loadingStaff.value = false
    }
  }

  async function handleSubmit() {
    const vehicle = selectedVehicle.value
    const staff = staffList.value.find((item) => item.uid === leaderId.value)
    if (!vehicle || !staff) return

    submitting.value = true
    try {
      await fetchPlateCreate({
        vehicle_id: vehicle.id,
        person_in_charge: staff.nickname,
        person_in_charge_id: staff.uid
      })
      emit('success')
      dialogVisible.value = false
    } catch {
      ElMessage.error('创建失败，请重试')
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    searchKeyword.value = ''
    selectedId.value = undefined
    leaderId.value = undefined
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        loadVehicles()
        loadStaff()
      }
    }
  )
</script>

<style scoped lang="scss">
  .work-create-dialog {
    :deep(.el-dialog__header) {
      padding: 16px 20px 0;
      margin-right: 0;
    }

    :deep(.el-dialog__body) {
      padding: 16px 20px;
    }

    :deep(.el-dialog__footer) {
      padding: 12px 20px 16px;
    }
  }

  .work-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .work-dialog-subtitle {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .work-create-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .work-form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .work-field-label {
    font-size: 14px;
    color: var(--art-gray-700);

    .required {
      color: #ff4d4f;
    }
  }

  .work-full-width {
    width: 100%;
  }

  .work-entry-limit-tip {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 8px;
  }

  .work-entry-limit-icon {
    flex-shrink: 0;
    margin-top: 1px;
    font-size: 16px;
    color: #faad14;
  }

  .work-entry-limit-text {
    font-size: 12px;
    line-height: 20px;
    color: #614700;
  }

  .work-entry-limit-title {
    font-weight: 600;
  }

  .work-vehicle-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 320px;
    padding: 8px;
    overflow-y: auto;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
  }

  .work-vehicle-empty {
    padding: 24px 0;
    font-size: 12px;
    color: var(--art-gray-600);
    text-align: center;
  }

  .work-vehicle-item {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 2px solid #e8e8e8;
    border-radius: 8px;
    transition: all 0.2s;

    &.is-selected {
      background: #e6f7ff;
      border-color: #1677ff;
    }

    &.is-disabled {
      cursor: not-allowed;
      background: #fafafa;
      border-color: #f0f0f0;
      opacity: 0.75;
    }
  }

  .work-vehicle-radio {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    font-size: 20px;
  }

  .work-vehicle-checked {
    color: #1677ff;
  }

  .work-vehicle-unchecked {
    color: #555;
  }

  .work-vehicle-lock {
    color: #bfbfbf;
  }

  .work-vehicle-main {
    flex: 1;
    min-width: 0;
  }

  .work-vehicle-status {
    flex-shrink: 0;
    max-width: 96px;
    text-align: right;
  }

  .work-vehicle-status-label {
    margin-bottom: 2px;
    font-size: 11px;
    line-height: 16px;
    color: var(--art-gray-500);
  }

  .work-vehicle-status-text {
    font-size: 12px;
    font-weight: 500;
    line-height: 18px;
    white-space: nowrap;
  }

  .work-vehicle-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
  }

  .work-vehicle-plate {
    font-size: 14px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .work-vehicle-model {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .work-vehicle-sub {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .work-selected-summary {
    padding: 12px;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    border-radius: 8px;
  }

  .work-selected-title {
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #389e0d;
  }

  .work-selected-detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    font-size: 12px;
    line-height: 18px;
    color: var(--art-gray-700);
  }

  .work-tip {
    padding: 12px;
    font-size: 12px;
    color: #1677ff;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
  }
</style>
