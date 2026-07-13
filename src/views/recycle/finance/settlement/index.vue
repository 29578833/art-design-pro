<template>
  <div class="stl-page art-full-height">
    <div class="stl-page-header">
      <div>
        <div class="stl-page-title">结算列表</div>
        <div class="stl-page-desc">结算申请 → 财务审核 → 管理员审批 → 付款完结</div>
      </div>
      <div class="stl-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
      </div>
    </div>

    <div class="stl-stats">
      <div v-for="item in statCards" :key="item.label" class="stl-stat-card">
        <div class="stl-stat-label">{{ item.label }}</div>
        <div class="stl-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <SettlementSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="stl-list-page">
      <ElCard
        class="stl-table-card art-table-card"
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

    <SettlementDetailDialog
      v-model:visible="detailVisible"
      :record="detailRecord"
      @success="handleActionSuccess"
      @pay="openPay"
    />

    <SettlementPayDialog
      v-model:visible="payVisible"
      :record="payRecord"
      @success="handleActionSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import {
    fetchSettlementApprove,
    fetchSettlementAudit,
    fetchSettlementExport,
    fetchSettlementList,
    fetchSettlementReject,
    fetchSettlementStats
  } from '@/api/recycle/settlement'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    SettlementItem,
    SettlementSearchParams,
    SettlementStats,
    SettlementStatus
  } from '@/types/recycle/settlement'
  import { SETTLEMENT_STATUS_CONFIG } from '@/types/recycle/settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import SettlementSearch from './modules/settlement-search.vue'
  import SettlementDetailDialog from './modules/settlement-detail-dialog.vue'
  import SettlementPayDialog from './modules/settlement-pay-dialog.vue'

  defineOptions({ name: 'RecycleFinanceSettlement' })

  const searchForm = ref<SettlementSearchParams>({
    keyword: undefined,
    settlement_status: ''
  })

  const stats = ref<SettlementStats>({
    pending_audit: 0,
    pending_approve: 0,
    pending_pay: 0,
    monthly_settled: 0,
    monthly_total: 0
  })

  const detailVisible = ref(false)
  const detailRecord = ref<SettlementItem | null>(null)
  const payVisible = ref(false)
  const payRecord = ref<SettlementItem | null>(null)
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

  function renderStatusTag(row: SettlementItem) {
    const cfg = SETTLEMENT_STATUS_CONFIG[row.settlement_status as SettlementStatus]
    const label = row.settlement_status_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'stl-muted' }, label)
    return h(
      'span',
      {
        class: 'stl-status-tag',
        style: { color: cfg.color, background: cfg.bg, borderColor: cfg.color }
      },
      label
    )
  }

  function openDetail(row: SettlementItem) {
    detailRecord.value = row
    detailVisible.value = true
  }

  function openPay(row: SettlementItem) {
    payRecord.value = row
    payVisible.value = true
  }

  async function handleAudit(row: SettlementItem) {
    try {
      await ElMessageBox.confirm(`确认审核通过结算单「${row.settlement_no}」？`, '财务审核', {
        type: 'warning',
        confirmButtonText: '确认通过'
      })
    } catch {
      return
    }
    await fetchSettlementAudit(row.id)
    handleActionSuccess()
  }

  async function handleApprove(row: SettlementItem) {
    try {
      await ElMessageBox.confirm(`确认审批通过结算单「${row.settlement_no}」？`, '管理员审批', {
        type: 'warning',
        confirmButtonText: '确认通过'
      })
    } catch {
      return
    }
    await fetchSettlementApprove(row.id)
    handleActionSuccess()
  }

  async function handleReject(row: SettlementItem) {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回结算', {
        type: 'warning',
        confirmButtonText: '确认驳回',
        inputPattern: /\S+/,
        inputErrorMessage: '请填写驳回原因'
      })
      await fetchSettlementReject(row.id, value)
      handleActionSuccess()
    } catch {
      // cancel
    }
  }

  function buildColumns() {
    const cols: ColumnOption<SettlementItem>[] = [
      {
        prop: 'settlement_no',
        label: '结算单号',
        minWidth: 140,
        formatter: (row) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            row.settlement_no || '—'
          )
      },
      {
        prop: 'order_no',
        label: '关联订单',
        minWidth: 130,
        formatter: (row) => h('span', { class: 'order-no' }, row.order_no || '—')
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row) => row.plate_no || '—'
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 120,
        formatter: (row) =>
          h('div', { class: 'stl-owner-cell' }, [
            h(
              'div',
              { class: 'stl-owner-name', title: row.owner_name || '' },
              row.owner_name || '—'
            ),
            row.owner_type_text ? h('div', { class: 'stl-muted' }, row.owner_type_text) : null
          ])
      },
      {
        prop: 'base_price',
        label: '基础价值',
        minWidth: 100,
        formatter: (row) => formatMoney(row.base_price ?? row.vehicle_price)
      },
      {
        prop: 'deduction_price',
        label: '扣款',
        minWidth: 90,
        formatter: (row) => {
          const num = Number(row.deduction_price)
          if (!num) return h('span', { class: 'stl-muted' }, '—')
          return h('span', { class: 'stl-deduct' }, `-¥${Math.abs(num).toLocaleString()}`)
        }
      },
      {
        prop: 'subsidy_price',
        label: '补贴',
        minWidth: 90,
        formatter: (row) => {
          const num = Number(row.subsidy_price)
          if (!num) return h('span', { class: 'stl-muted' }, '—')
          return h('span', { class: 'stl-subsidy' }, `+¥${Math.abs(num).toLocaleString()}`)
        }
      },
      {
        prop: 'final_price',
        label: '最终金额',
        minWidth: 110,
        formatter: (row) => h('span', { class: 'stl-amount' }, formatMoney(row.final_price))
      },
      {
        prop: 'business_name',
        label: '业务员',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'stl-muted' }, row.business_name || '—')
      },
      {
        prop: 'settlement_status_text',
        label: '状态',
        minWidth: 110,
        formatter: (row) => renderStatusTag(row)
      },
      {
        prop: 'operation',
        label: '操作',
        width: 240,
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
              [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'order-action-icon' }), '详情']
            )
          ]
          if (row.settlement_status === 1) {
            buttons.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn primary',
                  onClick: () => handleAudit(row)
                },
                '审核'
              )
            )
          }
          if (row.settlement_status === 2) {
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
          if (row.settlement_status === 3) {
            buttons.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn primary',
                  onClick: () => openPay(row)
                },
                [
                  h(ArtSvgIcon, { icon: 'ri:money-cny-circle-line', class: 'order-action-icon' }),
                  '付款'
                ]
              )
            )
          }
          if ([1, 2, 3].includes(row.settlement_status)) {
            buttons.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn warning',
                  onClick: () => handleReject(row)
                },
                [
                  h(ArtSvgIcon, { icon: 'ri:close-circle-line', class: 'order-action-icon' }),
                  '驳回'
                ]
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
      apiFn: fetchSettlementList,
      apiParams: {
        keyword: searchForm.value.keyword,
        settlement_status: searchForm.value.settlement_status,
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

  function handleToolbarSearch(form: SettlementSearchParams) {
    searchForm.value = form
    replaceSearchParams({
      keyword: form.keyword,
      settlement_status: form.settlement_status
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = {
      keyword: undefined,
      settlement_status: ''
    }
    resetSearchParams()
    replaceSearchParams({
      keyword: undefined,
      settlement_status: ''
    })
    getData()
  }

  function handleActionSuccess() {
    detailVisible.value = false
    payVisible.value = false
    detailRecord.value = null
    payRecord.value = null
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchSettlementExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '结算列表')
      XLSX.writeFile(book, `结算列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './settlement';
</style>
