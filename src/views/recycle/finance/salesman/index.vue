<template>
  <div class="sm-page art-full-height">
    <div class="sm-page-header">
      <div>
        <div class="sm-page-title">业务员结算统计（本月）</div>
        <div class="sm-page-desc">按本月已付款结算汇总业务员业绩</div>
      </div>
      <div class="sm-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
      </div>
    </div>

    <div class="sm-stats">
      <div v-for="item in statCards" :key="item.label" class="sm-stat-card">
        <div class="sm-stat-label">{{ item.label }}</div>
        <div class="sm-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <div class="sm-list-page">
      <ElCard
        class="sm-table-card art-table-card"
        shadow="never"
        :body-style="{ padding: 0, paddingBottom: '20px' }"
      >
        <ArtTable
          :loading="loading"
          :data="tableData"
          :columns="columns"
          :pagination="undefined"
          :show-table-header="false"
          :stripe="false"
          row-key="business_id"
        />
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage, ElProgress } from 'element-plus'
  import {
    fetchSettlementBusinessStats,
    fetchSettlementBusinessStatsExport,
    fetchSettlementStats
  } from '@/api/recycle/settlement'
  import type { ColumnOption } from '@/types/component'
  import type { SettlementBusinessStatItem, SettlementStats } from '@/types/recycle/settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'RecycleFinanceSalesman' })

  const loading = ref(false)
  const exporting = ref(false)
  const tableData = ref<SettlementBusinessStatItem[]>([])
  const stats = ref<SettlementStats>({
    pending_audit: 0,
    pending_approve: 0,
    pending_pay: 0,
    monthly_settled: 0,
    monthly_total: 0
  })

  const statCards = computed(() => [
    { label: '待财务审核', value: `${stats.value.pending_audit}单`, color: '#FA8C16' },
    { label: '待管理员审批', value: `${stats.value.pending_approve}单`, color: '#722ED1' },
    { label: '待付款', value: `${stats.value.pending_pay}单`, color: '#1677ff' },
    { label: '本月已付款', value: `${stats.value.monthly_settled}单`, color: '#52C41A' },
    {
      label: '本月结算总额',
      value: formatMoney(stats.value.monthly_total),
      color: '#1677ff'
    }
  ])

  function formatMoney(val?: number | string) {
    const num = Number(val)
    if (Number.isNaN(num) || num <= 0) return '¥0'
    return `¥${num.toLocaleString()}`
  }

  function getRankClass(rank?: number) {
    if (rank === 1) return 'sm-rank is-gold'
    if (rank === 2) return 'sm-rank is-silver'
    if (rank === 3) return 'sm-rank is-bronze'
    return 'sm-rank'
  }

  const columns = computed<ColumnOption<SettlementBusinessStatItem>[]>(() => [
    {
      prop: 'rank',
      label: '排名',
      width: 80,
      align: 'center',
      formatter: (row) => h('span', { class: getRankClass(row.rank) }, row.rank ?? '—')
    },
    {
      prop: 'business_name',
      label: '业务员',
      minWidth: 120,
      formatter: (row) => row.business_name || '—'
    },
    {
      prop: 'vehicle_count',
      label: '车辆数',
      minWidth: 90,
      formatter: (row) => row.vehicle_count ?? 0
    },
    {
      prop: 'total_amount',
      label: '结算总额',
      minWidth: 120,
      formatter: (row) => h('span', { class: 'sm-amount' }, formatMoney(row.total_amount))
    },
    {
      prop: 'avg_price',
      label: '平均单价',
      minWidth: 110,
      formatter: (row) => formatMoney(row.avg_price)
    },
    {
      prop: 'completion_rate',
      label: '完成率',
      minWidth: 180,
      formatter: (row) => {
        const rate = Math.min(100, Math.max(0, Number(row.completion_rate) || 0))
        return h('div', { class: 'sm-rate' }, [
          h(ElProgress, {
            percentage: rate,
            strokeWidth: 8,
            showText: false,
            color: rate >= 100 ? '#52C41A' : '#1677ff'
          }),
          h('span', { class: 'sm-rate-text' }, `${rate}%`)
        ])
      }
    },
    {
      prop: 'monthly_target',
      label: '月目标',
      minWidth: 100,
      formatter: (row) => formatMoney(row.monthly_target)
    }
  ])

  async function loadStats() {
    try {
      stats.value = await fetchSettlementStats()
    } catch {
      // ignore
    }
  }

  async function loadData() {
    loading.value = true
    try {
      const list = await fetchSettlementBusinessStats()
      tableData.value = (list || []).map((item, index) => ({
        ...item,
        rank: item.rank ?? index + 1,
        business_id: item.business_id ?? index + 1
      }))
    } catch {
      tableData.value = []
    } finally {
      loading.value = false
    }
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchSettlementBusinessStatsExport()
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '业务员统计')
      XLSX.writeFile(book, `业务员结算统计_${new Date().toISOString().slice(0, 10)}.xlsx`)
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadStats()
    loadData()
  })
</script>

<style lang="scss">
  @use './salesman';
</style>
