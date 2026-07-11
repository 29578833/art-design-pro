<template>
  <ElDialog
    v-model="dialogVisible"
    width="700px"
    align-center
    destroy-on-close
    :show-close="true"
    class="pickup-outbound-dialog"
    style="padding: 0 !important"
    @closed="handleClosed"
  >
    <template #header>
      <div class="pickup-dialog-header">
        <div class="pickup-dialog-title">领料出库</div>
        <div class="pickup-dialog-subtitle">搜索并选择库存原料车辆，支持单台或多台同时出库</div>
      </div>
    </template>

    <div class="pickup-outbound-body">
      <div class="pickup-tip">
        将原料车辆从仓库出库，交付拆解车间。完成登记后状态变为"已领料出库"。
      </div>

      <div class="pickup-vehicle-section">
        <div class="pickup-vehicle-toolbar">
          <span class="pickup-section-title">选择出库车辆</span>
          <div class="pickup-vehicle-meta">
            <span>
              已选 <strong>{{ checkedIds.size }}</strong> 台
              <template v-if="hasFilter"> （筛选结果 {{ filteredVehicles.length }} 台） </template>
              <template v-else> / 共 {{ pendingVehicles.length }} 台</template>
            </span>
            <button
              v-if="checkedIds.size > 0"
              type="button"
              class="pickup-clear-btn"
              @click="clearChecked"
            >
              清空已选
            </button>
          </div>
        </div>

        <div class="pickup-vehicle-filters">
          <ElInput
            v-model="searchKeyword"
            placeholder="搜索车牌号 / 档案号 / 品牌 / 库位 / 车主"
            clearable
            class="pickup-vehicle-search"
          >
            <template #prefix>
              <ArtSvgIcon icon="ri:search-line" />
            </template>
          </ElInput>
          <ElSelect
            v-model="warehouseFilter"
            placeholder="全部仓库"
            class="pickup-warehouse-select"
            clearable
          >
            <ElOption label="全部仓库" value="" />
            <ElOption v-for="wh in warehouseOptions" :key="wh" :label="wh" :value="wh" />
          </ElSelect>
          <ElButton v-if="hasFilter" @click="resetFilters">重置</ElButton>
        </div>

        <div v-loading="loadingList" class="pickup-vehicle-list">
          <div class="pickup-vehicle-list-header">
            <ElCheckbox
              :model-value="allFilteredChecked"
              :indeterminate="indeterminate"
              @change="toggleAllFiltered"
            />
            <span class="pickup-select-all-label" @click="toggleAllFiltered">
              {{ allFilteredChecked ? '取消全选' : `全选当前结果（${filteredVehicles.length}台）` }}
            </span>
          </div>

          <div v-if="!filteredVehicles.length" class="pickup-vehicle-empty">
            <ArtSvgIcon icon="ri:inbox-line" class="pickup-empty-icon" />
            <p>{{
              pendingVehicles.length === 0 ? '暂无待领料车辆' : '未找到匹配车辆，请调整搜索条件'
            }}</p>
          </div>

          <div v-else class="pickup-vehicle-items">
            <div
              v-for="item in filteredVehicles"
              :key="item.id"
              class="pickup-vehicle-item"
              :class="{ 'is-checked': checkedIds.has(item.id) }"
              @click="toggleItem(item.id)"
            >
              <ElCheckbox
                :model-value="checkedIds.has(item.id)"
                @click.stop="toggleItem(item.id)"
              />
              <div class="pickup-vehicle-main">
                <div class="pickup-vehicle-row">
                  <span class="pickup-vehicle-plate">{{ item.plate_no || '—' }}</span>
                  <span class="pickup-vehicle-model"
                    >{{ item.brand_name }} {{ item.model_name }}</span
                  >
                  <span v-if="item.fuel_type_text" class="pickup-vehicle-type">{{
                    item.fuel_type_text
                  }}</span>
                </div>
                <div class="pickup-vehicle-sub">
                  <span>库位：{{ item.location_name || '—' }}</span>
                  <span>档案：{{ item.archive_no || '—' }}</span>
                  <span>入库：{{ item.entry_no || '—' }}</span>
                </div>
              </div>
              <div class="pickup-vehicle-side">
                <div>{{ item.owner_name || '—' }}</div>
                <div class="pickup-vehicle-time">{{ formatDate(item.entry_time) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="checkedIds.size > 0" class="pickup-summary">
        <div class="pickup-summary-header">
          <span class="pickup-summary-title">本次领料汇总</span>
          <span class="pickup-summary-count">共 {{ checkedIds.size }} 台</span>
        </div>
        <div v-for="item in checkedList" :key="item.id" class="pickup-summary-row">
          <span>{{ item.plate_no }}</span>
          <span>{{ item.brand_name }} {{ item.model_name }}</span>
          <span>{{ item.location_name || '—' }}</span>
        </div>
      </div>

      <ElForm
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="pickup-form"
      >
        <ElFormItem prop="receiver_id">
          <template #label>
            <span class="pickup-field-label">领料人</span>
          </template>
          <ElSelect
            v-model="formData.receiver_id"
            placeholder="请选择领料人"
            filterable
            class="pickup-field-control"
            :loading="loadingStaff"
          >
            <ElOption
              v-for="staff in staffList"
              :key="staff.uid"
              :label="staff.nickname || staff.phone || `用户${staff.uid}`"
              :value="staff.uid"
            />
          </ElSelect>
        </ElFormItem>

        <div class="pickup-form-grid">
          <ElFormItem>
            <template #label>
              <span class="pickup-field-label">出库单号（系统生成）</span>
            </template>
            <div class="pickup-readonly-field">提交后生成出库单号</div>
          </ElFormItem>
          <ElFormItem>
            <template #label>
              <span class="pickup-field-label">出库时间（自动）</span>
            </template>
            <div class="pickup-readonly-field">{{ previewOutboundTime }}</div>
          </ElFormItem>
        </div>
      </ElForm>
    </div>

    <template #footer>
      <div class="pickup-dialog-footer">
        <div class="pickup-footer-tip">
          {{
            checkedIds.size > 0 ? `已选 ${checkedIds.size} 台车辆将出库` : '请从上方搜索并勾选车辆'
          }}
        </div>
        <div class="pickup-footer-actions">
          <ElButton class="pickup-btn-cancel" @click="dialogVisible = false">取消</ElButton>
          <ElButton
            type="primary"
            class="pickup-btn-confirm"
            :loading="submitting"
            :disabled="checkedIds.size === 0"
            @click="handleSubmit"
          >
            {{
              submitting
                ? '确认中…'
                : `确认领料出库${checkedIds.size > 0 ? `（${checkedIds.size}台）` : ''}`
            }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    fetchMaterialBatchOutbound,
    fetchMaterialList,
    fetchMaterialStaffList
  } from '@/api/recycle/material'
  import type { MaterialItem, MaterialStaffOption } from '@/types/recycle/material'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    visible: boolean
    preselectedIds?: number[]
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const pendingVehicles = ref<MaterialItem[]>([])
  const staffList = ref<MaterialStaffOption[]>([])
  const loadingList = ref(false)
  const loadingStaff = ref(false)
  const submitting = ref(false)
  const searchKeyword = ref('')
  const warehouseFilter = ref('')
  const checkedIds = ref<Set<number>>(new Set())

  const formData = reactive({
    receiver_id: undefined as number | undefined
  })

  const rules: FormRules = {
    receiver_id: [{ required: true, message: '请选择领料人', trigger: 'change' }]
  }

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const previewOutboundTime = computed(() => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  })

  const warehouseOptions = computed(() => {
    const set = new Set<string>()
    pendingVehicles.value.forEach((item) => {
      const name = item.warehouse_name || item.area
      if (name) set.add(name)
    })
    return Array.from(set)
  })

  const filteredVehicles = computed(() => {
    const q = searchKeyword.value.trim().toLowerCase()
    return pendingVehicles.value.filter((item) => {
      const matchSearch =
        !q ||
        [
          item.plate_no,
          item.archive_no,
          item.brand_name,
          item.model_name,
          item.location_name,
          item.owner_name,
          item.entry_no
        ].some((field) =>
          String(field || '')
            .toLowerCase()
            .includes(q)
        )
      const wh = warehouseFilter.value
      const matchWh =
        !wh ||
        item.warehouse_name === wh ||
        item.area === wh ||
        (item.location_name || '').startsWith(wh)
      return matchSearch && matchWh
    })
  })

  const checkedList = computed(() =>
    pendingVehicles.value.filter((item) => checkedIds.value.has(item.id))
  )

  const allFilteredChecked = computed(
    () =>
      filteredVehicles.value.length > 0 &&
      filteredVehicles.value.every((item) => checkedIds.value.has(item.id))
  )

  const indeterminate = computed(() => {
    if (!filteredVehicles.value.length) return false
    const checkedCount = filteredVehicles.value.filter((item) =>
      checkedIds.value.has(item.id)
    ).length
    return checkedCount > 0 && checkedCount < filteredVehicles.value.length
  })

  const hasFilter = computed(() => !!searchKeyword.value.trim() || !!warehouseFilter.value)

  function formatDate(time?: string) {
    if (!time) return '—'
    return time.slice(0, 10)
  }

  async function loadPendingVehicles() {
    loadingList.value = true
    try {
      const res = await fetchMaterialList({ status: 1, page: 1, limit: 500 })
      pendingVehicles.value = res.records
    } catch {
      pendingVehicles.value = []
    } finally {
      loadingList.value = false
    }
  }

  async function loadStaffList() {
    loadingStaff.value = true
    try {
      staffList.value = (await fetchMaterialStaffList()) || []
    } catch {
      staffList.value = []
    } finally {
      loadingStaff.value = false
    }
  }

  function initChecked() {
    checkedIds.value = new Set(props.preselectedIds || [])
  }

  function toggleItem(id: number) {
    const next = new Set(checkedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    checkedIds.value = next
  }

  function toggleAllFiltered() {
    const ids = filteredVehicles.value.map((item) => item.id)
    const next = new Set(checkedIds.value)
    if (allFilteredChecked.value) {
      ids.forEach((id) => next.delete(id))
    } else {
      ids.forEach((id) => next.add(id))
    }
    checkedIds.value = next
  }

  function clearChecked() {
    checkedIds.value = new Set()
  }

  function resetFilters() {
    searchKeyword.value = ''
    warehouseFilter.value = ''
  }

  function resetForm() {
    formData.receiver_id = undefined
    searchKeyword.value = ''
    warehouseFilter.value = ''
    checkedIds.value = new Set()
    formRef.value?.clearValidate()
  }

  async function handleSubmit() {
    if (checkedIds.value.size === 0) {
      ElMessage.warning('请至少选择一台车辆')
      return
    }
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid || !formData.receiver_id) return

    submitting.value = true
    try {
      await fetchMaterialBatchOutbound([...checkedIds.value], formData.receiver_id)
      ElMessage.success('领料出库成功')
      emit('success')
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetForm()
  }

  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        resetForm()
        initChecked()
        loadPendingVehicles()
        loadStaffList()
      }
    }
  )
