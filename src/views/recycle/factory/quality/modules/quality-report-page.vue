<template>
  <div class="quality-report-page">
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
        row-key="id"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { fetchQualityReportList } from '@/api/recycle/quality'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type { QualityReportItem, QualitySearchParams } from '@/types/recycle/quality'
  import { QC_RESULT_CONFIG } from '@/types/recycle/quality'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: QualitySearchParams
  }

  interface Emits {
    (e: 'viewReport', id: number): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  defineOptions({ name: 'QualityReportPage' })

  const defaultSearchForm = (): QualitySearchParams => ({
    keyword: undefined,
    result: undefined
  })

  function renderResultTag(row: QualityReportItem) {
    const cfg = QC_RESULT_CONFIG[row.result]
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

  function renderMissingCount(row: QualityReportItem) {
    const count = row.missing_count ?? 0
    return h(
      'span',
      {
        style: {
          fontWeight: count > 0 ? 600 : 400,
          color: count > 0 ? '#FF4D4F' : '#4B5563'
        }
      },
      `${count}项`
    )
  }

  function renderMissingDeduction(row: QualityReportItem) {
    const amount = Number(row.missing_deduction ?? 0)
    return h(
      'span',
      {
        style: {
          fontWeight: amount > 0 ? 600 : 400,
          color: amount > 0 ? '#FF4D4F' : '#4B5563'
        }
      },
      `¥${amount.toFixed(2)}`
    )
  }

  function renderActions(row: QualityReportItem) {
    return h('div', { class: 'order-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'order-action-btn default',
          onClick: () => emit('viewReport', row.id)
        },
        [
          h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'order-action-icon' }),
          h('span', null, '查看报告')
        ]
      )
    ])
  }

  function buildColumns() {
    const cols: ColumnOption<QualityReportItem>[] = [
      {
        prop: 'check_no',
        label: '质检编号',
        minWidth: 140,
        formatter: (row: QualityReportItem) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => emit('viewReport', row.id)
            },
            row.check_no || '—'
          )
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row: QualityReportItem) =>
          h('span', { class: 'order-plate-tag' }, row.plate_no || '—')
      },
      {
        prop: 'brand_model',
        label: '品牌车型',
        minWidth: 140,
        formatter: (row: QualityReportItem) => row.brand_model || '—'
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 100,
        formatter: (row: QualityReportItem) => row.owner_name || '—'
      },
      {
        prop: 'inspector',
        label: '质检员',
        minWidth: 100,
        formatter: (row: QualityReportItem) => row.inspector || '—'
      },
      {
        prop: 'missing_count',
        label: '缺件项数',
        width: 90,
        formatter: (row: QualityReportItem) => renderMissingCount(row)
      },
      {
        prop: 'missing_deduction',
        label: '缺件扣款',
        width: 110,
        formatter: (row: QualityReportItem) => renderMissingDeduction(row)
      },
      {
        prop: 'check_time',
        label: '质检时间',
        minWidth: 140,
        formatter: (row: QualityReportItem) =>
          h('span', { class: 'order-time' }, row.check_time || '—')
      },
      {
        prop: 'result',
        label: '质检结果',
        width: 90,
        formatter: (row: QualityReportItem) => renderResultTag(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 140,
        align: 'center',
        fixed: 'right',
        formatter: (row: QualityReportItem) => renderActions(row)
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
      apiFn: fetchQualityReportList,
      apiParams: {
        keyword: props.searchForm.keyword,
        result: props.searchForm.result,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  function handleSearch(form?: QualitySearchParams) {
    const params = form ?? props.searchForm
    replaceSearchParams({
      keyword: params.keyword,
      result: params.result
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
