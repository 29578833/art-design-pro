<template>
  <div class="inv-page art-full-height">
    <div class="inv-page-header">
      <div>
        <div class="inv-page-title">库存管理</div>
        <div class="inv-page-desc">库存清单查询与库位调拨</div>
      </div>
      <div class="inv-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
      </div>
    </div>

    <div class="inv-stats">
      <div v-for="item in statCards" :key="item.label" class="inv-stat-card">
        <div class="inv-stat-icon" :style="{ background: item.bg }">
          <ArtSvgIcon :icon="item.icon" :style="{ color: item.color, fontSize: '20px' }" />
        </div>
        <div>
          <div class="inv-stat-label">{{ item.label }}</div>
          <div class="inv-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <InventorySearch
      v-model:search-form="searchForm"
      :category-counts="categoryCounts"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="inv-list-page">
      <ElCard
        class="inv-table-card art-table-card"
        shadow="never"
        :body-style="{ padding: 0, paddingBottom: '20px' }"
      >
        <ArtTable
          :loading="loading"
          :data="data"
          :columns="columns"
          :pagination="pagination"
          :show-table-header="false"
          :stripe="false"
          row-key="id"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </div>

    <InventoryDetailDialog v-model:visible="detailVisible" :record-id="detailRecordId" />

    <InventoryTransferDialog
      v-model:visible="transferVisible"
      :record="transferRecord"
      @success="handleTransferSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchInventoryCategoryCounts,
    fetchInventoryItemExport,
    fetchInventoryItemList,
    fetchInventoryItemStats
  } from '@/api/recycle/inventory-item'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    InventoryCategoryCounts,
    InventoryItem,
    InventoryItemSearchParams,
    InventoryItemStats
  } from '@/types/recycle/inventory-item'
  import { INVENTORY_STATUS_CONFIG } from '@/types/recycle/inventory-item'
  import type { ProductStoreCategory } from '@/types/recycle/product-store'
  import { PRODUCT_STORE_CATEGORY_CONFIG } from '@/types/recycle/product-store'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import InventorySearch from './modules/inventory-search.vue'
  import InventoryDetailDialog from './modules/inventory-detail-dialog.vue'
  import InventoryTransferDialog from './modules/inventory-transfer-dialog.vue'

  defineOptions({ name: 'RecycleWarehouseInventory' })

  const searchForm = ref<InventoryItemSearchParams>({
    keyword: undefined,
    category: '',
    status: ''
  })

  const stats = ref<InventoryItemStats>({
    variety_text: '0种',
    reusable_text: '0件',
    metal_weight_text: '0kg',
    total_value_text: '¥0',
    pending_out_text: '0单',
    location_rate_text: '0%'
  })

  const categoryCounts = ref<InventoryCategoryCounts>({
    total: 0,
    reusable: 0,
    metal: 0,
    hazardous: 0,
    general: 0
  })

  const detailVisible = ref(false)
  const detailRecordId = ref<number>()
  const transferVisible = ref(false)
  const transferRecord = ref<InventoryItem | null>(null)
  const exporting = ref(false)

  const statCards = computed(() => [
    {
      label: '在库品种',
      value: stats.value.variety_text,
      color: '#1677ff',
      bg: '#E6F7FF',
      icon: 'ri:archive-line'
    },
    {
      label: '回用件',
      value: stats.value.reusable_text,
      color: '#52C41A',
      bg: '#F6FFED',
      icon: 'ri:tools-line'
    },
    {
      label: '废金属重量',
      value: stats.value.metal_weight_text,
      color: '#FA8C16',
      bg: '#FFF7E6',
      icon: 'ri:stack-line'
    },
    {
      label: '库存总价值',
      value: stats.value.total_value_text,
      color: '#722ED1',
      bg: '#F9F0FF',
      icon: 'ri:money-cny-circle-line'
    },
    {
      label: '待出库',
      value: stats.value.pending_out_text,
      color: '#FF4D4F',
      bg: '#FFF1F0',
      icon: 'ri:logout-box-r-line'
    },
    {
      label: '库位使用率',
      value: stats.value.location_rate_text,
      color: '#1677ff',
      bg: '#E6F7FF',
      icon: 'ri:map-pin-line'
    }
  ])

  function renderCategoryTag(row: InventoryItem) {
    const cat = row.category as ProductStoreCategory | undefined
    const cfg = cat ? PRODUCT_STORE_CATEGORY_CONFIG[cat] : null
    const label = row.category_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'inv-muted' }, label)
    return h(
      'span',
      { class: 'inv-category-tag', style: { color: cfg.color, background: cfg.bg } },
      [h(ArtSvgIcon, { icon: cfg.icon, style: { fontSize: '12px' } }), label]
    )
  }

  function renderStatusTag(row: InventoryItem) {
    const cfg = INVENTORY_STATUS_CONFIG[row.status]
    const label = row.status_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'inv-muted' }, label)
    return h(
      'span',
      {
        class: 'inv-status-tag',
        style: { color: cfg.color, background: cfg.bg }
      },
      label
    )
  }

  function openDetail(row: InventoryItem) {
    detailRecordId.value = row.id
    detailVisible.value = true
  }

  function openTransfer(row: InventoryItem) {
    transferRecord.value = row
    transferVisible.value = true
  }

  function buildColumns() {
    const cols: ColumnOption<InventoryItem>[] = [
      {
        prop: 'item_no',
        label: '物品编号',
        minWidth: 130,
        formatter: (row) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            row.item_no || row.storage_no || '—'
          )
      },
      {
        prop: 'item_name',
        label: '物品名称',
        minWidth: 160,
        formatter: (row) => h('div', { class: 'inv-item-name' }, row.item_name || '—')
      },
      {
        prop: 'category_text',
        label: '分类',
        minWidth: 110,
        formatter: (row) => renderCategoryTag(row)
      },
      {
        prop: 'spec',
        label: '规格',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'inv-muted' }, row.spec || '—')
      },
      {
        prop: 'quantity_text',
        label: '库存数量',
        minWidth: 90,
        formatter: (row) => row.quantity_text || '—'
      },
      {
        prop: 'weight_text',
        label: '重量',
        minWidth: 90,
        formatter: (row) => row.weight_text || '—'
      },
      {
        prop: 'location',
        label: '库位',
        minWidth: 110,
        formatter: (row) =>
          row.location
            ? h('span', { class: 'inv-location-tag' }, row.location)
            : h('span', { class: 'inv-muted' }, '—')
      },
      {
        prop: 'unit_price_text',
        label: '单价',
        minWidth: 90,
        formatter: (row) => row.unit_price_text || '—'
      },
      {
        prop: 'total_value_text',
        label: '库存价值',
        minWidth: 100,
        formatter: (row) => h('span', { class: 'inv-value' }, row.total_value_text || '—')
      },
      {
        prop: 'entry_date',
        label: '入库日期',
        minWidth: 110,
        formatter: (row) => h('span', { class: 'inv-muted' }, row.entry_date || '—')
      },
      {
        prop: 'status_text',
        label: '状态',
        minWidth: 90,
        formatter: (row) => renderStatusTag(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 160,
        align: 'center',
        fixed: 'right',
        formatter: (row) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openDetail(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'order-action-icon' }), '详情']
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openTransfer(row)
              },
              '调拨'
            )
          ])
      }
    ]
    return cols
  }

  const {
    columns,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchInventoryItemList,
      apiParams: {
        keyword: searchForm.value.keyword,
        category: searchForm.value.category,
        status: searchForm.value.status,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  async function loadStats() {
    try {
      const [statsRes, countsRes] = await Promise.all([
        fetchInventoryItemStats(),
        fetchInventoryCategoryCounts()
      ])
      stats.value = statsRes
      categoryCounts.value = countsRes
    } catch {
      // 统计失败不阻断
    }
  }

  function handleToolbarSearch(form: InventoryItemSearchParams) {
    searchForm.value = form
    replaceSearchParams({
      keyword: form.keyword,
      category: form.category,
      status: form.status
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = { keyword: undefined, category: '', status: '' }
    resetSearchParams()
    replaceSearchParams({ keyword: undefined, category: '', status: '' })
    getData()
  }

  function handleTransferSuccess() {
    transferVisible.value = false
    transferRecord.value = null
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchInventoryItemExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '库存清单')
      XLSX.writeFile(book, `库存清单_${new Date().toISOString().slice(0, 10)}.xlsx`)
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadStats()
  })
</script>

<style lang="scss">
  @use './inventory';
</style>
