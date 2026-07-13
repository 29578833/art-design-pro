<template>
  <div class="stl-fee">
    <div v-for="row in feeRows" :key="row.label" class="stl-fee-row">
      <span class="stl-fee-label">{{ row.label }}</span>
      <span class="stl-fee-value" :style="{ color: row.color }">{{ row.text }}</span>
    </div>
    <div class="stl-fee-total">
      <span class="stl-fee-total-label">最终结算金额</span>
      <span class="stl-fee-total-value">{{ formatMoney(record?.final_price) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SettlementItem } from '@/types/recycle/settlement'

  interface Props {
    record?: SettlementItem | null
  }

  const props = defineProps<Props>()

  function formatMoney(val?: number | string) {
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0) return '¥0'
    return `¥${num.toLocaleString()}`
  }

  const feeRows = computed(() => {
    const r = props.record
    const base = Number(r?.base_price ?? r?.vehicle_price) || 0
    const subsidy = Number(r?.subsidy_price ?? r?.self_delivery_subsidy) || 0
    const deduct = Number(r?.deduction_price) || 0
    // 拖车费 / 代理费后端暂无独立字段，按原型行展示为 —
    const tow = 0
    const agent = 0

    function row(label: string, value: number, opts: { isAdd?: boolean; isDeduct?: boolean } = {}) {
      const zero = value === 0
      let color = '#262626'
      let text = '—'
      if (!zero) {
        if (opts.isDeduct) {
          color = '#FF4D4F'
          text = `-¥${Math.abs(value).toLocaleString()}`
        } else if (opts.isAdd) {
          color = '#52C41A'
          text = `+¥${Math.abs(value).toLocaleString()}`
        } else {
          color = '#262626'
          text = `¥${Math.abs(value).toLocaleString()}`
        }
      } else {
        color = '#BFBFBF'
      }
      return { label, color, text }
    }

    return [
      row('车辆基础价值', base),
      row('拖车费', tow, { isAdd: true }),
      row('自送费补贴', subsidy, { isAdd: true }),
      row('质检缺件扣款', deduct, { isDeduct: true }),
      row('代理服务费', agent, { isDeduct: true })
    ]
  })
</script>

<style scoped lang="scss">
  .stl-fee-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #fafafa;

    &:last-of-type {
      border-bottom: none;
    }
  }

  .stl-fee-label {
    font-size: 14px;
    color: #4b5563;
  }

  .stl-fee-value {
    font-size: 14px;
    font-weight: 500;
  }

  .stl-fee-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    margin-top: 4px;
    border-top: 2px solid #e5e7eb;
  }

  .stl-fee-total-label {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
  }

  .stl-fee-total-value {
    font-size: 20px;
    font-weight: 700;
    color: #1890ff;
  }
</style>
