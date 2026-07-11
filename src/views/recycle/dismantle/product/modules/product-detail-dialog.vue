<template>
  <ElDialog
    v-model="dialogVisible"
    width="520px"
    align-center
    destroy-on-close
    class="product-detail-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="product-detail-header">
        <div>
          <div class="product-detail-title">入库单详情</div>
          <div class="product-detail-sub">{{ detail?.storage_no || '—' }}</div>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="product-detail-body">
      <template v-if="detail">
        <div class="product-detail-badges">
          <span v-if="detail.category" class="product-badge" :style="categoryStyle">
            {{ detail.category_text || '—' }}
          </span>
          <span class="product-badge" :style="statusStyle">
            {{ detail.status_text || '—' }}
          </span>
        </div>

        <div class="product-detail-rows">
          <div v-for="row in detailRows" :key="row.label" class="product-detail-row">
            <span class="label">{{ row.label }}</span>
            <span class="value">{{ row.value }}</span>
          </div>
        </div>

        <div v-if="detail.category === 'hazardous'" class="product-hazard-tip">
          <ArtSvgIcon icon="ri:alert-line" />
          <p>危险废物须委托有资质机构处置，留存转移联单备查。</p>
        </div>
      </template>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchProductStoreDetail } from '@/api/recycle/product-store'
  import type { ProductStoreCategory, ProductStoreItem } from '@/types/recycle/product-store'
  import {
    PRODUCT_STORE_CATEGORY_CONFIG,
    PRODUCT_STORE_STATUS_CONFIG
  } from '@/types/recycle/product-store'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

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
  const detail = ref<ProductStoreItem | null>(null)

  const categoryStyle = computed(() => {
    const cat = detail.value?.category as ProductStoreCategory | undefined
    if (!cat) return {}
    const cfg = PRODUCT_STORE_CATEGORY_CONFIG[cat]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const statusStyle = computed(() => {
    const status = detail.value?.status
    if (!status) return {}
    const cfg = PRODUCT_STORE_STATUS_CONFIG[status]
    return cfg ? { color: cfg.color, background: cfg.bg } : {}
  })

  const detailRows = computed(() => {
    const item = detail.value
    if (!item) return []
    return [
      { label: '入库单号', value: item.storage_no || '—' },
      { label: '物品名称', value: item.item_name || '—' },
      { label: '规格型号', value: item.spec || '—' },
      { label: '数量', value: item.quantity_display || '—' },
      { label: '重量', value: item.weight_display || '—' },
      { label: '存放库位', value: item.location || '—' },
      { label: '来源VIN', value: item.vin || '—' },
      { label: '关联订单', value: item.order_no || '—' },
      { label: '入库日期', value: formatDate(item.store_time) },
      { label: '操作人员', value: item.operator_name || '—' },
      { label: '备注', value: item.remark || '—' }
    ]
  })

  function formatDate(value?: string) {
    if (!value) return '—'
    return value.slice(0, 10)
  }

  async function loadDetail() {
    if (!props.recordId) return
    loading.value = true
    try {
      detail.value = await fetchProductStoreDetail(props.recordId)
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
      if (visible && recordId) {
        loadDetail()
      }
    }
  )
</script>

<style lang="scss">
  .product-detail-dialog {
    :deep(.el-dialog__header) {
      padding: 16px 20px 0;
      margin-right: 0;
    }

    :deep(.el-dialog__body) {
      padding: 16px 20px;
    }
  }

  .product-detail-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .product-detail-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .product-detail-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .product-badge {
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 12px;
  }

  .product-detail-rows {
    overflow: hidden;
    background: #f9fafb;
    border-radius: 8px;
  }

  .product-detail-row {
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

  .product-hazard-tip {
    display: flex;
    gap: 8px;
    padding: 12px;
    margin-top: 16px;
    font-size: 12px;
    color: #cf1322;
    background: #fff1f0;
    border: 1px solid #ffa39e;
    border-radius: 8px;
  }
</style>
