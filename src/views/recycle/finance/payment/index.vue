<template>
  <div class="pay-page art-full-height">
    <div class="pay-page-header">
      <div>
        <div class="pay-page-title">付款流水</div>
        <div class="pay-page-desc">结算付款记录查询与导出</div>
      </div>
      <div class="pay-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
      </div>
    </div>

    <div class="pay-stats">
      <div v-for="item in statCards" :key="item.label" class="pay-stat-card">
        <div class="pay-stat-label">{{ item.label }}</div>
        <div class="pay-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <PaymentSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="pay-list-page">
      <ElCard
        class="pay-table-card art-table-card"
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

    <PaymentDetailDialog v-model:visible="detailVisible" :record="detailRecord" />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { fetchPaymentLogExport, fetchPaymentLogList } from '@/api/recycle/payment-log'
  import { fetchSettlementStats } from '@/api/recycle/settlement'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    PaymentLogItem,
    PaymentLogSearchParams,
    PaymentLogStatus
  } from '@/types/recycle/payment-log'
  import type { SettlementStats } from '@/types/recycle/settlement'
  import { PAYMENT_LOG_STATUS_CONFIG } from '@/types/recycle/payment-log'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import PaymentSearch from './modules/payment-search.vue'
  import PaymentDetailDialog from './modules/payment-detail-dialog.vue'

  defineOptions({ name: 'RecycleFinancePayment' })

  const searchForm = ref<PaymentLogSearchParams>({
    keyword: undefined
  })

  const stats = ref<SettlementStats>({
    pending_audit: 0,
    pending_approve: 0,
    pending_pay: 0,
    monthly_settled: 0,
    monthly_total: 0
  })

  const detailVisible = ref(false)
  const detailRecord = ref<PaymentLogItem | null>(null)
  const exporting = ref(false)

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

  function renderStatusTag(row: PaymentLogItem) {
    const cfg = PAYMENT_LOG_STATUS_CONFIG[row.status as PaymentLogStatus]
    const label = row.status_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'pay-muted' }, label)
    return h(
      'span',
      { class: 'pay-status-tag', style: { color: cfg.color, background: cfg.bg } },
      label
    )
  }

  function renderPayMethodTag(row: PaymentLogItem) {
    const method = String(row.pay_method || '')
    const isWechat = method === 'wechat' || row.pay_method_text?.includes('微信')
    const label =
      row.pay_method_text ||
      (method === 'wechat' ? '微信支付' : method === 'bank_transfer' ? '银行转账' : method || '—')
    if (label === '—') return h('span', { class: 'pay-muted' }, '—')
    return h(
      'span',
      {
        class: 'pay-method-tag',
        style: isWechat
          ? { color: '#07C160', background: '#F0FFF4' }
          : { color: '#1890FF', background: '#E6F7FF' }
      },
      label
    )
  }

  function openDetail(row: PaymentLogItem) {
    detailRecord.value = row
    detailVisible.value = true
  }

  function buildColumns() {
    const cols: ColumnOption<PaymentLogItem>[] = [
      {
        prop: 'payment_no',
        label: '付款单号',
        minWidth: 140,
        formatter: (row) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            row.payment_no || '—'
          )
      },
      {
        prop: 'settlement_no',
        label: '结算单号',
        minWidth: 130,
        formatter: (row) => row.settlement_no || '—'
      },
      {
        prop: 'order_no',
        label: '关联订单',
        minWidth: 130,
        formatter: (row) => row.order_no || '—'
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 100,
        formatter: (row) => row.plate_no || '—'
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 100,
        formatter: (row) => row.owner_name || '—'
      },
      {
        prop: 'pay_amount',
        label: '付款金额',
        minWidth: 110,
        formatter: (row) => h('span', { class: 'pay-amount' }, formatMoney(row.pay_amount))
      },
      {
        prop: 'pay_method_text',
        label: '付款方式',
        minWidth: 100,
        formatter: (row) => renderPayMethodTag(row)
      },
      {
        prop: 'pay_time',
        label: '付款时间',
        minWidth: 160,
        formatter: (row) => row.pay_time || '—'
      },
      {
        prop: 'pay_user_name',
        label: '操作人',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'pay-muted' }, row.pay_user_name || '—')
      },
      {
        prop: 'status_text',
        label: '状态',
        minWidth: 110,
        formatter: (row) => renderStatusTag(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 100,
        align: 'center',
        fixed: 'right',
        formatter: (row) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openDetail(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'order-action-icon' }), '详情']
            )
          ])
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
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchPaymentLogList,
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
      stats.value = await fetchSettlementStats()
    } catch {
      // ignore
    }
  }

  function handleToolbarSearch(form: PaymentLogSearchParams) {
    searchForm.value = form
    replaceSearchParams({
      keyword: form.keyword
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = {
      keyword: undefined
    }
    resetSearchParams()
    replaceSearchParams({
      keyword: undefined
    })
    getData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchPaymentLogExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '付款流水')
      XLSX.writeFile(book, `付款流水_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './payment';
</style>
