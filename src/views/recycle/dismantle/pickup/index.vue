<template>
  <div class="pickup-page art-full-height">
    <div class="pickup-page-header">
      <div>
        <div class="pickup-page-title">领料管理</div>
        <div class="pickup-page-desc">管理待拆解原料车辆的出库领取与退库操作</div>
      </div>
      <div class="pickup-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton
          type="primary"
          :disabled="stats.pending_count === 0"
          @click="openOutboundDialog()"
        >
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新建领料单
        </ElButton>
      </div>
    </div>

    <div class="pickup-stats">
      <div v-for="item in statCards" :key="item.label" class="pickup-stat-card">
        <div class="pickup-stat-icon" :style="{ background: item.bg }">
          <ArtSvgIcon :icon="item.icon" :style="{ color: item.color, fontSize: '20px' }" />
        </div>
        <div>
          <div class="pickup-stat-label">{{ item.label }}</div>
          <div class="pickup-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <PickupSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="pickup-list-page">
      <ElCard
        class="pickup-table-card art-table-card"
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

    <PickupOutboundDialog
      v-model:visible="outboundVisible"
      :preselected-ids="preselectedIds"
      @success="handleOutboundSuccess"
    />

    <PickupReturnDialog
      v-model:visible="returnVisible"
      :material-item="returnItem"
      @success="handleReturnSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchMaterialExport,
    fetchMaterialList,
    fetchMaterialStats
  } from '@/api/recycle/material'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type { MaterialItem, MaterialSearchParams, MaterialStats } from '@/types/recycle/material'
  import { MATERIAL_STATUS_CONFIG } from '@/types/recycle/material'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import PickupSearch from './modules/pickup-search.vue'
  import PickupOutboundDialog from './modules/pickup-outbound-dialog.vue'
  import PickupReturnDialog from './modules/pickup-return-dialog.vue'

  defineOptions({ name: 'RecycleDismantlePickup' })

  const searchForm = ref<MaterialSearchParams>({
    keyword: undefined,
    status: undefined
  })

  const stats = ref<MaterialStats>({
    pending_count: 0,
    completed_count: 0,
    today_count: 0
  })

  const statCards = computed(() => [
    {
      label: '待领料',
      value: stats.value.pending_count,
      color: '#1677ff',
      bg: '#E6F7FF',
      icon: 'ri:inbox-line'
    },
    {
      label: '已领料出库',
      value: stats.value.completed_count,
      color: '#52C41A',
      bg: '#F6FFED',
      icon: 'ri:checkbox-circle-line'
    },
    {
      label: '今日领料',
      value: stats.value.today_count,
      color: '#FA8C16',
      bg: '#FFF7E6',
      icon: 'ri:exchange-line'
    }
  ])

  const outboundVisible = ref(false)
  const returnVisible = ref(false)
  const preselectedIds = ref<number[]>([])
  const returnItem = ref<MaterialItem | null>(null)
  const exporting = ref(false)

  function renderStatusTag(row: MaterialItem) {
    const cfg = MATERIAL_STATUS_CONFIG[row.status]
    if (!cfg) return h('span', { class: 'order-muted' }, row.status_text || '—')
    return h('div', null, [
      h(
        'span',
        {
          class: 'order-status-tag',
          style: { color: cfg.color, background: cfg.bg }
        },
        cfg.label
      ),
      row.status === 2 && row.receiver ? h('div', { class: 'order-sub-text' }, row.receiver) : null
    ])
  }

  function renderActions(row: MaterialItem) {
    if (row.status === 1) {
      return h('div', { class: 'order-actions' }, [
        h(
          'button',
          {
            type: 'button',
            class: 'order-action-btn primary',
            onClick: () => openOutboundDialog([row.id])
          },
          [
            h(ArtSvgIcon, { icon: 'ri:logout-box-r-line', class: 'order-action-icon' }),
            h('span', null, '领料出库')
          ]
        )
      ])
    }
    if (row.status === 2) {
      return h('div', { class: 'order-actions' }, [
        h(
          'button',
          {
            type: 'button',
            class: 'order-action-btn warning',
            onClick: () => handleReturn(row)
          },
          [h('span', null, '整单退库')]
        )
      ])
    }
    return h('span', { class: 'order-muted' }, '—')
  }

  function buildColumns() {
    const cols: ColumnOption<MaterialItem>[] = [
      {
        prop: 'archive_no',
        label: '档案号',
        minWidth: 130,
        formatter: (row: MaterialItem) => h('span', { class: 'order-no' }, row.archive_no || '—')
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row: MaterialItem) =>
          h('span', { class: 'order-plate-tag' }, row.plate_no || '—')
      },
      {
        prop: 'brand_name',
        label: '车辆信息',
        minWidth: 150,
        formatter: (row: MaterialItem) =>
          h('div', null, [
            h('div', null, `${row.brand_name || ''} ${row.model_name || ''}`.trim() || '—'),
            row.fuel_type_text ? h('div', { class: 'order-sub-text' }, row.fuel_type_text) : null
          ])
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 100,
        formatter: (row: MaterialItem) => row.owner_name || '—'
      },
      {
        prop: 'location_name',
        label: '仓库库位',
        minWidth: 120,
        formatter: (row: MaterialItem) =>
          row.location_name
            ? h('span', { class: 'order-location-tag' }, row.location_name)
            : h('span', { class: 'order-muted' }, '—')
      },
      {
        prop: 'entry_no',
        label: '入库单号',
        minWidth: 130,
        formatter: (row: MaterialItem) => h('span', { class: 'order-creator' }, row.entry_no || '—')
      },
      {
        prop: 'entry_time',
        label: '入库时间',
        minWidth: 140,
        formatter: (row: MaterialItem) => h('span', { class: 'order-time' }, row.entry_time || '—')
      },
      {
        prop: 'status_text',
        label: '状态',
        minWidth: 120,
        formatter: (row: MaterialItem) => renderStatusTag(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 130,
        align: 'center',
        fixed: 'right',
        formatter: (row: MaterialItem) => renderActions(row)
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
      apiFn: fetchMaterialList,
      apiParams: {
        keyword: searchForm.value.keyword,
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
      stats.value = await fetchMaterialStats()
    } catch {
      // 统计失败不阻断页面
    }
  }

  function handleToolbarSearch(form: MaterialSearchParams) {
    searchForm.value = form
    replaceSearchParams({
      keyword: form.keyword,
      status: form.status
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = { keyword: undefined, status: undefined }
    resetSearchParams()
    replaceSearchParams({ keyword: undefined, status: undefined })
    getData()
  }

  function openOutboundDialog(ids?: number[]) {
    preselectedIds.value = ids || []
    outboundVisible.value = true
  }

  function handleReturn(row: MaterialItem) {
    returnItem.value = row
    returnVisible.value = true
  }

  function handleOutboundSuccess() {
    outboundVisible.value = false
    preselectedIds.value = []
    loadStats()
    refreshData()
  }

  function handleReturnSuccess() {
    returnVisible.value = false
    returnItem.value = null
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchMaterialExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '领料记录')
      XLSX.writeFile(book, `领料记录_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './pickup';
</style>
