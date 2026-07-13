<template>
  <ElDialog
    v-model="dialogVisible"
    width="520px"
    align-center
    destroy-on-close
    @closed="handleClosed"
  >
    <template #header>
      <div>
        <div class="ob-detail-title">出库单详情</div>
        <div class="ob-detail-sub">{{ record?.exit_no || '—' }}</div>
      </div>
    </template>

    <div v-if="record" class="ob-detail-body">
      <div class="ob-detail-badges">
        <span class="ob-badge" :style="typeStyle">{{ record.exit_type_text || '—' }}</span>
        <span class="ob-badge" :style="statusStyle">{{ record.status_text || '—' }}</span>
      </div>

      <div class="ob-detail-rows">
        <div v-for="row in detailRows" :key="row.label" class="ob-detail-row">
          <span class="label">{{ row.label }}</span>
          <span class="value">{{ row.value }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
      <ElButton
        v-if="record?.status === 'pending_approval'"
        type="primary"
        :loading="acting"
        @click="handleApprove"
      >
        审批通过
      </ElButton>
      <ElButton
        v-if="record?.status === 'approved'"
        type="warning"
        :loading="acting"
        @click="handleComplete"
      >
        确认出库
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import { fetchSaleOutboundApprove, fetchSaleOutboundComplete } from '@/api/recycle/sale-outbound'
  import type { SaleOutboundItem, SaleOutboundType } from '@/types/recycle/sale-outbound'
  import {
    SALE_OUTBOUND_STATUS_CONFIG,
    SALE_OUTBOUND_TYPE_CONFIG
  } from '@/types/recycle/sale-outbound'

  interface Props {
    visible: boolean
    record?: SaleOutboundItem | null
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

  const acting = ref(false)

  const typeStyle = computed(() => {
    const type = props.record?.exit_type as SaleOutboundType | undefined
    if (!type) return {}
    const cfg = SALE_OUTBOUND_TYPE_CONFIG[type]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const statusStyle = computed(() => {
    const status = props.record?.status
    if (!status) return {}
    const cfg = SALE_OUTBOUND_STATUS_CONFIG[status]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const detailRows = computed(() => {
    const item = props.record
    if (!item) return []
    const amount = item.total_amount
    const amountText =
      amount !== undefined && amount !== null && Number(amount) > 0
        ? `¥${Number(amount).toLocaleString()}`
        : '—'
    return [
      { label: '出库单号', value: item.exit_no || '—' },
      { label: '出库类型', value: item.exit_type_text || '—' },
      { label: '客户/目的', value: item.customer_name || '—' },
      { label: '联系电话', value: item.contact_phone || '—' },
      { label: '物品明细', value: item.items_desc || '—' },
      { label: '合计金额', value: amountText },
      { label: '申请时间', value: item.apply_time || '—' },
      { label: '申请人', value: item.applicant || '—' },
      { label: '审批人', value: item.approver || '—' },
      { label: '审批时间', value: item.approve_time || '—' },
      { label: '完成时间', value: item.complete_time || '—' },
      { label: '备注', value: item.remark || '—' }
    ]
  })

  async function handleApprove() {
    if (!props.record?.id) return
    try {
      await ElMessageBox.confirm('确认审批通过该出库单？', '审批通过', {
        type: 'warning',
        confirmButtonText: '确认通过'
      })
    } catch {
      return
    }
    acting.value = true
    try {
      await fetchSaleOutboundApprove(props.record.id)
      emit('success')
      dialogVisible.value = false
    } finally {
      acting.value = false
    }
  }

  async function handleComplete() {
    if (!props.record?.id) return
    try {
      await ElMessageBox.confirm('确认完成出库？', '确认出库', {
        type: 'warning',
        confirmButtonText: '确认出库'
      })
    } catch {
      return
    }
    acting.value = true
    try {
      await fetchSaleOutboundComplete(props.record.id)
      emit('success')
      dialogVisible.value = false
    } finally {
      acting.value = false
    }
  }

  function handleClosed() {
    // no-op
  }
</script>

<style scoped lang="scss">
  .ob-detail-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .ob-detail-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-400);
  }

  .ob-detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .ob-badge {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
  }

  .ob-detail-rows {
    overflow: hidden;
    background: #f9fafb;
    border-radius: 8px;
  }

  .ob-detail-row {
    display: flex;
    gap: 16px;
    padding: 10px 16px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .label {
      flex-shrink: 0;
      width: 72px;
      font-size: 12px;
      color: var(--art-gray-400);
    }

    .value {
      flex: 1;
      font-size: 14px;
      color: var(--art-gray-800);
      word-break: break-all;
    }
  }
</style>
