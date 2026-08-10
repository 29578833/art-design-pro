<template>
  <div class="ae-order-picker">
    <div class="ae-order-tip">
      选择关联订单后，回收订单号、拖车订单号、线索单号将在整个受理流程中全程显示。
    </div>

    <div class="ae-order-search">
      <ElInput
        v-model="keyword"
        clearable
        placeholder="搜索回收订单号 / 拖车订单号 / 车牌号 / 车主"
        @input="debouncedLoadOrders"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" />
        </template>
      </ElInput>
    </div>

    <div v-loading="loading" class="ae-order-table">
      <div class="ae-order-table-head">
        <span>回收订单号</span>
        <span>订单类型</span>
        <span>拖车订单号</span>
        <span>车牌 / 车主</span>
        <span>操作</span>
      </div>
      <div v-if="!loading && !orders.length" class="ae-order-empty">未找到匹配订单</div>
      <div
        v-for="item in orders"
        :key="item.id"
        class="ae-order-row"
        :class="{ 'is-selected': selected?.id === item.id }"
        @click="selected = item"
      >
        <span class="ae-order-no">{{ item.order_no || '—' }}</span>
        <span>
          <span class="ae-order-type" :class="Number(item.is_batch) === 1 ? 'batch' : 'single'">
            {{ Number(item.is_batch) === 1 ? '批次回收' : '单台回收' }}
          </span>
        </span>
        <span class="ae-order-sub">{{ item.tow_no || '—' }}</span>
        <span class="ae-order-sub"> {{ item.plate_no || '—' }} · {{ item.real_name || '—' }} </span>
        <span>
          <button
            type="button"
            class="ae-order-select-btn"
            :class="{ active: selected?.id === item.id }"
            @click.stop="selected = item"
          >
            {{ selected?.id === item.id ? '已选' : '选择' }}
          </button>
        </span>
      </div>
    </div>

    <div v-if="total > pageSize" class="ae-order-pagination">
      <ElPagination
        v-model:current-page="page"
        :page-size="pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="loadOrders"
      />
    </div>

    <div v-if="selected" class="ae-order-summary">
      <span class="ae-order-summary-label">回收订单号：</span>
      <span class="ae-order-summary-value">{{ selected.order_no || '—' }}</span>
      <template v-if="selected.tow_no">
        <span class="ae-order-summary-label">拖车订单号：</span>
        <span class="ae-order-summary-text">{{ selected.tow_no }}</span>
      </template>
      <template v-if="resolveLeadNo(selected)">
        <span class="ae-order-summary-label">线索单号：</span>
        <span class="ae-order-summary-text">{{ resolveLeadNo(selected) }}</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchOrderList } from '@/api/recycle/order'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { isLeadOrder } from '@/types/recycle/recovery/orders/order'
  import type { RecycleOrder } from '@/types/recycle/recovery/orders/order'

  defineOptions({ name: 'VehicleArchiveOrderPicker' })

  const selected = defineModel<RecycleOrder | null>('selected', { default: null })

  const keyword = ref('')
  const loading = ref(false)
  const orders = ref<RecycleOrder[]>([])
  const page = ref(1)
  const pageSize = 8
  const total = ref(0)

  function resolveLeadNo(order: RecycleOrder) {
    const leadNo = String(order.lead_no || '')
    if (leadNo) return leadNo
    return isLeadOrder(order) ? order.order_no || '' : ''
  }

  async function loadOrders(nextPage = page.value) {
    page.value = nextPage
    loading.value = true
    try {
      const res = await fetchOrderList({
        tab: 'formal_order',
        keyword: keyword.value,
        orderStatusCodes: '0,2,3,-1',
        current: page.value,
        size: pageSize
      })
      orders.value = res.records
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  const debouncedLoadOrders = useDebounceFn(() => loadOrders(1), 300)

  function reset() {
    keyword.value = ''
    page.value = 1
    orders.value = []
    total.value = 0
    selected.value = null
  }

  onMounted(() => {
    loadOrders(1)
  })

  defineExpose({ reset, loadOrders })
</script>
