<template>
  <div v-loading="loading" class="sales-perf-panel">
    <div class="report-panel-card">
      <div class="report-panel-title">业务员本期收车量</div>
      <ArtBarChart
        height="220px"
        :data="chartData"
        :x-axis-data="chartLabels"
        bar-width="40%"
        :colors="['#1890FF']"
      />
    </div>

    <div class="report-panel-card" style="padding: 0; margin-top: 12px">
      <ArtTable
        :loading="false"
        :data="list"
        :columns="columns"
        :pagination="false"
        :show-table-header="false"
        :stripe="false"
        row-key="uid"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { fetchSalesPerformance } from '@/api/recycle/report'
  import type { ColumnOption } from '@/types/component'
  import type { SalesPerformanceItem, SalesPerformanceResult } from '@/types/recycle/report'
  import ArtBarChart from '@/components/core/charts/art-bar-chart/index.vue'

  const props = defineProps<{
    startDate: string
    endDate: string
  }>()

  const loading = ref(false)
  const result = ref<SalesPerformanceResult | null>(null)

  const list = computed(() =>
    (result.value?.list || []).map((item, index) => ({
      ...item,
      _rank: index + 1
    }))
  )
  const chartLabels = computed(() => result.value?.chart?.names || [])
  const chartData = computed(() => result.value?.chart?.counts || [])

  function rankClass(rank: number) {
    if (rank === 1) return 'report-rank is-top1'
    if (rank === 2) return 'report-rank is-top2'
    if (rank === 3) return 'report-rank is-top3'
    return 'report-rank'
  }

  const columns = computed<ColumnOption<SalesPerformanceItem & { _rank: number }>[]>(() => [
    {
      prop: '_rank',
      label: '排名',
      width: 80,
      align: 'center',
      formatter: (row) =>
        h('span', { class: rankClass(Number(row._rank || 0)) }, String(row._rank || '—'))
    },
    {
      prop: 'name',
      label: '业务员',
      minWidth: 120,
      formatter: (row) => h('span', null, row.name || '—')
    },
    {
      prop: 'count',
      label: '收车数量',
      minWidth: 100,
      formatter: (row) => h('span', null, `${row.count ?? 0}辆`)
    },
    {
      prop: 'amount',
      label: '结算金额',
      minWidth: 120,
      formatter: (row) =>
        h('span', { class: 'report-amount' }, `¥${Number(row.amount || 0).toLocaleString('zh-CN')}`)
    },
    {
      prop: 'avg_price',
      label: '平均单价',
      minWidth: 110,
      formatter: (row) => h('span', null, `¥${Number(row.avg_price || 0).toLocaleString('zh-CN')}`)
    },
    {
      prop: 'rate',
      label: '完成率',
      minWidth: 160,
      formatter: (row) => {
        const rate = Math.max(0, Math.min(100, Number(row.rate || 0)))
        return h('div', { class: 'report-rate-cell' }, [
          h('div', { class: 'report-rate-bar' }, [
            h('div', { class: 'report-rate-fill', style: { width: `${rate}%` } })
          ]),
          h('span', null, `${rate}%`)
        ])
      }
    }
  ])

  async function loadData() {
    loading.value = true
    try {
      result.value = await fetchSalesPerformance({
        start_date: props.startDate,
        end_date: props.endDate
      })
    } finally {
      loading.value = false
    }
  }

  function exportExcel() {
    if (!list.value.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    const rows = list.value.map((item, index) => ({
      排名: index + 1,
      业务员: item.name,
      收车数量: item.count,
      结算金额: item.amount,
      平均单价: item.avg_price,
      完成率: `${item.rate}%`
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, '业务员绩效')
    XLSX.writeFile(book, `业务员绩效_${props.startDate || ''}_${props.endDate || ''}.xlsx`)
    ElMessage.success('导出成功')
  }

  watch(
    () => [props.startDate, props.endDate],
    () => {
      loadData()
    },
    { immediate: true }
  )

  defineExpose({ reload: loadData, exportExcel })
</script>
