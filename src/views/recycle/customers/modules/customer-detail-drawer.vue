<template>
  <ElDrawer v-model="drawerVisible" :size="480" destroy-on-close>
    <template #header>
      <div class="detail-header">
        <div class="detail-title-row">
          <span class="detail-name">{{ partner?.name }}</span>
          <ElTag
            v-if="partner"
            :style="{ color: gradeConfig.color, background: gradeConfig.bgColor, border: 'none' }"
          >
            {{ gradeConfig.label }}
          </ElTag>
        </div>
        <div v-if="partner" class="detail-sub">
          {{ partner.code }} · {{ categoryLabel }} · {{ typeLabel }}
        </div>
      </div>
    </template>

    <ElTabs v-model="activeTab">
      <ElTabPane label="基本信息" name="info">
        <div v-if="partner" class="detail-stats">
          <div v-for="item in statCards" :key="item.label" class="detail-stat-card">
            <div class="detail-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="detail-stat-label">{{ item.label }}</div>
          </div>
        </div>

        <div v-if="partner" class="detail-fields">
          <div v-for="field in infoFields" :key="field.label" class="detail-field">
            <div class="detail-field-label">{{ field.label }}</div>
            <div class="detail-field-value">{{ field.value }}</div>
          </div>
        </div>

        <div v-if="partner?.remark" class="detail-remark">
          <span class="font-medium">备注：</span>{{ partner.remark }}
        </div>
      </ElTabPane>

      <ElTabPane label="交车记录" name="orders">
        <div v-for="order in mockOrders" :key="order.id" class="order-card">
          <div class="order-card-top">
            <span class="order-id">{{ order.id }}</span>
            <ElTag type="success" size="small">{{ order.status }}</ElTag>
          </div>
          <div class="order-plate">{{ order.plate }} · {{ order.brand }}</div>
          <div class="order-card-bottom">
            <span class="order-date">{{ order.date }}</span>
            <span class="order-amount">¥{{ order.amount.toLocaleString() }}</span>
          </div>
        </div>
        <ElEmpty v-if="partner?.category === 'supplier'" description="供应商暂无交车记录" />
      </ElTabPane>

      <ElTabPane label="交易统计" name="stats">
        <div v-for="item in tradeStats" :key="item.label" class="trade-stat-card">
          <div>
            <div class="trade-stat-label">{{ item.label }}</div>
            <div class="trade-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="trade-stat-sub">{{ item.sub }}</div>
          </div>
          <ArtSvgIcon :icon="item.icon" class="trade-stat-icon" />
        </div>
      </ElTabPane>
    </ElTabs>
  </ElDrawer>
</template>

<script setup lang="ts">
  import type { RecyclePartner } from '@/types/recycle/customer'
  import {
    COOPERATION_TYPE_CONFIG,
    GRADE_CONFIG,
    PARTNER_CATEGORY_CONFIG,
    PARTNER_TYPE_CONFIG
  } from '@/types/recycle/customer'

  interface Props {
    visible: boolean
    partner?: RecyclePartner | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const activeTab = ref('info')

  const drawerVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const gradeConfig = computed(() => {
    const grade = props.partner?.grade || 'normal'
    return GRADE_CONFIG[grade]
  })

  const categoryLabel = computed(() => {
    if (!props.partner) return ''
    return PARTNER_CATEGORY_CONFIG[props.partner.category].label
  })

  const typeLabel = computed(() => {
    if (!props.partner) return ''
    return PARTNER_TYPE_CONFIG[props.partner.type].label
  })

  const statCards = computed(() => {
    if (!props.partner) return []
    return [
      { label: '累计交车', value: `${props.partner.totalVehicles}辆`, color: '#1890FF' },
      { label: '最近交车', value: props.partner.lastDealDate, color: '#52C41A' }
    ]
  })

  const infoFields = computed(() => {
    if (!props.partner) return []
    const p = props.partner

    return [
      { label: '联系电话', value: p.phone },
      { label: '联系地址', value: p.address || '—' },
      { label: '合作商类型', value: COOPERATION_TYPE_CONFIG[p.cooperationType].label },
      { label: '信用额度', value: `¥${(p.creditLimit || 0).toLocaleString()}` },
      { label: '累计交易额', value: `¥${(p.totalTradeAmount || 0).toLocaleString()}` },
      ...(p.enterprise ? [{ label: '企业名称', value: p.enterprise }] : []),
      ...(p.creditCode ? [{ label: '统一社会信用代码', value: p.creditCode }] : []),
      ...(p.contactPerson ? [{ label: '企业联系人', value: p.contactPerson }] : []),
      ...(p.idCard ? [{ label: '身份证号', value: p.idCard }] : []),
      { label: '注册时间', value: p.createTime }
    ]
  })

  const mockOrders = [
    {
      id: 'XG20260601001',
      plate: '沪A·12345',
      brand: '大众帕萨特',
      amount: 8500,
      date: '2026-06-18',
      status: '已完成'
    },
    {
      id: 'XG20260502003',
      plate: '沪A·67890',
      brand: '丰田凯美瑞',
      amount: 12000,
      date: '2026-05-10',
      status: '已完成'
    }
  ]

  const tradeStats = computed(() => {
    const amount = props.partner?.totalTradeAmount || 0
    const vehicles = props.partner?.totalVehicles || 0
    const avg = vehicles > 0 ? Math.round(amount / vehicles) : 0

    return [
      {
        label: '累计成交金额',
        value: `¥${amount.toLocaleString()}`,
        sub: `共${vehicles}笔交车`,
        color: '#1890FF',
        icon: 'ri:money-cny-circle-line'
      },
      {
        label: '平均单价',
        value: vehicles > 0 ? `¥${avg.toLocaleString()}` : '—',
        sub: '/辆',
        color: '#52C41A',
        icon: 'ri:bar-chart-box-line'
      },
      {
        label: '信用额度',
        value: `¥${(props.partner?.creditLimit || 0).toLocaleString()}`,
        sub: '最大欠款额度',
        color: '#FA8C16',
        icon: 'ri:shield-check-line'
      }
    ]
  })

  watch(
    () => props.visible,
    (visible) => {
      if (visible) activeTab.value = 'info'
    }
  )
</script>

<style scoped lang="scss">
  .detail-header {
    .detail-title-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .detail-name {
      font-size: 16px;
      font-weight: 600;
    }

    .detail-sub {
      margin-top: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .detail-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .detail-stat-card {
    padding: 12px;
    text-align: center;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .detail-stat-value {
    font-size: 14px;
    font-weight: 700;
  }

  .detail-stat-label {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .detail-fields {
    margin-bottom: 16px;
  }

  .detail-field {
    padding: 10px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-field-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .detail-field-value {
    margin-top: 4px;
    font-size: 14px;
    word-break: break-all;
  }

  .detail-remark {
    padding: 12px;
    font-size: 12px;
    color: #ad6800;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: 8px;
  }

  .order-card {
    padding: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  .order-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .order-id {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-color-primary);
  }

  .order-plate {
    font-size: 14px;
    font-weight: 500;
  }

  .order-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 4px;
  }

  .order-date {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .order-amount {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .trade-stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    margin-bottom: 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }

  .trade-stat-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .trade-stat-value {
    margin-top: 4px;
    font-size: 20px;
    font-weight: 700;
  }

  .trade-stat-sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  .trade-stat-icon {
    font-size: 32px;
    color: var(--el-border-color);
  }
</style>
