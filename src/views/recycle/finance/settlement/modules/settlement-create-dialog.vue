<template>
  <ElDialog
    v-model="dialogVisible"
    width="1300px"
    align-center
    destroy-on-close
    class="fs-create-dialog"
    :show-close="false"
    @opened="onOpened"
  >
    <div
      v-if="billType"
      class="fs-create-header"
      :class="{ 'is-residual': billType === 'residual' }"
    >
      <span class="fs-create-header-title"
        >提交{{ SETTLEMENT_BILL_TYPE_CONFIG[billType].label }}申请</span
      >
      <button type="button" class="fs-create-close" @click="dialogVisible = false">
        <ArtSvgIcon icon="ri:close-line" />
      </button>
    </div>

    <div v-if="billType" class="fs-create-steps">
      <div class="fs-create-step" :class="stepClass(1)">
        <span class="fs-create-step-num">{{ step > 1 ? '✓' : '1' }}</span>
        <span>请选结算车辆</span>
      </div>
      <div class="fs-create-step-line" :class="{ 'is-done': step > 1 }" />
      <div class="fs-create-step" :class="stepClass(2)">
        <span class="fs-create-step-num">2</span>
        <span>{{ SETTLEMENT_BILL_TYPE_CONFIG[billType].label }}</span>
      </div>
    </div>

    <template v-if="step === 1 && billType">
      <div class="fs-create-toolbar">
        <ElInput
          v-model="search"
          placeholder="车牌号 / 自编号 / 车型"
          clearable
          style="width: 220px"
        />
        <ElButton @click="resetSearch">重置</ElButton>
        <span class="fs-create-selected-hint"
          >已选 <b>{{ selectedIds.size }}</b> 辆</span
        >
      </div>

      <div class="fs-create-body">
        <vxe-grid
          ref="step1GridRef"
          class="fs-create-vxe"
          v-bind="step1GridOptions"
          :data="candidates"
          :columns="step1Columns"
          :row-config="{ isHover: true, keyField: 'id' }"
          :checkbox-config="step1CheckboxConfig"
          :row-class-name="step1RowClassName"
          @checkbox-change="onStep1CheckboxChange"
          @checkbox-all="onStep1CheckboxAll"
        >
          <template #plate_no="{ row }">
            <span class="fs-plate">{{ row.plate_no }}</span>
          </template>
          <template #entry_time="{ row }">{{ formatEntryTime(row.entry_time) }}</template>
          <template #weight="{ row }">{{ kgToTon(row.weight) }}</template>
          <template #qc_weight="{ row }">{{ kgToTon(row.qc_weight) }}</template>
          <template #missing_deduction="{ row }">{{
            computeTotals(row).missingDeduction
          }}</template>
          <template #actual_pay_amount="{ row }">{{
            computeTotals(row).actualPayAmount.toFixed(2)
          }}</template>
          <template #service_fee_total="{ row }">{{
            computeTotals(row).serviceFeeTotal.toFixed(2)
          }}</template>
          <template #single_total="{ row }">
            <span class="fs-amount">{{ computeTotals(row).autoTotal.toFixed(2) }}</span>
          </template>
          <template #auto_total_header>
            <span class="fs-vxe-blue-header">单车总金额(元)</span>
          </template>
        </vxe-grid>
      </div>
    </template>

    <template v-else-if="step === 2 && billType">
      <div class="fs-create-meta">
        <span>
          申请类型：
          <span
            class="fs-tag"
            :style="{
              color: SETTLEMENT_BILL_TYPE_CONFIG[billType].color,
              background: SETTLEMENT_BILL_TYPE_CONFIG[billType].bg
            }"
            >{{ SETTLEMENT_BILL_TYPE_CONFIG[billType].label }}</span
          >
        </span>
        <span
          >车辆数量：<b>{{ selectedVehicles.length }} 辆</b></span
        >
        <span
          >预计合计：<b class="fs-amount">¥ {{ grandTotal.toFixed(2) }}</b></span
        >
      </div>

      <div class="fs-create-body">
        <vxe-grid
          class="fs-create-vxe"
          v-bind="step2GridOptions"
          :data="selectedVehicles"
          :columns="step2Columns"
          :footer-method="step2FooterMethod"
          :footer-span-method="step2FooterSpanMethod"
        >
          <template #plate_no="{ row }">
            <span class="fs-plate">{{ row.plate_no }}</span>
          </template>
          <template #entry_time="{ row }">{{ formatEntryTime(row.entry_time) }}</template>
          <template #weight="{ row }">{{ kgToTon(row.weight) }}</template>
          <template #self_delivery_subsidy="{ row }">{{
            row.self_delivery_subsidy || '—'
          }}</template>
          <template #edit_actual_weight="{ row }">
            <div class="fs-edit-cell">
              <ElInputNumber
                :model-value="
                  getEditNum(row, 'actual_weight', Number(row.qc_weight || row.weight || 0) / 1000)
                "
                :controls="false"
                size="small"
                @update:model-value="(val) => setNum(row.id, 'actual_weight', Number(val))"
              />
            </div>
          </template>
          <template #edit_missing_compensation_pos="{ row }">
            <div class="fs-edit-cell">
              <ElInputNumber
                :model-value="getEditNum(row, 'missing_compensation_pos', 0)"
                :controls="false"
                size="small"
                @update:model-value="
                  (val) => setNum(row.id, 'missing_compensation_pos', Number(val))
                "
              />
            </div>
          </template>
          <template #edit_residual_value="{ row }">
            <div class="fs-edit-cell">
              <ElInputNumber
                :model-value="getEditNum(row, 'residual_unit_price', row.residual_value)"
                :controls="false"
                size="small"
                @update:model-value="(val) => setNum(row.id, 'residual_unit_price', Number(val))"
              />
            </div>
          </template>
          <template #edit_missing_parts="{ row }">
            <div class="fs-edit-cell">
              <ElInputNumber
                :model-value="getEditNum(row, 'missing_parts', 0)"
                :controls="false"
                size="small"
                @update:model-value="(val) => setNum(row.id, 'missing_parts', Number(val))"
              />
            </div>
          </template>
          <template #edit_deduction="{ row }">
            <div class="fs-edit-cell">
              <ElInputNumber
                :model-value="getEditNum(row, 'deduction', 0)"
                :controls="false"
                size="small"
                @update:model-value="(val) => setNum(row.id, 'deduction', Number(val))"
              />
            </div>
          </template>
          <template #missing_deduction="{ row }">
            <span
              class="fs-exempt-badge"
              :class="computeTotals(row).missingDeduction > 0 ? 'is-yes' : 'is-no'"
            >
              {{ computeTotals(row).missingDeduction.toFixed(2) }}
            </span>
          </template>
          <template #edit_actual_pay_amount="{ row }">
            <div class="fs-edit-cell">
              <ElInputNumber
                :model-value="getActualPayAmount(row)"
                :controls="false"
                size="small"
                @update:model-value="(val) => setNum(row.id, 'actual_pay_amount', Number(val))"
              />
            </div>
          </template>
          <template #service_fee_total="{ row }">{{
            computeTotals(row).serviceFeeTotal.toFixed(2)
          }}</template>
          <template #edit_total="{ row }">
            <div class="fs-edit-cell fs-amount">
              <ElInputNumber
                :model-value="getVehicleTotal(row)"
                :controls="false"
                size="small"
                @update:model-value="(val) => setNum(row.id, 'single_total', Number(val))"
              />
            </div>
          </template>
          <template #edit_modify_remark="{ row }">
            <div class="fs-edit-cell">
              <ElInput
                :model-value="getStr(row)"
                size="small"
                @update:model-value="(val) => setStr(row.id, val)"
              />
            </div>
          </template>
          <template #remark>—</template>
          <template #action="{ row }">
            <button type="button" class="fs-action-btn is-remove" @click="removeVehicle(row.id)">
              移除
            </button>
          </template>
          <template #auto_total_header>
            <span class="fs-vxe-blue-header">单车总金额(元)</span>
          </template>
        </vxe-grid>
      </div>
    </template>

    <template #footer>
      <div v-if="step === 1 && billType" class="fs-create-footer-inner">
        <span />
        <div>
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" @click="goStep2"
            >下一步（已选 {{ selectedIds.size }} 辆）</ElButton
          >
        </div>
      </div>
      <div v-else-if="step === 2 && billType" class="fs-create-footer-inner">
        <ElButton @click="step = 1">← 返回选车</ElButton>
        <div>
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" :loading="submitting" @click="handleSubmit"
            >确认提交申请</ElButton
          >
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { VxeGridInstance } from 'vxe-table'
  import {
    fetchSettlementBillCreate,
    fetchSettlementVehicleCandidates
  } from '@/api/recycle/finance-settlement'
  import type { SettlementBillType } from '@/types/recycle/finance/settlement/finance-settlement'
  import { SETTLEMENT_BILL_TYPE_CONFIG } from '@/types/recycle/finance/settlement/finance-settlement'
  import type {
    SettlementVehicleCandidate,
    SettlementCreateVehiclePayload,
    SettlementVehicleEdit
  } from '@/types/recycle/finance/settlement/finance-settlement-candidate'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    buildCreateStep1Columns,
    buildCreateStep2Columns,
    getCreateStep2TotalColIndex
  } from './settlement-grid-columns'

  const props = defineProps<{
    visible: boolean
    billType: SettlementBillType | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  /** 步骤：1 选车 → 2 确认金额 */
  const step = ref<1 | 2>(1)
  function stepClass(s: number) {
    if (step.value === s) return 'is-active'
    if (step.value > s) return 'is-done'
    return ''
  }

  /** 是否服务费结算（影响列与金额计算） */
  const isService = computed(() => props.billType === 'service_fee')

  /** 候选车辆搜索与列表 */
  const search = ref('')
  const candidates = ref<SettlementVehicleCandidate[]>([])
  async function loadCandidates() {
    const res = await fetchSettlementVehicleCandidates({
      keyword: search.value.trim(),
      page: 1,
      limit: 200
    })
    candidates.value = res.list || []
  }
  function resetSearch() {
    search.value = ''
    loadCandidates()
  }
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(search, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => loadCandidates(), 300)
  })

  /** 勾选车辆 + Step1 表格勾选同步 */
  const selectedIds = ref(new Set<number>())
  const step1GridRef = ref<VxeGridInstance>()
  const selectedVehicles = computed(() =>
    candidates.value.filter((v) => selectedIds.value.has(v.id))
  )
  function goStep2() {
    if (!selectedIds.value.size) {
      ElMessage.warning('请至少选择一辆车')
      return
    }
    step.value = 2
  }
  function step1RowClassName({ row }: { row: SettlementVehicleCandidate }) {
    return selectedIds.value.has(row.id) ? 'row--selected' : ''
  }
  function onStep1CheckboxChange({
    row,
    checked
  }: {
    row: SettlementVehicleCandidate
    checked: boolean
  }) {
    const next = new Set(selectedIds.value)
    if (checked) next.add(row.id)
    else next.delete(row.id)
    selectedIds.value = next
  }
  function onStep1CheckboxAll({ checked }: { checked: boolean }) {
    toggleAll(checked)
  }
  function toggleAll(val: boolean | string | number) {
    selectedIds.value = val ? new Set(candidates.value.map((v) => v.id)) : new Set()
    nextTick(() => syncStep1Checkbox())
  }
  function syncStep1Checkbox() {
    const grid = step1GridRef.value
    if (!grid) return
    grid.setAllCheckboxRow(false)
    candidates.value.forEach((row) => {
      if (selectedIds.value.has(row.id)) {
        grid.setCheckboxRow(row, true)
      }
    })
  }
  function removeVehicle(id: number) {
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
    if (!next.size) step.value = 1
  }

  /** Step2 可编辑字段（按车辆 id 存草稿） */
  const edits = ref<Record<number, SettlementVehicleEdit>>({})
  function getEditNum(
    v: SettlementVehicleCandidate,
    key: keyof SettlementVehicleEdit,
    fallback: number
  ) {
    const value = edits.value[v.id]?.[key]
    return typeof value === 'number' ? value : fallback
  }
  function getStr(v: SettlementVehicleCandidate) {
    return edits.value[v.id]?.modify_remark || ''
  }
  function setNum(vid: number, key: keyof SettlementVehicleEdit, val: number) {
    edits.value = { ...edits.value, [vid]: { ...edits.value[vid], [key]: val } }
  }
  function setStr(vid: number, val: string) {
    edits.value = { ...edits.value, [vid]: { ...edits.value[vid], modify_remark: val } }
  }

  /** 单车金额推算（缺件免赔、残值实付、服务费等） */
  function computeTotals(v: SettlementVehicleCandidate) {
    const actualWeightTon = getEditNum(
      v,
      'actual_weight',
      Number(v.qc_weight || v.weight || 0) / 1000
    )
    const residualUnitPrice = getEditNum(v, 'residual_unit_price', Number(v.residual_value || 0))
    const missingParts = getEditNum(v, 'missing_parts', 0)
    const deduction = getEditNum(v, 'deduction', 0)
    const missingDeduction = missingParts * 40
    const residualAmount = actualWeightTon * residualUnitPrice
    const actualPayAmount = Math.max(0, residualAmount - missingDeduction - deduction)
    const serviceFeeTotal = actualWeightTon * Number(v.service_fee_unit_price || 0)
    const autoTotal =
      Number(v.self_delivery_subsidy || 0) + (isService.value ? serviceFeeTotal : actualPayAmount)
    return {
      missingDeduction,
      residualAmount,
      actualPayAmount,
      serviceFeeTotal,
      autoTotal
    }
  }
  function getActualPayAmount(v: SettlementVehicleCandidate) {
    return getEditNum(v, 'actual_pay_amount', computeTotals(v).actualPayAmount)
  }
  function getVehicleTotal(v: SettlementVehicleCandidate) {
    return getEditNum(v, 'single_total', computeTotals(v).autoTotal)
  }
  const grandTotal = computed(() =>
    selectedVehicles.value.reduce((s, v) => s + getVehicleTotal(v), 0)
  )

  /** 表格列与配置 */
  const step1Columns = computed(() => buildCreateStep1Columns(isService.value))
  const step2Columns = computed(() => buildCreateStep2Columns(isService.value))
  const step2TotalColIndex = computed(() => getCreateStep2TotalColIndex(isService.value))
  const step1CheckboxConfig = computed(() => ({
    highlight: true,
    trigger: 'row' as const,
    checkRowKeys: [...selectedIds.value]
  }))
  const step1GridOptions = {
    border: true,
    size: 'mini',
    align: 'center',
    headerAlign: 'center',
    showOverflow: 'tooltip',
    autoResize: true,
    height: '500px',
    scrollX: { enabled: true, gt: 0 },
    columnConfig: { resizable: false }
  }
  const step2GridOptions = {
    border: true,
    size: 'mini',
    align: 'center',
    headerAlign: 'center',
    showOverflow: 'tooltip',
    autoResize: true,
    height: '500px',
    scrollX: { enabled: true, gt: 0 },
    columnConfig: { resizable: false },
    showFooter: true,
    footerRowClassName: ({ rowIndex }: { rowIndex: number }) =>
      rowIndex === 0 ? 'fs-total-footer' : 'fs-tip-footer'
  }
  function step2FooterMethod({ columns }: { columns: { field?: string }[] }) {
    const totalIdx = step2TotalColIndex.value
    const totalRow = columns.map((col, idx) => {
      if (idx === 0) return '合计总金额'
      if (col.field === 'single_total') return grandTotal.value.toFixed(2)
      if (idx > 0 && idx < totalIdx) return ''
      return ''
    })
    const tipRow = columns.map((_, idx) =>
      idx === 0 ? '★ 黄色字段可手动填写，其他字段只读或自动计算' : ''
    )
    return [totalRow, tipRow]
  }
  function step2FooterSpanMethod({
    columnIndex,
    rowIndex
  }: {
    columnIndex: number
    rowIndex: number
  }) {
    const totalIdx = step2TotalColIndex.value
    const colCount = step2Columns.value.length
    if (rowIndex === 0) {
      if (columnIndex === 0) return { rowspan: 1, colspan: totalIdx }
      if (columnIndex > 0 && columnIndex < totalIdx) return { rowspan: 0, colspan: 0 }
      if (columnIndex === totalIdx + 1) return { rowspan: 1, colspan: colCount - totalIdx - 1 }
      if (columnIndex > totalIdx + 1) return { rowspan: 0, colspan: 0 }
    }
    if (rowIndex === 1) {
      if (columnIndex === 0) return { rowspan: 1, colspan: colCount }
      return { rowspan: 0, colspan: 0 }
    }
    return { rowspan: 1, colspan: 1 }
  }

  function formatEntryTime(value: number | string) {
    if (!value) return '—'
    const date = new Date(typeof value === 'number' ? value * 1000 : value)
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('zh-CN')
  }
  function kgToTon(value: number) {
    return (Number(value || 0) / 1000).toFixed(3)
  }

  /** 组装创建接口车辆 payload */
  function buildVehicles(): SettlementCreateVehiclePayload[] {
    return selectedVehicles.value.map((v) => {
      const c = computeTotals(v)
      return {
        vehicle_id: v.id,
        plate_no: v.plate_no,
        model: v.model,
        vehicle_type: v.vehicle_type,
        vehicle_no: v.vehicle_no,
        settlement_method: v.settlement_method,
        entry_time: v.entry_time,
        prepared_weight: Number(v.weight || 0) / 1000,
        actual_weight: getEditNum(v, 'actual_weight', Number(v.qc_weight || v.weight || 0) / 1000),
        tare_weight: Number(v.tare_weight || 0) / 1000,
        deduction_weight: Number(v.deduction_weight || 0) / 1000,
        self_delivery_subsidy: Number(v.self_delivery_subsidy || 0),
        missing_compensation_pos: getEditNum(v, 'missing_compensation_pos', 0),
        residual_unit_price: getEditNum(v, 'residual_unit_price', Number(v.residual_value || 0)),
        missing_parts: getEditNum(v, 'missing_parts', 0),
        deduction: getEditNum(v, 'deduction', 0),
        missing_deduction: c.missingDeduction,
        residual_amount: c.residualAmount,
        actual_pay_amount: getActualPayAmount(v),
        service_fee_unit_price: Number(v.service_fee_unit_price || 0),
        service_fee_total: c.serviceFeeTotal,
        single_total: getVehicleTotal(v),
        total_amount: getVehicleTotal(v)
      }
    })
  }

  /** 打开弹窗时重置并拉候选车 */
  async function onOpened() {
    step.value = 1
    search.value = ''
    selectedIds.value = new Set()
    edits.value = {}
    await loadCandidates()
    nextTick(() => syncStep1Checkbox())
  }

  /** 提交结算单申请 */
  const submitting = ref(false)
  async function handleSubmit() {
    if (!props.billType || !selectedVehicles.value.length) return
    submitting.value = true
    try {
      await fetchSettlementBillCreate({
        settlement_type: props.billType,
        vehicles: buildVehicles(),
        contract_no: '',
        remark: ''
      })
      dialogVisible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  @use './settlement-dialog';
</style>
