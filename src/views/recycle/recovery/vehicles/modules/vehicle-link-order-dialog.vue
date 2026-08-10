<template>
  <ElDialog
    v-model="dialogVisible"
    title="选择关联回收订单"
    width="560px"
    align-center
    append-to-body
    destroy-on-close
    class="vehicle-link-order-dialog"
    @open="handleOpen"
  >
    <div v-if="vehicle" class="vlo-header">
      <div class="vlo-header-title">为以下车辆档案选择回收订单</div>
      <div class="vlo-header-meta">
        {{ vehicle.vehicle_no || vehicle.archive_no || `#${vehicle.id}` }}
        · {{ vehicle.plate_no || '—' }} · {{ vehicle.owner_name || vehicle.owner_display || '—' }}
      </div>
    </div>

    <div class="vlo-search">
      <ElInput
        v-model="keyword"
        clearable
        placeholder="搜索回收订单号 / 车牌号 / 车主姓名"
        @input="debouncedLoadOrders"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" />
        </template>
      </ElInput>
    </div>

    <div v-loading="loading" class="vlo-list">
      <div v-if="!loading && !orders.length" class="vlo-empty">未找到匹配的回收订单</div>
      <div
        v-for="item in orders"
        :key="item.id"
        class="vlo-item"
        :class="{ 'vlo-item--current': isCurrentLinkedOrder(item) }"
      >
        <div class="vlo-item-main">
          <div class="vlo-item-head">
            <span class="vlo-order-no">{{ item.order_no || '—' }}</span>
            <span v-if="isCurrentLinkedOrder(item)" class="vlo-current-tag">当前关联</span>
            <span class="vlo-status-tag" :style="getOrderStatusStyle(item.status)">
              {{ item.current_status_text || item.status_text || '—' }}
            </span>
            <span class="vlo-type-tag" :class="Number(item.is_batch) === 1 ? 'batch' : 'single'">
              {{ Number(item.is_batch) === 1 ? '批次回收' : '单台回收' }}
            </span>
          </div>
          <div class="vlo-item-sub">
            {{ item.plate_no || '—' }} · {{ item.real_name || '—' }} ·
            {{ item.add_time_text || '—' }}
          </div>
        </div>
        <ElButton v-if="isCurrentLinkedOrder(item)" type="success" size="small" plain disabled>
          已关联
        </ElButton>
        <ElButton
          v-else
          type="primary"
          size="small"
          :loading="linkingId === item.id"
          @click="handleLink(item)"
        >
          选择关联
        </ElButton>
      </div>
    </div>

    <div v-if="total > pageSize" class="vlo-pagination">
      <ElPagination
        v-model:current-page="page"
        :page-size="pageSize"
        layout="total, prev, pager, next"
        :total="total"
        @current-change="loadOrders"
      />
    </div>

    <template #footer>
      <div class="vlo-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="success" @click="emit('create-order')">
          <ArtSvgIcon icon="ri:add-line" class="vlo-footer-icon" />
          创建回收订单并关联
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchOrderList } from '@/api/recycle/order'
  import { fetchVehicleAssociateOrder } from '@/api/recycle/vehicle'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { RecycleOrder } from '@/types/recycle/recovery/orders/order'
  import type { ScrapVehicle } from '@/types/recycle/recovery/vehicles/vehicle'

  defineOptions({ name: 'VehicleLinkOrderDialog' })

  const props = defineProps<{
    visible: boolean
    vehicle: ScrapVehicle | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    linked: []
    'create-order': []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const keyword = ref('')
  const loading = ref(false)
  const linkingId = ref(0)
  const orders = ref<RecycleOrder[]>([])
  const page = ref(1)
  const pageSize = 8
  const total = ref(0)

  function isCurrentLinkedOrder(order: RecycleOrder) {
    const vehicle = props.vehicle
    if (!vehicle) return false
    if (vehicle.order_id && order.id) {
      return Number(vehicle.order_id) === Number(order.id)
    }
    if (vehicle.order_no && order.order_no) {
      return vehicle.order_no === order.order_no
    }
    return false
  }

  function getOrderStatusStyle(status?: number) {
    if (status === 2) return { background: '#F6FFED', color: '#52C41A' }
    if (status === 1) return { background: '#FFF7E6', color: '#FA8C16' }
    if (status === -1) return { background: '#FFF1F0', color: '#FF4D4F' }
    return { background: '#F5F5F5', color: '#8C8C8C' }
  }

  async function loadOrders(nextPage = page.value) {
    page.value = nextPage
    loading.value = true
    try {
      const res = await fetchOrderList({
        tab: 'formal_order',
        keyword: keyword.value,
        // 排除待审核（status=1）
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

  function handleOpen() {
    keyword.value = ''
    page.value = 1
    orders.value = []
    total.value = 0
    loadOrders(1)
  }

  async function handleLink(order: RecycleOrder) {
    if (!props.vehicle?.id || !order.id) return
    linkingId.value = order.id
    try {
      await fetchVehicleAssociateOrder({
        vehicle_id: props.vehicle.id,
        order_id: order.id
      })
      dialogVisible.value = false
      emit('linked')
    } finally {
      linkingId.value = 0
    }
  }
</script>

<style scoped lang="scss">
  .vlo-header {
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
  }

  .vlo-header-title {
    font-size: 13px;
    font-weight: 600;
    color: #262626;
  }

  .vlo-header-meta {
    margin-top: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .vlo-search {
    margin-bottom: 12px;
  }

  .vlo-list {
    min-height: 200px;
    max-height: 360px;
    overflow-y: auto;
  }

  .vlo-empty {
    padding: 48px 0;
    font-size: 13px;
    color: #bfbfbf;
    text-align: center;
  }

  .vlo-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    transition: border-color 0.2s;

    &:hover {
      background: rgb(230 247 255 / 30%);
      border-color: #1890ff;
    }

    &:last-child {
      margin-bottom: 0;
    }

    &.vlo-item--current {
      background: #f6ffed;
      border-color: #b7eb8f;

      &:hover {
        background: #f6ffed;
        border-color: #95de64;
      }

      .vlo-order-no {
        color: #389e0d;
      }
    }
  }

  .vlo-current-tag {
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 500;
    color: #389e0d;
    background: #d9f7be;
    border-radius: 4px;
  }

  .vlo-item-main {
    flex: 1;
    min-width: 0;
  }

  .vlo-item-head {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .vlo-order-no {
    font-size: 13px;
    font-weight: 600;
    color: #1890ff;
  }

  .vlo-status-tag,
  .vlo-type-tag {
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 500;
    border: 1px solid;
    border-radius: 4px;
  }

  .vlo-type-tag.single {
    color: #1890ff;
    background: #e6f7ff;
  }

  .vlo-type-tag.batch {
    color: #fa8c16;
    background: #fff7e6;
    border-radius: 12px;
  }

  .vlo-item-sub {
    margin-top: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .vlo-pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 12px;
  }

  .vlo-footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    width: 100%;
  }

  .vlo-footer-icon {
    margin-right: 4px;
    font-size: 14px;
  }
</style>
