<template>
  <ElDrawer v-model="drawerVisible" :size="520" destroy-on-close class="partner-detail-drawer">
    <template #header>
      <div v-if="partner" class="detail-profile">
        <div class="detail-profile-main">
          <div class="detail-avatar" :style="{ background: avatarColor }">
            {{ partner.name.slice(0, 1) }}
          </div>
          <div class="detail-profile-meta">
            <div class="detail-title-row">
              <span class="detail-name">{{ partner.name }}</span>
              <ElTag
                :style="{
                  color: gradeConfig.color,
                  background: gradeConfig.bgColor,
                  border: 'none'
                }"
                size="small"
                round
              >
                {{ gradeConfig.label }}
              </ElTag>
            </div>
            <div class="detail-sub">{{ partner.code }} · {{ categoryLabel }} · {{ typeLabel }}</div>
          </div>
        </div>
        <div class="detail-profile-tags">
          <ElTag
            :type="partner.category === 'customer' ? 'primary' : 'warning'"
            effect="light"
            round
          >
            {{ categoryLabel }}
          </ElTag>
          <ElTag :type="partner.status === 'active' ? 'success' : 'info'" effect="light" round>
            {{ partner.status === 'active' ? '正常' : '禁用' }}
          </ElTag>
        </div>
      </div>
    </template>

    <ElTabs v-model="activeTab" class="detail-tabs">
      <ElTabPane label="基本信息" name="info">
        <div v-if="partner" class="detail-stats">
          <div v-for="item in statCards" :key="item.label" class="detail-stat-card">
            <ArtSvgIcon :icon="item.icon" class="detail-stat-icon" :style="{ color: item.color }" />
            <div class="detail-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="detail-stat-label">{{ item.label }}</div>
          </div>
        </div>

        <div v-if="partner" class="detail-fields">
          <div v-for="field in infoFields" :key="field.label" class="detail-field">
            <div class="detail-field-icon">
              <ArtSvgIcon :icon="field.icon" />
            </div>
            <div class="detail-field-body">
              <div class="detail-field-label">{{ field.label }}</div>
              <div class="detail-field-value">{{ field.value }}</div>
            </div>
          </div>
        </div>

        <div v-if="partner?.remark" class="detail-remark">
          <ArtSvgIcon icon="ri:sticky-note-line" class="detail-remark-icon" />
          <div> <span class="font-medium">备注：</span>{{ partner.remark }} </div>
        </div>
      </ElTabPane>

      <ElTabPane label="交车记录" name="orders">
        <template v-if="partner?.category === 'supplier'">
          <ElEmpty description="供应商暂无交车记录" :image-size="80" />
        </template>
        <template v-else>
          <div v-for="order in mockOrders" :key="order.id" class="order-card">
            <div class="order-card-top">
              <span class="order-id">{{ order.id }}</span>
              <ElTag type="success" size="small" effect="light" round>{{ order.status }}</ElTag>
            </div>
            <div class="order-plate">{{ order.plate }} · {{ order.brand }}</div>
            <div class="order-card-bottom">
              <span class="order-date">{{ order.date }}</span>
              <span class="order-amount">¥{{ order.amount.toLocaleString() }}</span>
            </div>
          </div>
        </template>
      </ElTabPane>

      <ElTabPane label="交易统计" name="stats">
        <div v-for="item in tradeStats" :key="item.label" class="trade-stat-card">
          <div class="trade-stat-icon-wrap" :style="{ background: item.bg }">
            <ArtSvgIcon :icon="item.icon" :style="{ color: item.color }" />
          </div>
          <div class="trade-stat-body">
            <div class="trade-stat-label">{{ item.label }}</div>
            <div class="trade-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
            <div class="trade-stat-sub">{{ item.sub }}</div>
          </div>
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
  const avatarColors = ['#1890FF', '#722ED1', '#13C2C2', '#FA8C16', '#52C41A']

  const drawerVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const gradeConfig = computed(() => {
    const grade = props.partner?.grade || 'normal'
    return GRADE_CONFIG[grade]
  })

  const avatarColor = computed(() => {
    const name = props.partner?.name || ''
    return avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length]
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
      {
        label: '累计交车',
        value: `${props.partner.totalVehicles}辆`,
        color: '#1890FF',
        icon: 'ri:car-line'
      },
      {
        label: '最近交车',
        value: props.partner.lastDealDate,
        color: '#52C41A',
        icon: 'ri:calendar-check-line'
      }
    ]
  })

  const infoFields = computed(() => {
    if (!props.partner) return []
    const p = props.partner

    return [
      { label: '联系电话', value: p.phone, icon: 'ri:phone-line' },
      { label: '联系地址', value: p.address || '—', icon: 'ri:map-pin-line' },
      {
        label: '合作商类型',
        value: COOPERATION_TYPE_CONFIG[p.cooperationType].label,
        icon: 'ri:building-2-line'
      },
      {
        label: '信用额度',
        value: `¥${(p.creditLimit || 0).toLocaleString()}`,
        icon: 'ri:shield-check-line'
      },
      {
        label: '累计交易额',
        value: `¥${(p.totalTradeAmount || 0).toLocaleString()}`,
        icon: 'ri:money-cny-circle-line'
      },
      ...(p.enterprise
        ? [{ label: '企业名称', value: p.enterprise, icon: 'ri:building-line' }]
        : []),
      ...(p.creditCode
        ? [{ label: '统一社会信用代码', value: p.creditCode, icon: 'ri:file-text-line' }]
        : []),
      ...(p.contactPerson
        ? [{ label: '企业联系人', value: p.contactPerson, icon: 'ri:user-line' }]
        : []),
      ...(p.idCard ? [{ label: '身份证号', value: p.idCard, icon: 'ri:id-card-line' }] : []),
      { label: '注册时间', value: p.createTime, icon: 'ri:time-line' }
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
        bg: '#E6F7FF',
        icon: 'ri:money-cny-circle-line'
      },
      {
        label: '平均单价',
        value: vehicles > 0 ? `¥${avg.toLocaleString()}` : '—',
        sub: '/辆',
        color: '#52C41A',
        bg: '#F6FFED',
        icon: 'ri:bar-chart-box-line'
      },
      {
        label: '信用额度',
        value: `¥${(props.partner?.creditLimit || 0).toLocaleString()}`,
        sub: '最大欠款额度',
        color: '#FA8C16',
        bg: '#FFF7E6',
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
  .detail-profile {
    width: 100%;
  }

  .detail-profile-main {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .detail-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    border-radius: 14px;
  }

  .detail-profile-meta {
    min-width: 0;
  }

  .detail-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .detail-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .detail-sub {
    margin-top: 6px;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .detail-profile-tags {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .detail-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
  }

  .detail-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .detail-stat-card {
    padding: 14px 12px;
    text-align: center;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .detail-stat-icon {
    margin-bottom: 6px;
    font-size: 18px;
  }

  .detail-stat-value {
    font-size: 16px;
    font-weight: 700;
  }

  .detail-stat-label {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .detail-fields {
    margin-bottom: 16px;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .detail-field {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px;
    border-bottom: 1px solid var(--art-card-border);

    &:last-child {
      border-bottom: none;
    }
  }

  .detail-field-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: var(--art-gray-500);
    background: var(--art-gray-100);
    border-radius: 8px;
  }

  .detail-field-label {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .detail-field-value {
    margin-top: 4px;
    font-size: 14px;
    color: var(--art-gray-900);
    word-break: break-all;
  }

  .detail-remark {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 12px 14px;
    font-size: 13px;
    color: #ad6800;
    background: #fffbe6;
    border: 1px solid #ffe58f;
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .detail-remark-icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 16px;
  }

  .order-card {
    padding: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  .order-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .order-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: var(--el-color-primary);
  }

  .order-plate {
    font-size: 14px;
    font-weight: 500;
    color: var(--art-gray-900);
  }

  .order-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  .order-date {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .order-amount {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .trade-stat-card {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 16px;
    margin-bottom: 12px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .trade-stat-icon-wrap {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 22px;
    border-radius: 12px;
  }

  .trade-stat-label {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .trade-stat-value {
    margin-top: 4px;
    font-size: 20px;
    font-weight: 700;
  }

  .trade-stat-sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--art-gray-400);
  }
</style>
