<template>
  <div v-loading="loading" class="sales-perf-panel">
    <div class="report-filter-bar">
      <ElDatePicker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :unlink-panels="true"
        class="report-filter-date"
      />
      <ElButton type="text" @click="handleReset">重置</ElButton>
      <ElButton :loading="exporting" @click="exportExcel">
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />
        导出Excel
      </ElButton>
    </div>

    <div class="report-panel-card">
      <div class="report-panel-title">业务员本期收车量</div>
      <ArtBarChart
        height="220px"
        :data="chartData"
        :x-axis-data="chartLabels"
        :bar-width="36"
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
  import type {
    SalesPerformanceItem,
    SalesPerformanceResult
  } from '@/types/recycle/decision/reports/report'
  import ArtBarChart from '@/components/core/charts/art-bar-chart/index.vue'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { defaultReportDateRange } from '../../utils'

  const dateRange = ref<[string, string]>(defaultReportDateRange())
  const queryRange = ref<[string, string]>(defaultReportDateRange())
  const exporting = ref(false)

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
        start_date: queryRange.value[0],
        end_date: queryRange.value[1]
      })
    } finally {
      loading.value = false
    }
  }

  function handleReset() {
    dateRange.value = defaultReportDateRange()
  }

  watch(dateRange, (range) => {
    if (range && range.length === 2) {
      queryRange.value = [...range]
      loadData()
    }
  })

  function exportExcel() {
    exporting.value = true
    try {
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
      XLSX.writeFile(
        book,
        `业务员绩效_${queryRange.value[0] || ''}_${queryRange.value[1] || ''}.xlsx`
      )
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadData()
  })
</script>

<style lang="scss" scoped>
  .report-filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .report-filter-date {
    width: 260px;
  }

  .mr-1 {
    margin-right: 4px;
  }
</style>
