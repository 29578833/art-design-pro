<template>
  <div class="product-page art-full-height">
    <div class="product-page-header">
      <div>
        <div class="product-page-title">产物入库管理</div>
        <div class="product-page-desc">4大分类：回用件 · 废金属 · 危险废物 · 一般废物</div>
      </div>
      <div class="product-page-actions">
        <ElButton @click="locationMapVisible = true">
          <ArtSvgIcon icon="ri:map-pin-line" class="mr-1" />
          库位图
        </ElButton>
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton type="primary" @click="createVisible = true">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新建入库单
        </ElButton>
      </div>
    </div>

    <div class="product-stats">
      <div v-for="item in statCards" :key="item.label" class="product-stat-card">
        <div class="product-stat-icon" :style="{ background: item.bg }">
          <ArtSvgIcon :icon="item.icon" :style="{ color: item.color, fontSize: '20px' }" />
        </div>
        <div>
          <div class="product-stat-label">{{ item.label }}</div>
          <div class="product-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <div class="product-main-tabs">
      <button
        type="button"
        class="product-main-tab"
        :class="{ 'is-active': activeTab === 'list' }"
        @click="activeTab = 'list'"
      >
        入库清单
      </button>
      <button
        type="button"
        class="product-main-tab"
        :class="{ 'is-active': activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        产物统计
      </button>
    </div>

    <ProductSearch
      v-if="activeTab === 'list'"
      v-model:search-form="searchForm"
      :category-counts="categoryCounts"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div v-if="activeTab === 'list'" class="product-list-page">
      <ElCard
        class="product-table-card art-table-card"
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

    <ProductStatsPanel v-else :stats="stats" />

    <ProductCreateDialog v-model:visible="createVisible" @success="handleCreateSuccess" />

    <ProductDetailDialog v-model:visible="detailVisible" :record-id="detailRecordId" />

    <ProductLocationMapDialog v-model:visible="locationMapVisible" />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchProductStoreExport,
    fetchProductStoreList,
    fetchProductStoreStats
  } from '@/api/recycle/product-store'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    ProductStoreCategory,
    ProductStoreCategoryCounts,
    ProductStoreItem,
    ProductStoreSearchParams,
    ProductStoreStats
  } from '@/types/recycle/product-store'
  import {
    PRODUCT_STORE_CATEGORY_CONFIG,
    PRODUCT_STORE_STATUS_CONFIG
  } from '@/types/recycle/product-store'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ProductSearch from './modules/product-search.vue'
  import ProductCreateDialog from './modules/product-create-dialog.vue'
  import ProductDetailDialog from './modules/product-detail-dialog.vue'
  import ProductStatsPanel from './modules/product-stats-panel.vue'
  import ProductLocationMapDialog from './modules/product-location-map-dialog.vue'

  defineOptions({ name: 'RecycleDismantleProduct' })

  type ProductPageTab = 'list' | 'stats'

  const activeTab = ref<ProductPageTab>('list')

  const searchForm = ref<ProductStoreSearchParams>({
    keyword: undefined,
    category: '',
    status: ''
  })

  const stats = ref<ProductStoreStats>({
    reusable_count: '0件',
    metal_weight: '0kg',
    hazardous_count: '0批',
    today_count: '0批',
    usage_rate: '0%'
  })

  const categoryCounts = ref<ProductStoreCategoryCounts>({
    reusable: 0,
    metal: 0,
    hazardous: 0,
    general: 0
  })

  const statCards = computed(() => [
    {
      label: '回用件总量',
      value: stats.value.reusable_count,
      color: '#1677ff',
      bg: '#E6F7FF',
      icon: 'ri:archive-line'
    },
    {
      label: '废金属重量',
      value: stats.value.metal_weight,
      color: '#52C41A',
      bg: '#F6FFED',
      icon: 'ri:stack-line'
    },
    {
      label: '危废数量',
      value: stats.value.hazardous_count,
      color: '#FF4D4F',
      bg: '#FFF1F0',
      icon: 'ri:alert-line'
    },
    {
      label: '今日入库',
      value: stats.value.today_count,
      color: '#FA8C16',
      bg: '#FFF7E6',
      icon: 'ri:inbox-unarchive-line'
    },
    {
      label: '库位使用率',
      value: stats.value.usage_rate,
      color: '#722ED1',
      bg: '#F9F0FF',
      icon: 'ri:map-pin-line'
    }
  ])

  const createVisible = ref(false)
  const detailVisible = ref(false)
  const locationMapVisible = ref(false)
  const detailRecordId = ref<number>()
  const exporting = ref(false)

  async function tableApiFn(params: ProductStoreSearchParams) {
    return fetchProductStoreList(params)
  }

  function renderCategoryTag(row: ProductStoreItem) {
    const cat = row.category as ProductStoreCategory | undefined
    const cfg = cat ? PRODUCT_STORE_CATEGORY_CONFIG[cat] : null
    const label = row.category_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'order-muted' }, label)
    return h(
      'span',
      { class: 'product-category-tag', style: { color: cfg.color, background: cfg.bg } },
      [h(ArtSvgIcon, { icon: cfg.icon, style: { fontSize: '12px' } }), label]
    )
  }

  function renderStatusTag(row: ProductStoreItem) {
    const cfg = PRODUCT_STORE_STATUS_CONFIG[row.status]
    const label = row.status_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'order-muted' }, label)
    return h(
      'span',
      {
        class: 'order-status-tag',
        style: { color: cfg.color, background: cfg.bg, borderColor: cfg.color }
      },
      label
    )
  }

  function openDetail(row: ProductStoreItem) {
    detailRecordId.value = row.id
    detailVisible.value = true
  }

  function buildColumns() {
    const cols: ColumnOption<ProductStoreItem>[] = [
      {
        prop: 'storage_no',
        label: '入库单号',
        minWidth: 130,
        formatter: (row) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            row.storage_no || '—'
          )
      },
      {
        prop: 'item_name',
        label: '物品名称',
        minWidth: 160,
        formatter: (row) =>
          h('div', null, [
            h('div', { class: 'product-item-name' }, row.item_name || '—'),
            row.remark ? h('div', { class: 'order-sub-text' }, row.remark) : null
          ])
      },
      {
        prop: 'category_text',
        label: '分类',
        minWidth: 100,
        formatter: (row) => renderCategoryTag(row)
      },
      {
        prop: 'spec',
        label: '规格',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'order-muted' }, row.spec || '—')
      },
      {
        prop: 'quantity_display',
        label: '数量',
        minWidth: 80,
        formatter: (row) => row.quantity_display || '—'
      },
      {
        prop: 'weight_display',
        label: '重量',
        minWidth: 90,
        formatter: (row) => row.weight_display || '—'
      },
      {
        prop: 'location',
        label: '库位',
        minWidth: 110,
        formatter: (row) =>
          row.location
            ? h('span', { class: 'order-location-tag' }, row.location)
            : h('span', { class: 'order-muted' }, '—')
      },
      {
        prop: 'store_time',
        label: '入库日期',
        minWidth: 110,
        formatter: (row) =>
          h('span', { class: 'order-time' }, row.store_time ? row.store_time.slice(0, 10) : '—')
      },
      {
        prop: 'operator_name',
        label: '操作人',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'order-muted' }, row.operator_name || '—')
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
        width: 100,
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
      apiFn: tableApiFn,
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
      const res = await fetchProductStoreStats()
      stats.value = res
      if (res.category_distribution) {
        categoryCounts.value = res.category_distribution
      }
    } catch {
      // 统计失败不阻断页面
    }
  }

  function handleToolbarSearch(form: ProductStoreSearchParams) {
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

  function handleCreateSuccess() {
    createVisible.value = false
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchProductStoreExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '产物入库')
      XLSX.writeFile(book, `产物入库_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './product';
</style>
