<template>
  <div class="decision-reports-page art-full-height">
    <div class="decision-header">
      <div>
        <div class="decision-title">数据决策中心</div>
        <div class="decision-desc">报表中心 · 趋势分析 · 经营决策</div>
      </div>
      <div class="decision-nav">
        <button type="button" class="decision-nav-btn is-active">报表中心</button>
        <button type="button" class="decision-nav-btn" @click="goTrends">趋势分析</button>
      </div>
    </div>

    <!-- 报表列表 -->
    <div v-if="!activeReport" class="report-list">
      <div
        v-for="item in REPORT_CARDS"
        :key="item.key"
        class="report-card"
        :class="{ 'is-disabled': !item.available }"
        @click="openReport(item)"
      >
        <div class="report-card-left">
          <div
            class="report-card-icon"
            :style="{ background: `${item.color}15`, color: item.color }"
          >
            <ArtSvgIcon :icon="item.icon" />
          </div>
          <div>
            <div class="report-card-name">{{ item.label }}</div>
            <div class="report-card-desc">{{ item.desc }}</div>
          </div>
        </div>
        <div class="report-card-right">
          <button
            type="button"
            class="report-card-export"
            :disabled="cardExportingKey === item.key"
            @click.stop="handleCardExport(item)"
          >
            <ArtSvgIcon icon="ri:download-line" class="report-card-export-ico" />
            {{ cardExportingKey === item.key ? '导出中' : '导出' }}
          </button>
          <ArtSvgIcon icon="ri:arrow-right-s-line" class="report-card-arrow" />
        </div>
      </div>
    </div>

    <!-- 报表详情 -->
    <div v-else class="report-detail">
      <div class="report-detail-bar">
        <button type="button" class="report-back" @click="activeReport = null"
          >← 返回报表列表</button
        >
        <span class="report-detail-sep">/</span>
        <span class="report-detail-title">{{ activeReportMeta?.label }}</span>
        <ElDatePicker
          v-model="dateRange"
          class="report-detail-date"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :unlink-panels="true"
        />
        <ElButton type="primary" @click="handleQuery">查询</ElButton>
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出Excel
        </ElButton>
      </div>

      <ScrapSummaryPanel
        v-if="activeReport === 'vehicle-summary'"
        ref="scrapPanelRef"
        :start-date="queryRange[0]"
        :end-date="queryRange[1]"
      />
      <SalesPerfPanel
        v-else-if="activeReport === 'salesman-perf'"
        ref="salesPanelRef"
        :start-date="queryRange[0]"
        :end-date="queryRange[1]"
      />
      <div v-else class="report-empty">该报表暂未开放</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { fetchSalesPerformance, fetchScrapSummary } from '@/api/recycle/report'
  import type { ReportKey } from '@/types/recycle/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ScrapSummaryPanel from './modules/scrap-summary-panel.vue'
  import SalesPerfPanel from './modules/sales-perf-panel.vue'

  defineOptions({ name: 'RecycleDecisionReports' })

  const REPORT_CARDS: {
    key: ReportKey
    label: string
    desc: string
    icon: string
    color: string
    available: boolean
  }[] = [
    {
      key: 'vehicle-summary',
      label: '收车汇总报表',
      desc: '按时间段统计收车数量、车辆类型分布',
      icon: 'ri:car-line',
      color: '#1890FF',
      available: true
    },
    {
      key: 'dismantle-output',
      label: '拆解产物统计',
      desc: '各类产物（回用件/废金属/危废）数量和重量',
      icon: 'ri:settings-3-line',
      color: '#722ED1',
      available: false
    },
    {
      key: 'settlement-summary',
      label: '结算汇总报表',
      desc: '按客户/时间段汇总结算金额和付款状态',
      icon: 'ri:money-cny-circle-line',
      color: '#52C41A',
      available: false
    },
    {
      key: 'salesman-perf',
      label: '业务员绩效报表',
      desc: '各业务员收车量、结算金额排行',
      icon: 'ri:user-star-line',
      color: '#FA8C16',
      available: true
    },
    {
      key: 'waste-stat',
      label: '废料管理报表',
      desc: '废铁/废铜/废铝等废料的重量和收益统计',
      icon: 'ri:recycle-line',
      color: '#13C2C2',
      available: false
    }
  ]

  const router = useRouter()
  const activeReport = ref<ReportKey | null>(null)
  const exporting = ref(false)
  const cardExportingKey = ref<ReportKey | null>(null)

  function defaultRange(): [string, string] {
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth(), 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    return [fmt(start), fmt(end)]
  }

  const dateRange = ref<[string, string] | null>(defaultRange())
  const queryRange = ref<[string, string]>(defaultRange())

  const activeReportMeta = computed(() =>
    REPORT_CARDS.find((item) => item.key === activeReport.value)
  )

  const scrapPanelRef = ref<{ reload: () => Promise<void>; exportExcel: () => void } | null>(null)
  const salesPanelRef = ref<{ reload: () => Promise<void>; exportExcel: () => void } | null>(null)

  function openReport(item: (typeof REPORT_CARDS)[number]) {
    if (!item.available) {
      ElMessage.info('该报表暂未开放')
      return
    }
    activeReport.value = item.key
    dateRange.value = defaultRange()
    queryRange.value = defaultRange()
  }

  function handleQuery() {
    if (!dateRange.value || dateRange.value.length !== 2) {
      ElMessage.warning('请选择日期范围')
      return
    }
    queryRange.value = [...dateRange.value] as [string, string]
  }

  function handleExport() {
    exporting.value = true
    try {
      if (activeReport.value === 'vehicle-summary') scrapPanelRef.value?.exportExcel()
      else if (activeReport.value === 'salesman-perf') salesPanelRef.value?.exportExcel()
    } finally {
      exporting.value = false
    }
  }

  async function handleCardExport(item: (typeof REPORT_CARDS)[number]) {
    if (!item.available) {
      ElMessage.info('该报表暂未开放')
      return
    }
    const [start_date, end_date] = defaultRange()
    cardExportingKey.value = item.key
    try {
      if (item.key === 'vehicle-summary') {
        const res = await fetchScrapSummary({ start_date, end_date })
        const rows = (res.monthly || []).map((row) => ({
          月份: row.month,
          收车数量: row.count,
          个人车主: row.personal,
          企业客户: row.enterprise,
          平均价格: row.avg_price,
          总结算额: row.total_amount,
          同比: `${row.yoy}%`
        }))
        if (!rows.length) {
          ElMessage.warning('暂无数据可导出')
          return
        }
        const sheet = XLSX.utils.json_to_sheet(rows)
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book, sheet, '收车汇总')
        XLSX.writeFile(book, `收车汇总_${start_date}_${end_date}.xlsx`)
        ElMessage.success('导出成功')
        return
      }
      if (item.key === 'salesman-perf') {
        const res = await fetchSalesPerformance({ start_date, end_date })
        const rows = (res.list || []).map((row, index) => ({
          排名: index + 1,
          业务员: row.name,
          收车数量: row.count,
          结算金额: row.amount,
          平均单价: row.avg_price,
          完成率: `${row.rate}%`
        }))
        if (!rows.length) {
          ElMessage.warning('暂无数据可导出')
          return
        }
        const sheet = XLSX.utils.json_to_sheet(rows)
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book, sheet, '业务员绩效')
        XLSX.writeFile(book, `业务员绩效_${start_date}_${end_date}.xlsx`)
        ElMessage.success('导出成功')
      }
    } finally {
      cardExportingKey.value = null
    }
  }

  function goTrends() {
    router.push('/recycle/decision/trends')
  }
</script>

<style lang="scss">
  @use './reports';

  .mr-1 {
    margin-right: 4px;
  }
</style>
