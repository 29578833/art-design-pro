<template>
  <div class="quality-queue-page">
    <ElCard
      class="quality-table-card art-table-card"
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
</template>

<script setup lang="ts">
  import { fetchQualityQueue } from '@/api/recycle/quality'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type { QualityQueueItem, QualityQueueParams } from '@/types/recycle/quality'
  import { QUEUE_STATUS_CONFIG } from '@/types/recycle/quality'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: QualityQueueParams
  }

  interface Emits {
    (e: 'startInspection', item: QualityQueueItem): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  defineOptions({ name: 'QualityQueuePage' })

  const defaultSearchForm = (): QualityQueueParams => ({
    keyword: undefined,
    queue_status: undefined
  })

  function renderStatusTag(row: QualityQueueItem) {
    const cfg = QUEUE_STATUS_CONFIG[row.queue_status]
    if (!cfg) return h('span', { class: 'order-muted' }, '—')
    return h(
      'span',
      {
        class: 'order-status-tag',
        style: { color: cfg.color, background: cfg.bg, borderColor: cfg.color }
      },
      cfg.label
    )
  }

  function renderWaitDuration(row: QualityQueueItem) {
    const duration = row.wait_duration || '—'
    const isOverdue = row.wait_hours !== undefined && row.wait_hours > 4
    return h(
      'span',
      {
        style: {
          color: isOverdue ? '#FF4D4F' : '#4B5563',
          fontWeight: isOverdue ? 600 : 400,
          fontSize: '14px'
        }
      },
      duration
    )
  }

  function renderActions(row: QualityQueueItem) {
    const status = row.queue_status
    const canStart = status === 'pending' || status === 'overdue'
    const canContinue = status === 'in_progress'

    if (!canStart && !canContinue) return h('span', { class: 'order-muted' }, '—')

    const label = canContinue ? '继续质检' : '开始质检'
    return h('div', { class: 'order-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: canContinue ? 'order-action-btn ghost' : 'order-action-btn primary',
          onClick: () => emit('startInspection', row)
        },
        [
          h(ArtSvgIcon, { icon: 'ri:clipboard-line', class: 'order-action-icon' }),
          h('span', null, label)
        ]
      )
    ])
  }

  function buildColumns() {
    const cols: ColumnOption<QualityQueueItem>[] = [
      {
        prop: 'inspection_no',
        label: '编号',
        minWidth: 130,
        formatter: (row: QualityQueueItem) =>
          h('span', { class: 'order-creator' }, row.inspection_no || '—')
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row: QualityQueueItem) =>
          h('span', { class: 'order-plate-tag' }, row.plate_no || '—')
      },
      {
        prop: 'brand_model',
        label: '品牌车型',
        minWidth: 140,
        formatter: (row: QualityQueueItem) => row.brand_model || '—'
      },
      {
        prop: 'vehicle_type_text',
        label: '车辆类型',
        minWidth: 100,
        formatter: (row: QualityQueueItem) => row.vehicle_type_text || '—'
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 100,
        formatter: (row: QualityQueueItem) => row.owner_name || '—'
      },
      {
        prop: 'arrival_time',
        label: '到场时间',
        minWidth: 140,
        formatter: (row: QualityQueueItem) =>
          h('span', { class: 'order-time' }, row.arrival_time || '—')
      },
      {
        prop: 'wait_duration',
        label: '等待时长',
        minWidth: 100,
        formatter: (row: QualityQueueItem) => renderWaitDuration(row)
      },
      {
        prop: 'queue_status_text',
        label: '状态',
        minWidth: 120,
        formatter: (row: QualityQueueItem) => renderStatusTag(row)
      },
      {
        prop: 'inspector_name',
        label: '质检员',
        minWidth: 100,
        formatter: (row: QualityQueueItem) => row.inspector_name || '—'
      },
      {
        prop: 'operation',
        label: '操作',
        width: 150,
        align: 'center',
        fixed: 'right',
        formatter: (row: QualityQueueItem) => renderActions(row)
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
      apiFn: fetchQualityQueue,
      apiParams: {
        keyword: props.searchForm.keyword,
        queue_status: props.searchForm.queue_status,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  function handleSearch(form?: QualityQueueParams) {
    const params = form ?? props.searchForm
    replaceSearchParams({
      keyword: params.keyword,
      queue_status: params.queue_status
    })
    getData()
  }

  function handleReset() {
    const emptyForm = defaultSearchForm()
    resetSearchParams()
    replaceSearchParams(emptyForm)
    getData()
  }

  defineExpose({ refreshData, handleSearch, handleReset })
</script>
