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
            :class="{ 'is-selected': selectedId === item.id }"
            @click="selectedId = item.id"
          >
            <div class="work-vehicle-main">
              <div class="work-vehicle-row">
                <span class="work-vehicle-plate">{{ item.plate_no || '—' }}</span>
                <span class="work-vehicle-model">{{ item.brand_name }} {{ item.model_name }}</span>
                <span v-if="item.fuel_type_text" class="work-vehicle-type">{{
                  item.fuel_type_text
                }}</span>
              </div>
              <div class="work-vehicle-sub">
                档案号：{{ item.archive_no || '—' }} · 车主：{{ item.owner_name || '—' }} · 库位：{{
                  item.location_name || '—'
                }}
              </div>
            </div>
            <ArtSvgIcon
              v-if="selectedId === item.id"
              icon="ri:checkbox-circle-fill"
              class="work-vehicle-check"
            />
          </button>
        </div>
      </div>

      <div v-if="selectedVehicle" class="work-selected-summary">
        <div>
          <span class="label">净重：</span>
          <span>{{ selectedVehicle.net_weight || '—' }}kg</span>
        </div>
        <div>
          <span class="label">库位：</span>
          <span>{{ selectedVehicle.location_name || '—' }}</span>
        </div>
        <div>
          <span class="label">车主：</span>
          <span>{{ selectedVehicle.owner_name || '—' }}</span>
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
  import { fetchMaterialList, fetchMaterialStaffList } from '@/api/recycle/material'
  import { fetchPlateCreate } from '@/api/recycle/plate'
  import type { MaterialItem, MaterialStaffOption } from '@/types/recycle/material'
  import type { PlateVehicleType } from '@/types/recycle/plate'
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
  const vehicles = ref<MaterialItem[]>([])
  const staffList = ref<MaterialStaffOption[]>([])

  const filteredVehicles = computed(() => {
    const q = searchKeyword.value.trim().toLowerCase()
    if (!q) return vehicles.value
    return vehicles.value.filter((item) => {
      const text = [
        item.plate_no,
        item.archive_no,
        item.owner_name,
        item.brand_name,
        item.model_name
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return text.includes(q)
    })
  })

  const selectedVehicle = computed(() =>
    vehicles.value.find((item) => item.id === selectedId.value)
  )

  const canSubmit = computed(() => Boolean(selectedId.value && leaderId.value))

  function mapFuelTypeToVehicleType(fuel?: string): PlateVehicleType {
    if (!fuel) return 1
    if (fuel.includes('纯电') && !fuel.includes('混')) return 2
    if (fuel.includes('混')) return 3
    return 1
  }

  async function loadVehicles() {
    loadingList.value = true
    try {
      const res = await fetchMaterialList({ status: 2, page: 1, limit: 200 })
      vehicles.value = res.records || []
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
        archive_no: vehicle.archive_no,
        order_id: vehicle.order_id,
        plate_no: vehicle.plate_no,
        vehicle_model: `${vehicle.brand_name || ''} ${vehicle.model_name || ''}`.trim(),
        vehicle_type: mapFuelTypeToVehicleType(vehicle.fuel_type_text),
        owner_name: vehicle.owner_name,
        is_normal_weigh: 1,
        net_weight: Number(vehicle.net_weight) || 0,
        unit: 'kg',
        parking_spot: vehicle.location_name,
        priority: '普通',
        status: 0,
        progress: 0,
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
  }

  .work-vehicle-main {
    flex: 1;
    min-width: 0;
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

  .work-vehicle-type {
    padding: 2px 6px;
    font-size: 12px;
    color: #1677ff;
    background: #e6f7ff;
    border-radius: 4px;
  }

  .work-vehicle-sub {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .work-vehicle-check {
    flex-shrink: 0;
    font-size: 20px;
    color: #1677ff;
  }

  .work-selected-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 12px;
    font-size: 12px;
    color: var(--art-gray-700);
    background: #f9fafb;
    border-radius: 8px;

    .label {
      color: var(--art-gray-600);
    }
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
