<template>
  <div class="ob-page art-full-height">
    <div class="ob-page-header">
      <div>
        <div class="ob-page-title">销售出库</div>
        <div class="ob-page-desc">销售出库单创建与审批流程</div>
      </div>
      <div class="ob-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton type="primary" @click="createVisible = true">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新建出库单
        </ElButton>
      </div>
    </div>

    <div class="ob-stats">
      <div v-for="item in statCards" :key="item.label" class="ob-stat-card">
        <div class="ob-stat-label">{{ item.label }}</div>
        <div class="ob-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <OutboundSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="ob-list-page">
      <ElCard
        class="ob-table-card art-table-card"
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

    <OutboundCreateDialog v-model:visible="createVisible" @success="handleCreateSuccess" />

    <OutboundDetailDialog
      v-model:visible="detailVisible"
      :record="detailRecord"
      @success="handleDetailSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchSaleOutboundApprove,
    fetchSaleOutboundComplete,
    fetchSaleOutboundExport,
    fetchSaleOutboundList,
    fetchSaleOutboundStats
  } from '@/api/recycle/sale-outbound'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    SaleOutboundItem,
    SaleOutboundSearchParams,
    SaleOutboundStats,
    SaleOutboundType
  } from '@/types/recycle/sale-outbound'
  import {
    SALE_OUTBOUND_STATUS_CONFIG,
    SALE_OUTBOUND_TYPE_CONFIG
  } from '@/types/recycle/sale-outbound'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import OutboundSearch from './modules/outbound-search.vue'
  import OutboundCreateDialog from './modules/outbound-create-dialog.vue'
  import OutboundDetailDialog from './modules/outbound-detail-dialog.vue'

  defineOptions({ name: 'RecycleWarehouseOutbound' })

  const searchForm = ref<SaleOutboundSearchParams>({
    keyword: undefined,
    status: '',
    exit_type: ''
  })

  const stats = ref<SaleOutboundStats>({
    varieties: 0,
    reusable_parts: 0,
    metal_weight: 0,
    total_value: '¥0',
    pending_outbound: 0
  })

  const createVisible = ref(false)
  const detailVisible = ref(false)
  const detailRecord = ref<SaleOutboundItem | null>(null)
  const exporting = ref(false)

  const statCards = computed(() => [
    { label: '在库品种', value: `${stats.value.varieties}种`, color: '#1677ff' },
    { label: '回用件', value: `${stats.value.reusable_parts}件`, color: '#52C41A' },
    {
      label: '废金属重量',
      value: `${stats.value.metal_weight}吨`,
      color: '#FA8C16'
    },
    { label: '库存价值', value: stats.value.total_value, color: '#722ED1' },
    {
      label: '待出库',
      value: `${stats.value.pending_outbound}单`,
      color: '#FF4D4F'
    }
  ])

  function renderTypeTag(row: SaleOutboundItem) {
    const type = row.exit_type as SaleOutboundType | undefined
    const cfg = type ? SALE_OUTBOUND_TYPE_CONFIG[type] : null
    const label = row.exit_type_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'ob-muted' }, label)
    return h(
      'span',
      { class: 'ob-type-tag', style: { color: cfg.color, background: cfg.bg } },
      label
    )
  }

  function renderStatusTag(row: SaleOutboundItem) {
    const cfg = SALE_OUTBOUND_STATUS_CONFIG[row.status]
    const label = row.status_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'ob-muted' }, label)
    return h(
      'span',
      { class: 'ob-status-tag', style: { color: cfg.color, background: cfg.bg } },
      label
    )
  }

  function openDetail(row: SaleOutboundItem) {
    detailRecord.value = row
    detailVisible.value = true
  }

  async function handleApprove(row: SaleOutboundItem) {
    try {
      await ElMessageBox.confirm(`确认审批通过出库单「${row.exit_no}」？`, '审批通过', {
        type: 'warning',
        confirmButtonText: '确认通过'
      })
    } catch {
      return
    }
    await fetchSaleOutboundApprove(row.id)
    loadStats()
    refreshData()
  }

  async function handleComplete(row: SaleOutboundItem) {
    try {
      await ElMessageBox.confirm(`确认完成出库「${row.exit_no}」？`, '确认出库', {
        type: 'warning',
        confirmButtonText: '确认出库'
      })
    } catch {
      return
    }
    await fetchSaleOutboundComplete(row.id)
    loadStats()
    refreshData()
  }

  function formatAmount(val?: number | string) {
    if (val === undefined || val === null || val === '') return '—'
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0) return '—'
    return `¥${num.toLocaleString()}`
  }

  function buildColumns() {
    const cols: ColumnOption<SaleOutboundItem>[] = [
      {
        prop: 'exit_no',
        label: '出库单号',
        minWidth: 140,
        formatter: (row) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            row.exit_no || '—'
          )
      },
      {
        prop: 'exit_type_text',
        label: '出库类型',
        minWidth: 100,
        formatter: (row) => renderTypeTag(row)
      },
      {
        prop: 'customer_name',
        label: '客户/目的',
        minWidth: 140,
        formatter: (row) => row.customer_name || '—'
      },
      {
        prop: 'items_desc',
        label: '物品明细',
        minWidth: 180,
        formatter: (row) => h('div', { class: 'ob-items-desc' }, row.items_desc || '—')
      },
      {
        prop: 'total_amount',
        label: '合计金额',
        minWidth: 110,
        formatter: (row) => h('span', { class: 'ob-amount' }, formatAmount(row.total_amount))
      },
      {
        prop: 'apply_time',
        label: '申请时间',
        minWidth: 150,
        formatter: (row) => h('span', { class: 'ob-muted' }, row.apply_time || '—')
      },
      {
        prop: 'applicant',
        label: '申请人',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'ob-muted' }, row.applicant || '—')
      },
      {
        prop: 'status_text',
        label: '状态',
        minWidth: 100,
        formatter: (row) => renderStatusTag(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 200,
        align: 'center',
        fixed: 'right',
        formatter: (row) => {
          const buttons = [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openDetail(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'order-action-icon' }), '查看']
            )
          ]
          if (row.status === 'pending_approval') {
            buttons.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn primary',
                  onClick: () => handleApprove(row)
                },
                '审批'
              )
            )
          }
          if (row.status === 'approved') {
            buttons.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn warning',
                  onClick: () => handleComplete(row)
                },
                '确认出库'
              )
            )
          }
          return h('div', { class: 'order-actions' }, buttons)
        }
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
      apiFn: fetchSaleOutboundList,
      apiParams: {
        keyword: searchForm.value.keyword,
        status: searchForm.value.status,
        exit_type: searchForm.value.exit_type,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  async function loadStats() {
    try {
      stats.value = await fetchSaleOutboundStats()
    } catch {
      // ignore
    }
  }

  function handleToolbarSearch(form: SaleOutboundSearchParams) {
    searchForm.value = form
    replaceSearchParams({
      keyword: form.keyword,
      status: form.status,
      exit_type: form.exit_type
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = { keyword: undefined, status: '', exit_type: '' }
    resetSearchParams()
    replaceSearchParams({ keyword: undefined, status: '', exit_type: '' })
    getData()
  }

  function handleCreateSuccess() {
    createVisible.value = false
    loadStats()
    refreshData()
  }

  function handleDetailSuccess() {
    detailVisible.value = false
    detailRecord.value = null
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchSaleOutboundExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '销售出库')
      XLSX.writeFile(book, `销售出库_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './outbound';
</style>
