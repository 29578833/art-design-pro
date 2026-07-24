<template>
  <ElDialog
    v-model="dialogVisible"
    :show-close="true"
    width="1100px"
    align-center
    destroy-on-close
    class="fs-detail-dialog"
    @opened="loadDetail"
  >
    <template #header>
      <div v-if="detail" class="fs-detail-header">
        <span class="fs-detail-title">{{ detail.settlement_type_text }}详情</span>
        <span
          class="fs-type-tag"
          :style="{
            color: SETTLEMENT_BILL_TYPE_CONFIG[detail.settlement_type].color,
            background: SETTLEMENT_BILL_TYPE_CONFIG[detail.settlement_type].bg
          }"
        >
          {{ detail.settlement_type_text }}
        </span>
        <span
          class="fs-status-tag"
          :style="{
            color: SETTLEMENT_BILL_STATUS_CONFIG[detail.settlement_status].color,
            background: SETTLEMENT_BILL_STATUS_CONFIG[detail.settlement_status].bg
          }"
        >
          {{ detail.settlement_status_text }}
        </span>
      </div>
    </template>

    <div v-loading="loading" class="fs-detail-body">
      <template v-if="detail">
        <div class="fs-summary-bar">
          <span
            >合同编号：<b>{{ detail.contract_no }}</b></span
          >
          <span>申请人：{{ detail.applicant }}</span>
          <span>申请时间：{{ detail.apply_time }}</span>
          <span>收费类型：{{ detail.charge_type_text }}</span>
          <span
            >结算总额：<b class="fs-amount"
              >¥ {{ Number(detail.final_price || 0).toLocaleString() }}</b
            ></span
          >
          <span v-if="proofUrl" class="fs-proof-row">
            支付凭证：
            <ElImage
              v-if="proofIsImage"
              :src="proofUrl"
              fit="cover"
              class="fs-proof-thumb"
              :preview-src-list="[proofUrl]"
              preview-teleported
            />
            <a v-else :href="proofUrl" target="_blank" rel="noopener" class="fs-proof-link">
              查看文件
            </a>
          </span>
        </div>

        <div class="fs-detail-toolbar">
          <ElInput
            v-model="itemKeyword"
            placeholder="车牌号 / 自编号 / 车型搜索"
            clearable
            style="width: 220px"
          />
          <ElButton @click="itemKeyword = ''">重置</ElButton>
          <ElButton @click="showExportDemo">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel
          </ElButton>
        </div>

        <div class="fs-detail-table-wrap">
          <vxe-grid
            class="fs-detail-vxe"
            v-bind="detailGridOptions"
            :data="filteredItems"
            :columns="detailColumns"
            :footer-method="detailFooterMethod"
            :footer-span-method="detailFooterSpanMethod"
          >
            <template #plate_no="{ row }">
              <span class="fs-plate">{{ row.plate_no }}</span>
            </template>
            <template #warehouse_no="{ row }">{{ row.warehouse_no || '—' }}</template>
            <template #prepared_weight_ton="{ row }">{{ row.prepared_weight_ton }}</template>
            <template #actual_weight_ton="{ row }">{{ row.actual_weight_ton }}</template>
            <template #self_delivery_subsidy="{ row }">{{
              row.self_delivery_subsidy || '—'
            }}</template>
            <template #missing_compensation_pos_ton="{ row }">{{
              row.missing_compensation_pos_ton || '—'
            }}</template>
            <template #missing_parts="{ row }">{{ row.missing_parts || '—' }}</template>
            <template #missing_deduction="{ row }">
              <span
                class="fs-exempt-badge"
                :class="Number(row.missing_deduction) > 0 ? 'is-yes' : 'is-no'"
              >
                {{ row.missing_deduction || '—' }}
              </span>
            </template>
            <template #actual_pay_amount="{ row }">{{
              Number(row.actual_pay_amount || 0).toFixed(2)
            }}</template>
            <template #service_fee_unit_price="{ row }">{{
              row.service_fee_unit_price ?? '—'
            }}</template>
            <template #service_fee_total="{ row }">{{
              row.service_fee_total?.toFixed(2) ?? '—'
            }}</template>
            <template #modify_remark="{ row }">{{ row.modify_remark || '—' }}</template>
            <template #total_amount="{ row }">
              <span class="fs-amount">{{ Number(row.total_amount || 0).toFixed(2) }}</span>
            </template>
            <template #remark="{ row }">{{ row.remark || '—' }}</template>
            <template #audit_status_text="{ row }">
              <span class="fs-review-badge" :class="reviewBadgeClass(row.audit_status)">
                {{ row.audit_status_text || '—' }}
              </span>
            </template>
            <template #reject_reason="{ row }">{{ row.reject_reason || '—' }}</template>
            <template #audit_user_name="{ row }">{{ row.audit_user_name || '—' }}</template>
            <template #audit_time="{ row }">{{ row.audit_time || '—' }}</template>
            <template #apply_remark="{ row }">{{ row.apply_remark || '—' }}</template>
            <template #qc_btn="{ row }">
              <button type="button" class="fs-action-btn is-qc" @click="openQcReport(row)">
                <ArtSvgIcon icon="ri:clipboard-line" />
                查看
              </button>
            </template>
            <template #attach_btn="{ row }">
              <button type="button" class="fs-action-btn is-attach" @click="openVehicleAttach(row)">
                <ArtSvgIcon icon="ri:attachment-line" />
                查看
              </button>
            </template>
            <template #auto_total_header>
              <span class="fs-vxe-blue-header">单车总金额(元)</span>
            </template>
            <template #empty>
              <span class="text-gray-400">暂无数据</span>
            </template>
          </vxe-grid>
        </div>
      </template>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>

  <!-- 质检查验报告 -->
  <QualityReportDialog v-model:visible="qcVisible" :check-id="qcCheckId" />

  <!-- 车辆附件预览 -->
  <OrderAttachmentPreviewDialog
    v-model="attachVisible"
    :attachments="attachList"
    :order-id="attachOrderId"
  />
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { fetchSettlementBillDetail } from '@/api/recycle/finance-settlement'
  import { fetchOrderDetail } from '@/api/recycle/order'
  import { fetchQualityByOrder } from '@/api/recycle/quality'
  import type {
    SettlementBillItem,
    SettlementBillVehicle
  } from '@/types/recycle/finance/settlement/finance-settlement'
  import {
    SETTLEMENT_BILL_STATUS_CONFIG,
    SETTLEMENT_BILL_TYPE_CONFIG
  } from '@/types/recycle/finance/settlement/finance-settlement'
  import {
    resolveVehicleAttachments,
    type OrderAttachment
  } from '@/types/recycle/recovery/orders/order'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import QualityReportDialog from '@/views/recycle/factory/quality/modules/quality-report-dialog.vue'
  import OrderAttachmentPreviewDialog from '@/views/recycle/recovery/orders/modules/order-attachment-preview-dialog.vue'
  import { buildDetailColumns, getDetailTotalColIndex } from './settlement-grid-columns'

  const props = defineProps<{
    visible: boolean
    billId: number | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
  }>()

  /** 弹窗显隐 */
  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  /** 明细表内搜索关键词 */
  const itemKeyword = ref('')
  watch(
    () => props.visible,
    (visible) => {
      if (visible) itemKeyword.value = ''
    }
  )

  /** 详情数据加载 */
  const loading = ref(false)
  const detail = ref<SettlementBillItem | null>(null)
  const detailItems = ref<SettlementBillVehicle[]>([])

  /** 支付凭证地址（图片可预览，非图片则外链打开） */
  const proofUrl = computed(() =>
    String(detail.value?.proof_image || detail.value?.settlement_proof || '').trim()
  )
  const proofIsImage = computed(() => {
    if (!proofUrl.value) return false
    return !/\.pdf(\?|$)/i.test(proofUrl.value)
  })

  async function loadDetail() {
    if (!props.billId) return
    loading.value = true
    try {
      const res = await fetchSettlementBillDetail(props.billId, {
        keyword: itemKeyword.value.trim()
      })
      detail.value = res.settlement
      detailItems.value = res.list || []
    } finally {
      loading.value = false
    }
  }

  /** 关键词变更防抖后重新拉详情 */
  let keywordTimer: ReturnType<typeof setTimeout> | undefined
  watch(itemKeyword, () => {
    if (!props.visible) return
    clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => loadDetail(), 300)
  })

  /** 表格列：服务费 / 残值列差异 */
  const isService = computed(() => detail.value?.settlement_type === 'service_fee')
  const detailColumns = computed(() => buildDetailColumns(isService.value))
  const detailTotalColIndex = computed(() => getDetailTotalColIndex())
  const detailGridOptions = {
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
    footerRowClassName: 'fs-detail-total-footer',
    emptyText: '暂无数据'
  }

  /** 前端再过滤一层（接口已带 keyword，兜底） */
  const filteredItems = computed(() => {
    const items = detailItems.value
    const q = itemKeyword.value.trim()
    if (!q) return items
    return items.filter(
      (i) => i.plate_no.includes(q) || i.vehicle_no.includes(q) || i.model.includes(q)
    )
  })
  const itemsTotal = computed(() =>
    filteredItems.value.reduce((s, r) => s + Number(r.total_amount || 0), 0).toFixed(2)
  )

  /** 审核状态徽标样式 */
  function reviewBadgeClass(status?: string) {
    if (status === 'pass') return 'is-pass'
    if (status === 'reject') return 'is-reject'
    if (status === 'pending') return 'is-pending'
    return 'is-none'
  }

  /** 表尾合计行 */
  function detailFooterMethod({ columns }: { columns: { field?: string }[] }) {
    if (!filteredItems.value.length) return []
    const totalIdx = detailTotalColIndex.value
    return [
      columns.map((col, idx) => {
        if (idx === 0) return `合计（${filteredItems.value.length} 辆）`
        if (col.field === 'total_amount') return itemsTotal.value
        if (idx > 0 && idx < totalIdx) return ''
        return ''
      })
    ]
  }
  function detailFooterSpanMethod({
    columnIndex,
    rowIndex
  }: {
    columnIndex: number
    rowIndex: number
  }) {
    if (rowIndex !== 0 || !filteredItems.value.length) return { rowspan: 1, colspan: 1 }
    const totalIdx = detailTotalColIndex.value
    const colCount = detailColumns.value.length
    const tailCols = colCount - totalIdx - 1
    if (columnIndex === 0) return { rowspan: 1, colspan: totalIdx }
    if (columnIndex > 0 && columnIndex < totalIdx) return { rowspan: 0, colspan: 0 }
    if (columnIndex === totalIdx + 1 && tailCols > 0) {
      return { rowspan: 1, colspan: tailCols }
    }
    if (columnIndex > totalIdx + 1) return { rowspan: 0, colspan: 0 }
    return { rowspan: 1, colspan: 1 }
  }

  /** 质检查验报告弹窗 */
  const qcVisible = ref(false)
  const qcCheckId = ref(0)
  async function openQcReport(row: SettlementBillVehicle) {
    const orderId = Number(row.order_id || 0)
    if (!orderId) {
      ElMessage.warning('缺少订单信息，无法查看质检报告')
      return
    }
    const qc = await fetchQualityByOrder(orderId, row.vehicle_id)
    if (!qc?.id) {
      ElMessage.warning('暂无质检报告')
      return
    }
    qcCheckId.value = qc.id
    qcVisible.value = true
  }

  /** 车辆附件预览弹窗 */
  const attachVisible = ref(false)
  const attachList = ref<OrderAttachment[]>([])
  const attachOrderId = ref<number>()
  async function openVehicleAttach(row: SettlementBillVehicle) {
    const orderId = Number(row.order_id || 0)
    if (!orderId) {
      ElMessage.warning('缺少订单信息，无法查看附件')
      return
    }
    const detail = await fetchOrderDetail(orderId)
    const vehicles = detail.vehicles || []
    const idx = vehicles.findIndex((v) => v.id === row.vehicle_id)
    attachList.value = resolveVehicleAttachments(detail, idx >= 0 ? idx : 0)
    if (!attachList.value.length) {
      ElMessage.warning('暂无车辆附件')
      return
    }
    attachOrderId.value = orderId
    attachVisible.value = true
  }

  /** 导出当前明细车辆 */
  function showExportDemo() {
    if (!filteredItems.value.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    const sheet = XLSX.utils.json_to_sheet(filteredItems.value)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, '结算车辆')
    XLSX.writeFile(book, `结算车辆_${detail.value?.settlement_no || props.billId}.xlsx`)
  }
</script>

<style scoped lang="scss">
  @use './settlement-dialog';

  .fs-detail-header {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .fs-detail-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .fs-type-tag,
  .fs-status-tag {
    padding: 2px 8px;
    font-size: 12px;
    border-radius: 12px;
  }

  .fs-summary-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    align-items: center;
    padding: 10px 16px;
    font-size: 13px;
    color: #6b7280;
    background: #fafafa;
    border-bottom: 1px solid #f3f4f6;

    b {
      font-weight: 600;
      color: #374151;
    }
  }

  .fs-proof-row {
    display: inline-flex;
    gap: 8px;
    align-items: center;
  }

  .fs-proof-thumb {
    width: 48px;
    height: 48px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }

  .fs-proof-link {
    color: #4169ff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .fs-amount {
    font-weight: 700;
    color: #4169ff !important;
  }

  .fs-detail-toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .fs-detail-table-wrap {
    width: 100%;
    // min-width: 0;
    // padding: 0 16px 16px;
    overflow: hidden;
  }
</style>

<style lang="scss">
  .fs-detail-dialog.el-dialog {
    max-width: 1300px;
  }

  .fs-detail-dialog .el-dialog__body {
    height: 600px;
    padding: 0;
  }
</style>
