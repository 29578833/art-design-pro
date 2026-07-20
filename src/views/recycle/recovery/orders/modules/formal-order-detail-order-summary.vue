<template>
  <div class="fob-card fob-summary-card">
    <div class="fob-card-title">订单概要</div>
    <ElRow :gutter="24">
      <ElCol :span="8">
        <div class="fob-item">
          <div class="fob-label">订单编号</div>
          <div class="fob-value fob-value--mono fob-value--primary">{{
            detail.order_no || '—'
          }}</div>
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="fob-item">
          <div class="fob-label">订单来源</div>
          <span class="fob-tag" :style="sourceStyle">{{ sourceLabel }}</span>
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="fob-item">
          <div class="fob-label">订单状态</div>
          <span class="fob-tag" :style="orderStatusStyle">{{ orderStatusLabel }}</span>
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="fob-item">
          <div class="fob-label">创建时间</div>
          <div class="fob-value">{{ addTimeText }}</div>
        </div>
      </ElCol>
      <ElCol :span="8">
        <div class="fob-item">
          <div class="fob-label">创建人</div>
          <div class="fob-value">{{ detail.creator_name || detail.real_name || '—' }}</div>
        </div>
      </ElCol>
      <ElCol v-if="reviewLog" :span="8">
        <div class="fob-item">
          <div class="fob-label">审核人</div>
          <div class="fob-value">{{ reviewLog.operator_name || '—' }}</div>
        </div>
      </ElCol>
      <ElCol v-if="reviewLog?.change_time" :span="8">
        <div class="fob-item">
          <div class="fob-label">审核时间</div>
          <div class="fob-value">{{ formatTime(reviewLog.change_time) }}</div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import type { OrderDetail, OrderStatusLog } from '@/types/recycle/order'

  defineOptions({ name: 'FormalOrderDetailOrderSummary' })

  const props = defineProps<{
    detail: Partial<OrderDetail>
  }>()

  const reviewLog = computed<OrderStatusLog | undefined>(() =>
    props.detail.status_logs?.find((l) => l.to_status === 2)
  )

  function formatTime(ts?: number) {
    if (!ts) return '—'
    return new Date(Number(ts) * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const addTimeText = computed(() => formatTime(props.detail.add_time))

  const sourceLabel = computed(() => {
    const src = props.detail.source || ''
    return ['miniapp', 'mini_program'].includes(src) ? '客户申请' : '员工创建'
  })

  const sourceStyle = computed(() => {
    const src = props.detail.source || ''
    return ['miniapp', 'mini_program'].includes(src)
      ? { background: '#F9F0FF', color: '#722ED1' }
      : { background: '#E6F7FF', color: '#1677ff' }
  })

  const ORDER_STATUS: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: '待审核', color: '#1890FF', bg: '#E6F7FF' },
    2: { label: '审核通过', color: '#52C41A', bg: '#F6FFED' },
    [-1]: { label: '审核驳回', color: '#FF4D4F', bg: '#FFF1F0' },
    3: { label: '已完成', color: '#87D068', bg: '#F6FFED' }
  }

  const orderStatusLabel = computed(() => {
    const s = props.detail.status
    return s !== undefined ? (ORDER_STATUS[s]?.label ?? '未知') : '—'
  })

  const orderStatusStyle = computed(() => {
    const s = props.detail.status
    const cfg = s !== undefined ? ORDER_STATUS[s] : undefined
    return cfg
      ? { background: cfg.bg, color: cfg.color }
      : { background: '#F5F5F5', color: '#8C8C8C' }
  })
</script>

<style scoped lang="scss">
  .fob-summary-card {
    margin-bottom: 12px;
  }

  .fob-card {
    padding: 14px 16px 6px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .fob-card-title {
    padding-bottom: 10px;
    margin-bottom: 12px;
    font-size: 11px;
    font-weight: 700;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #f0f0f0;
  }

  .fob-item {
    padding-bottom: 14px;
  }

  .fob-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .fob-value {
    font-size: 14px;
    line-height: 1.5;
    color: #262626;

    &--mono {
      font-size: 13px;
      color: #434343;
    }

    &--primary {
      color: #1677ff;
    }
  }

  .fob-tag {
    display: inline-block;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
  }
</style>
