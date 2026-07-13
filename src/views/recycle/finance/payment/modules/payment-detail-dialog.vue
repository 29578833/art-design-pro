<template>
  <ElDialog v-model="dialogVisible" width="520px" align-center destroy-on-close>
    <template #header>
      <div>
        <div class="pay-detail-title">付款流水详情</div>
        <div class="pay-detail-sub">{{ record?.payment_no || '—' }}</div>
      </div>
    </template>

    <div v-if="record" class="pay-detail-body">
      <div class="pay-detail-badges">
        <span class="pay-badge" :style="statusStyle">
          {{ record.status_text || '—' }}
        </span>
      </div>

      <div class="pay-detail-rows">
        <div v-for="row in detailRows" :key="row.label" class="pay-detail-row">
          <span class="label">{{ row.label }}</span>
          <span class="value">{{ row.value }}</span>
        </div>
      </div>

      <div v-if="record.proof_image" class="pay-proof">
        <div class="pay-proof-label">付款凭证</div>
        <ElImage
          :src="record.proof_image"
          fit="cover"
          class="pay-proof-img"
          :preview-src-list="[record.proof_image]"
        />
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import type { PaymentLogItem, PaymentLogStatus } from '@/types/recycle/payment-log'
  import { PAYMENT_LOG_STATUS_CONFIG } from '@/types/recycle/payment-log'

  interface Props {
    visible: boolean
    record?: PaymentLogItem | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const statusStyle = computed(() => {
    const status = props.record?.status as PaymentLogStatus | undefined
    if (!status) return {}
    const cfg = PAYMENT_LOG_STATUS_CONFIG[status]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  function formatMoney(val?: number | string) {
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0) return '—'
    return `¥${num.toLocaleString()}`
  }

  const detailRows = computed(() => {
    const item = props.record
    if (!item) return []
    return [
      { label: '付款单号', value: item.payment_no || '—' },
      { label: '结算单号', value: item.settlement_no || '—' },
      { label: '关联订单', value: item.order_no || '—' },
      { label: '车牌号', value: item.plate_no || '—' },
      { label: '车主', value: item.owner_name || '—' },
      { label: '付款金额', value: formatMoney(item.pay_amount) },
      { label: '付款方式', value: item.pay_method_text || item.pay_method || '—' },
      { label: '付款时间', value: item.pay_time || '—' },
      { label: '操作人', value: item.pay_user_name || '—' },
      { label: '备注', value: item.remark || '—' }
    ]
  })
</script>

<style scoped lang="scss">
  .pay-detail-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .pay-detail-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .pay-detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .pay-badge {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
  }

  .pay-detail-rows {
    overflow: hidden;
    background: #f9fafb;
    border-radius: 8px;
  }

  .pay-detail-row {
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
      color: var(--art-gray-600);
    }

    .value {
      flex: 1;
      font-size: 14px;
      color: var(--art-gray-800);
      word-break: break-all;
    }
  }

  .pay-proof {
    margin-top: 16px;
  }

  .pay-proof-label {
    margin-bottom: 8px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .pay-proof-img {
    width: 120px;
    height: 120px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
  }
</style>
