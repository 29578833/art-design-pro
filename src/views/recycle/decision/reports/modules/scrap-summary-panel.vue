<template>
  <div v-loading="loading" class="scrap-summary-panel">
    <div class="report-kpi-grid">
      <div v-for="item in kpiCards" :key="item.label" class="report-kpi-card">
        <div class="report-kpi-label">{{ item.label }}</div>
        <div class="report-kpi-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <div class="report-panel-card" style="margin-top: 12px">
      <div class="report-panel-title">月度收车趋势</div>
      <ArtLineChart
        height="220px"
        :data="chartData"
        :x-axis-data="chartLabels"
        :show-area-color="true"
        :colors="['#1890FF']"
        symbol="circle"
        :symbol-size="6"
        :smooth="true"
        :enable-animation="false"
      />
    </div>

    <div class="report-panel-card" style="padding: 0; margin-top: 12px">
      <ArtTable
        :loading="false"
        :data="monthly"
        :columns="columns"
        :pagination="false"
        :show-table-header="false"
        :stripe="false"
        row-key="month"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { fetchScrapSummary } from '@/api/recycle/report'
  import type { ColumnOption } from '@/types/component'
  import type { ScrapSummaryMonthItem, ScrapSummaryResult } from '@/types/recycle/report'
  import ArtLineChart from '@/components/core/charts/art-line-chart/index.vue'

  const props = defineProps<{
    startDate: string
    endDate: string
  }>()

  const loading = ref(false)
  const summary = ref<ScrapSummaryResult | null>(null)

  const monthly = computed(() => summary.value?.monthly || [])

  const kpiCards = computed(() => {
    const s = summary.value
    const yoy = Number(s?.yoy || 0)
    return [
      {
        label: '本期收车',
        value: `${s?.current_count ?? 0}辆`,
        color: '#1890FF'
      },
      {
        label: '同比增长',
        value: `${yoy >= 0 ? '+' : ''}${yoy}%`,
        color: yoy >= 0 ? '#52C41A' : '#EF4444'
      },
      {
        label: '平均收车价',
        value: `¥${Number(s?.avg_price || 0).toLocaleString('zh-CN')}`,
        color: '#FA8C16'
      },
      {
        label: '总结算金额',
        value: `¥${s?.total_amount || '0'}`,
        color: '#722ED1'
      }
    ]
  })

  const chartLabels = computed(() => [...monthly.value].reverse().map((item) => item.month || ''))
  const chartData = computed(() =>
    [...monthly.value].reverse().map((item) => Number(item.count || 0))
  )

  function formatYoy(val?: number) {
    const n = Number(val || 0)
    const text = `${n >= 0 ? '+' : ''}${n}%`
    return h('span', { class: n >= 0 ? 'report-yoy-up' : 'report-yoy-down' }, text)
  }

  const columns = computed<ColumnOption<ScrapSummaryMonthItem>[]>(() => [
    {
      prop: 'month',
      label: '月份',
      minWidth: 100,
      formatter: (row) => h('span', null, row.month || '—')
    },
    {
      prop: 'count',
      label: '收车数量',
      minWidth: 100,
      formatter: (row) => h('span', null, `${row.count ?? 0}辆`)
    },
    {
      prop: 'personal',
      label: '个人车主',
      minWidth: 100,
      formatter: (row) => h('span', null, `${row.personal ?? 0}辆`)
    },
    {
      prop: 'enterprise',
      label: '企业客户',
      minWidth: 100,
      formatter: (row) => h('span', null, `${row.enterprise ?? 0}辆`)
    },
    {
      prop: 'avg_price',
      label: '平均价格',
      minWidth: 110,
      formatter: (row) => h('span', null, `¥${Number(row.avg_price || 0).toLocaleString('zh-CN')}`)
    },
    {
      prop: 'total_amount',
      label: '总结算额',
      minWidth: 110,
      formatter: (row) => h('span', null, `¥${row.total_amount || '0'}`)
    },
    {
      prop: 'yoy',
      label: '同比',
      minWidth: 90,
      formatter: (row) => formatYoy(row.yoy)
    }
  ])

  async function loadData() {
    loading.value = true
    try {
      summary.value = await fetchScrapSummary({
        start_date: props.startDate,
        end_date: props.endDate
      })
    } finally {
      loading.value = false
    }
  }

  function exportExcel() {
    if (!monthly.value.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    const rows = monthly.value.map((item) => ({
      月份: item.month,
      收车数量: item.count,
      个人车主: item.personal,
      企业客户: item.enterprise,
      平均价格: item.avg_price,
      总结算额: item.total_amount,
      同比: `${item.yoy}%`
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, '收车汇总')
    XLSX.writeFile(book, `收车汇总_${props.startDate || ''}_${props.endDate || ''}.xlsx`)
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
