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
        <div class="inv-detail-title">库存详情</div>
        <div class="inv-detail-sub">{{ detail?.item_no || detail?.storage_no || '—' }}</div>
      </div>
    </template>

    <div v-loading="loading" class="inv-detail-body">
      <template v-if="detail">
        <div class="inv-detail-badges">
          <span v-if="detail.category" class="inv-badge" :style="categoryStyle">
            {{ detail.category_text || '—' }}
          </span>
          <span class="inv-badge" :style="statusStyle">
            {{ detail.status_text || '—' }}
          </span>
        </div>

        <div class="inv-detail-rows">
          <div v-for="row in detailRows" :key="row.label" class="inv-detail-row">
            <span class="label">{{ row.label }}</span>
            <span class="value">{{ row.value }}</span>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchInventoryItemDetail } from '@/api/recycle/inventory-item'
  import type { InventoryItem } from '@/types/recycle/inventory-item'
  import { INVENTORY_STATUS_CONFIG } from '@/types/recycle/inventory-item'
  import type { ProductStoreCategory } from '@/types/recycle/product-store'
  import { PRODUCT_STORE_CATEGORY_CONFIG } from '@/types/recycle/product-store'

  interface Props {
    visible: boolean
    recordId?: number
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

  const loading = ref(false)
  const detail = ref<InventoryItem | null>(null)

  const categoryStyle = computed(() => {
    const cat = detail.value?.category as ProductStoreCategory | undefined
    if (!cat) return {}
    const cfg = PRODUCT_STORE_CATEGORY_CONFIG[cat]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const statusStyle = computed(() => {
    const status = detail.value?.status
    if (status === undefined || status === null) return {}
    const cfg = INVENTORY_STATUS_CONFIG[status]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const detailRows = computed(() => {
    const item = detail.value
    if (!item) return []
    return [
      { label: '物品编号', value: item.item_no || item.storage_no || '—' },
      { label: '物品名称', value: item.item_name || '—' },
      { label: '规格型号', value: item.spec || '—' },
      { label: '库存数量', value: item.quantity_text || '—' },
      { label: '重量', value: item.weight_text || '—' },
      { label: '存放库位', value: item.location || '—' },
      { label: '单价', value: item.unit_price_text || '—' },
      { label: '库存价值', value: item.total_value_text || '—' },
      { label: '来源VIN', value: item.source_vin || item.vin || '—' },
      { label: '入库日期', value: item.entry_date || '—' },
      { label: '备注', value: item.remark || '—' }
    ]
  })

  async function loadDetail() {
    if (!props.recordId) return
    loading.value = true
    try {
      detail.value = await fetchInventoryItemDetail(props.recordId)
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    detail.value = null
  }

  watch(
    () => [props.visible, props.recordId] as const,
    ([visible, recordId]) => {
      if (visible && recordId) loadDetail()
    }
  )
</script>

<style scoped lang="scss">
  .inv-detail-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .inv-detail-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-400);
  }

  .inv-detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .inv-badge {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
  }

  .inv-detail-rows {
    overflow: hidden;
    background: #f9fafb;
    border-radius: 8px;
  }

  .inv-detail-row {
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
