<template>
  <ElDialog
    v-model="dialogVisible"
    :show-close="true"
    width="92vw"
    top="4vh"
    destroy-on-close
    class="fs-detail-dialog"
    @opened="loadDetail"
  >
    <template #header>
      <div v-if="detail" class="fs-detail-header">
        <span class="fs-detail-title">{{ detail.settlement_type }}详情</span>
        <span
          class="fs-type-tag"
          :style="{
            color: SETTLEMENT_BILL_TYPE_CONFIG[detail.settlement_type].color,
            background: SETTLEMENT_BILL_TYPE_CONFIG[detail.settlement_type].bg
          }"
        >
          {{ detail.settlement_type }}
        </span>
        <span
          class="fs-status-tag"
          :style="{
            color: SETTLEMENT_BILL_STATUS_CONFIG[detail.status].color,
            background: SETTLEMENT_BILL_STATUS_CONFIG[detail.status].bg
          }"
        >
          {{ detail.status }}
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
          <span>收费类型：{{ detail.charge_type }}</span>
          <span
            >结算总额：<b class="fs-amount">¥ {{ detail.amount.toLocaleString() }}</b></span
          >
          <span v-if="detail.payment_voucher">支付凭证：{{ detail.payment_voucher }}</span>
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
          <table class="fs-detail-table">
            <thead>
              <tr>
                <th>入库日期</th>
                <th>自编号</th>
                <th>车牌号</th>
                <th>入库单号</th>
                <th v-if="!isService">车辆类型</th>
                <th>结算类型</th>
                <th>整备质量(吨)</th>
                <th>实际重量(吨)</th>
                <th>自送费补贴</th>
                <th>缺补件吨位</th>
                <th>残值单价</th>
                <th>实际支付残值</th>
                <th v-if="isService">服务费(元/吨)</th>
                <th v-if="isService">服务费合计</th>
                <th>单车总金额</th>
                <th>审核状态</th>
                <th>质检查验</th>
                <th>车辆附件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredItems.length">
                <td :colspan="isService ? 17 : 16" class="fs-empty">暂无数据</td>
              </tr>
              <tr v-for="item in filteredItems" :key="item.seq">
                <td>{{ item.entry_date }}</td>
                <td>{{ item.self_no }}</td>
                <td class="fs-plate">{{ item.plate }}</td>
                <td>{{ item.inbound_no || '—' }}</td>
                <td v-if="!isService">{{ item.vehicle_type }}</td>
                <td>{{ item.settle_type }}</td>
                <td>{{ item.std_weight.toFixed(3) }}</td>
                <td>{{ item.actual_weight.toFixed(3) }}</td>
                <td>{{ item.self_delivery_subsidy || '—' }}</td>
                <td>{{ item.missing_part_tonnage || '—' }}</td>
                <td>{{ item.residual_unit_price }}</td>
                <td>{{ item.expected_residual.toFixed(2) }}</td>
                <td v-if="isService">{{ item.service_fee_per_ton ?? '—' }}</td>
                <td v-if="isService">{{ item.service_fee_total?.toFixed(2) ?? '—' }}</td>
                <td class="fs-amount">{{ item.total_per_vehicle.toFixed(2) }}</td>
                <td>{{ item.review_status || '—' }}</td>
                <td>
                  <ElButton link type="primary" @click="showQcDemo">查看</ElButton>
                </td>
                <td>
                  <ElButton link type="warning" @click="showAttachDemo">查看</ElButton>
                </td>
              </tr>
              <tr v-if="filteredItems.length" class="fs-total-row">
                <td :colspan="isService ? 14 : 13" class="fs-total-label">
                  合计（{{ filteredItems.length }} 辆）
                </td>
                <td class="fs-amount">{{
                  filteredItems.reduce((s, r) => s + r.total_per_vehicle, 0).toFixed(2)
                }}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchSettlementBillDetail } from '@/api/recycle/finance-settlement.mock'
  import type { SettlementBillItem } from '@/types/recycle/finance-settlement'
  import {
    SETTLEMENT_BILL_STATUS_CONFIG,
    SETTLEMENT_BILL_TYPE_CONFIG
  } from '@/types/recycle/finance-settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  const props = defineProps<{
    visible: boolean
    billId: string | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const loading = ref(false)
  const detail = ref<SettlementBillItem | null>(null)
  const itemKeyword = ref('')

  const isService = computed(() => detail.value?.settlement_type === '服务费结算单')

  const filteredItems = computed(() => {
    const items = detail.value?.items || []
    const q = itemKeyword.value.trim()
    if (!q) return items
    return items.filter(
      (i) => i.plate.includes(q) || i.self_no.includes(q) || i.vehicle_model.includes(q)
    )
  })

  async function loadDetail() {
    if (!props.billId) return
    loading.value = true
    itemKeyword.value = ''
    try {
      detail.value = await fetchSettlementBillDetail(props.billId)
    } finally {
      loading.value = false
    }
  }

  function showQcDemo() {
    ElMessage.info('质检查验演示数据')
  }

  function showAttachDemo() {
    ElMessage.info('附件演示数据')
  }

  function showExportDemo() {
    ElMessage.info('演示数据')
  }
</script>

<style scoped lang="scss">
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

  .fs-amount {
    font-weight: 700;
    color: #4169ff !important;
  }

  .fs-detail-toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  .fs-detail-table-wrap {
    max-height: 52vh;
    padding: 0 16px 16px;
    overflow: auto;
  }

  .fs-detail-table {
    width: 100%;
    min-width: 1200px;
    font-size: 12px;
    border-collapse: collapse;

    th,
    td {
      padding: 8px 6px;
      text-align: center;
      white-space: nowrap;
      border: 1px solid #e5e7eb;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 1;
      font-weight: 500;
      color: #4b5563;
      background: #f9fafb;
    }

    .fs-plate {
      font-weight: 600;
      color: #4169ff;
    }

    .fs-empty {
      padding: 40px;
      color: #9ca3af;
    }

    .fs-total-row {
      background: #fafafa;
    }

    .fs-total-label {
      font-weight: 700;
      text-align: right;
    }
  }
</style>

<style lang="scss">
  .fs-detail-dialog.el-dialog {
    max-width: 1300px;
  }

  .fs-detail-dialog .el-dialog__body {
    padding: 0;
  }
</style>
