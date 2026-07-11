<template>
  <div class="entry-page art-full-height">
    <div class="entry-page-header">
      <div>
        <div class="entry-page-title">原料入库</div>
        <div class="entry-page-desc">原料车辆入库管理，质检通过后确认入库分配仓位</div>
      </div>
      <div class="entry-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
      </div>
    </div>

    <div class="entry-stats">
      <div v-for="item in statCards" :key="item.label" class="entry-stat-card">
        <div class="entry-stat-icon" :style="{ background: item.bg }">
          <ArtSvgIcon :icon="item.icon" :style="{ color: item.color, fontSize: '20px' }" />
        </div>
        <div>
          <div class="entry-stat-label">{{ item.label }}</div>
          <div class="entry-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <EntrySearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="entry-list-page">
      <ElCard
        class="entry-table-card art-table-card"
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
          row-key="vehicle_id"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        />
      </ElCard>
    </div>

    <EntryConfirmDialog
      v-model:visible="confirmVisible"
      :entry-item="selectedItem"
      @success="handleConfirmSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchWarehouseEntryExport,
    fetchWarehouseEntryList,
    fetchWarehouseEntryStats
  } from '@/api/recycle/warehouse'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    WarehouseEntryItem,
    WarehouseEntrySearchParams,
    WarehouseEntryStats
  } from '@/types/recycle/warehouse'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import EntrySearch from './modules/entry-search.vue'
  import EntryConfirmDialog from './modules/entry-confirm-dialog.vue'

  defineOptions({ name: 'RecycleFactoryEntry' })

  const searchForm = ref<WarehouseEntrySearchParams>({
    keyword: undefined
  })

  const stats = ref<WarehouseEntryStats>({
    pending: 0,
    today: 0,
    entered: 0
  })

  const statCards = computed(() => [
    {
      label: '待入厂（待确认入库）',
      value: stats.value.pending,
      color: '#FA8C16',
      bg: '#FFF7E6',
      icon: 'ri:time-line'
    },
    {
      label: '今日已入库',
      value: stats.value.today,
      color: '#52C41A',
      bg: '#F6FFED',
      icon: 'ri:checkbox-circle-line'
    },
    {
      label: '本月入库总量',
      value: stats.value.entered,
      color: '#1677ff',
      bg: '#E6F7FF',
      icon: 'ri:archive-line'
    }
  ])

  const confirmVisible = ref(false)
  const selectedItem = ref<WarehouseEntryItem | null>(null)
  const exporting = ref(false)

  function formatTimestamp(ts?: number): string {
    if (!ts) return '—'
    const date = new Date(ts * 1000)
    if (Number.isNaN(date.getTime())) return '—'
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  function formatTimestampForExport(ts?: number): string {
    if (!ts) return ''
    const date = new Date(ts * 1000)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  function getArchiveNo(row: WarehouseEntryItem): string {
    const id = row.vehicle_id ?? (row as { id?: number }).id
    return id ? String(id) : '—'
  }

  function renderWeighWeight(row: WarehouseEntryItem) {
    const net = Number(row.weigh_net || 0)
    if (net <= 0) return h('span', { class: 'order-muted' }, '—')
    const gross = Number(row.weigh_gross || row.gross_weight || 0)
    const tare = Number(row.weigh_tare || row.tare_weight || 0)
    return h('div', null, [
      h('span', { class: 'weigh-net' }, `${net} kg`),
      gross > 0 || tare > 0
        ? h('div', { class: 'order-sub-text' }, `毛${gross || '—'}/皮${tare || '—'}`)
        : null
    ])
  }

  function renderActions(row: WarehouseEntryItem) {
    return h('div', { class: 'order-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'order-action-btn primary',
          onClick: () => handleConfirmEntry(row)
        },
        [
          h(ArtSvgIcon, { icon: 'ri:inbox-archive-line', class: 'order-action-icon' }),
          h('span', null, '确认原料入库')
        ]
      )
    ])
  }

  function buildColumns() {
    const cols: ColumnOption<WarehouseEntryItem>[] = [
      {
        prop: 'vehicle_id',
        label: '档案号',
        minWidth: 120,
        formatter: (row: WarehouseEntryItem) => h('span', { class: 'order-no' }, getArchiveNo(row))
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row: WarehouseEntryItem) =>
          h('span', { class: 'order-plate-tag' }, row.plate_no || '—')
      },
      {
        prop: 'vehicle_info',
        label: '车辆信息',
        minWidth: 140,
        formatter: (row: WarehouseEntryItem) => {
          const info = row.vehicle_info || `${row.brand || ''} ${row.model || ''}`.trim()
          return info || '—'
        }
      },
      {
        prop: 'customer_name',
        label: '车主',
        minWidth: 120,
        formatter: (row: WarehouseEntryItem) => {
          const name = row.customer_name || row.owner_name || '—'
          const phone = row.customer_phone || row.owner_phone
          return h('div', null, [
            h('div', null, name),
            phone ? h('div', { class: 'order-sub-text' }, phone) : null
          ])
        }
      },
      {
        prop: 'inspector_name',
        label: '质检员',
        minWidth: 100,
        formatter: (row: WarehouseEntryItem) => row.inspector_name || '—'
      },
      {
        prop: 'add_time',
        label: '到场时间',
        minWidth: 140,
        formatter: (row: WarehouseEntryItem) =>
          h('span', { class: 'order-time' }, formatTimestamp(row.add_time))
      },
      {
        prop: 'weigh_net',
        label: '称重净重',
        minWidth: 120,
        formatter: (row: WarehouseEntryItem) => renderWeighWeight(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 150,
        align: 'center',
        fixed: 'right',
        formatter: (row: WarehouseEntryItem) => renderActions(row)
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
      apiFn: fetchWarehouseEntryList,
      apiParams: {
        keyword: searchForm.value.keyword,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  async function loadStats() {
    try {
      stats.value = await fetchWarehouseEntryStats()
    } catch {
      // 统计失败不阻断页面
    }
  }

  function handleToolbarSearch(form: WarehouseEntrySearchParams) {
    searchForm.value = form
    replaceSearchParams({ keyword: form.keyword })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = { keyword: undefined }
    resetSearchParams()
    replaceSearchParams({ keyword: undefined })
    getData()
  }

  function handleConfirmEntry(item: WarehouseEntryItem) {
    selectedItem.value = item
    confirmVisible.value = true
  }

  function handleConfirmSuccess() {
    confirmVisible.value = false
    selectedItem.value = null
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchWarehouseEntryExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }

      const rows = list.map((item) => ({
        档案号: getArchiveNo(item),
        车牌号: item.plate_no || '',
        车主: item.customer_name || item.owner_name || '',
        联系电话: item.customer_phone || item.owner_phone || '',
        质检员: item.inspector_name || '',
        到场时间:
          formatTimestampForExport(item.add_time) ||
          (item as { add_time_text?: string }).add_time_text ||
          '',
        称重净重: item.weigh_net ? `${item.weigh_net} kg` : '',
        毛重: item.weigh_gross || item.gross_weight || '',
        皮重: item.weigh_tare || item.tare_weight || ''
      }))

      const sheet = XLSX.utils.json_to_sheet(rows)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '原料入库')
      XLSX.writeFile(book, `原料入库_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './entry';
</style>