</script>

<style scoped lang="scss">
  .pickup-dialog-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }

  .pickup-dialog-subtitle {
    margin-top: 2px;
    font-size: 12px;
    color: #9ca3af;
  }

  .pickup-outbound-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .pickup-tip {
    padding: 12px;
    font-size: 12px;
    line-height: 1.5;
    color: #1890ff;
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    border-radius: 8px;
  }

  .pickup-vehicle-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .pickup-section-title {
    font-size: 12px;
    font-weight: 600;
    color: #4b5563;
  }

  .pickup-vehicle-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    font-size: 12px;
    color: #9ca3af;

    strong {
      color: #1677ff;
    }
  }

  .pickup-clear-btn {
    padding: 0;
    font-size: 12px;
    color: #9ca3af;
    cursor: pointer;
    background: none;
    border: none;

    &:hover {
      color: #ff4d4f;
    }
  }

  .pickup-vehicle-filters {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .pickup-vehicle-search {
    flex: 1;
  }

  .pickup-warehouse-select {
    width: 140px;
  }

  .pickup-vehicle-list {
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .pickup-vehicle-list-header {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    font-size: 12px;
    color: #6b7280;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .pickup-select-all-label {
    cursor: pointer;
    user-select: none;
  }

  .pickup-vehicle-empty {
    padding: 40px 16px;
    color: #9ca3af;
    text-align: center;

    p {
      margin: 8px 0 0;
      font-size: 13px;
    }
  }

  .pickup-empty-icon {
    font-size: 32px;
    color: #e5e7eb;
  }

  .pickup-vehicle-items {
    max-height: 260px;
    overflow-y: auto;
  }

  .pickup-vehicle-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f3f4f6;
    transition: background 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f9fafb;
    }

    &.is-checked {
      background: #e6f7ff;
    }
  }

  .pickup-vehicle-main {
    flex: 1;
    min-width: 0;
  }

  .pickup-vehicle-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .pickup-vehicle-plate {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .pickup-vehicle-model {
    font-size: 12px;
    color: #6b7280;
  }

  .pickup-vehicle-type {
    padding: 1px 6px;
    font-size: 11px;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 4px;
  }

  .pickup-vehicle-sub {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
    font-size: 12px;
    color: #9ca3af;
  }

  .pickup-vehicle-side {
    flex-shrink: 0;
    font-size: 12px;
    color: #6b7280;
    text-align: right;
  }

  .pickup-vehicle-time {
    margin-top: 2px;
    font-size: 10px;
    color: #9ca3af;
  }

  .pickup-summary {
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .pickup-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
  }

  .pickup-summary-title {
    font-weight: 600;
    color: #374151;
  }

  .pickup-summary-count {
    font-weight: 500;
    color: #1677ff;
  }

  .pickup-summary-row {
    display: grid;
    grid-template-columns: 1fr 1.2fr 1fr;
    gap: 8px;
    padding: 2px 0;
    font-size: 12px;
    color: #6b7280;
  }

  .pickup-field-label {
    font-size: 12px;
    color: #4b5563;
  }

  .pickup-required {
    color: #ff4d4f;
  }

  .pickup-field-control {
    width: 100%;
  }

  .pickup-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .pickup-readonly-field {
    width: 100%;
    padding: 2px 12px;
    font-size: 12px;
    color: #6b7280;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .pickup-dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .pickup-footer-tip {
    font-size: 12px;
    color: #9ca3af;
  }

  .pickup-footer-actions {
    display: flex;
    gap: 12px;
  }

  .pickup-btn-cancel {
    height: 36px;
    padding: 0 16px;
    color: #4b5563;
    border: 1px solid #d1d5db;
    border-radius: 4px;
  }

  .pickup-btn-confirm {
    height: 36px;
    padding: 0 20px;
    background: #1890ff;
    border-color: #1890ff;
    border-radius: 4px;
  }
</style>

<style lang="scss">
  .pickup-outbound-dialog {
    .el-dialog__header {
      padding: 16px 24px;
      margin-right: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      max-height: calc(90vh - 140px);
      padding: 16px 24px;
      overflow-y: auto;
    }

    .el-dialog__footer {
      padding: 16px 24px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>
