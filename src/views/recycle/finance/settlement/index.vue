<template>
  <div class="fs-settlement-page art-full-height">
    <div class="fs-page-header">
      <div>
        <div class="fs-page-title">结算单管理</div>
        <div class="fs-page-desc">管理服务费结算单与残值结算单，支持审核流转与支付确认</div>
      </div>
      <div class="fs-page-actions">
        <ElButton
          style="color: #fff; background: #722ed1; border-color: #722ed1"
          @click="openCreate('residual')"
        >
          + 新建残值结算单申请
        </ElButton>
        <ElButton type="primary" @click="openCreate('service_fee')">
          + 新建服务费结算单申请
        </ElButton>
      </div>
    </div>

    <ElCard shadow="never" class="fs-tab-card" :body-style="{ padding: 0 }">
      <div class="fs-nav-tabs">
        <button
          v-for="tab in SETTLEMENT_BILL_NAV_TABS"
          :key="tab.key"
          type="button"
          class="fs-nav-tab"
          :class="{ 'is-active': activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
          <span class="fs-tab-count">{{ tabCounts[tab.key] ?? 0 }}</span>
        </button>
      </div>
      <SettlementSearch
        :search-form="searchForm"
        :show-status-quick="activeTab === 'all'"
        :exporting="exporting"
        @search="handleSearch"
        @reset="handleReset"
        @export="handleExport"
      />
    </ElCard>

    <div class="fs-list-page">
      <ElCard
        class="fs-table-card art-table-card"
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

    <SettlementDetailDialog v-model:visible="detailVisible" :bill-id="detailBillId" />
    <SettlementApproveDialog
      v-model:visible="approveVisible"
      :row="actionRow"
      @success="onActionSuccess"
    />
    <SettlementPayDialog v-model:visible="payVisible" :row="actionRow" @success="onActionSuccess" />
    <SettlementCreateDialog
      v-model:visible="createVisible"
      :bill-type="createType"
      @success="onActionSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchSettlementBillExport,
    fetchSettlementBillList,
    fetchSettlementBillStats
  } from '@/api/recycle/finance-settlement'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    SettlementBillItem,
    SettlementBillNavTab,
    SettlementBillSearchParams,
    SettlementBillType
  } from '@/types/recycle/finance/settlement/finance-settlement'
  import {
    SETTLEMENT_BILL_NAV_TABS,
    SETTLEMENT_BILL_STATUS_CONFIG,
    SETTLEMENT_BILL_TYPE_CONFIG
  } from '@/types/recycle/finance/settlement/finance-settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import SettlementSearch from './modules/settlement-search.vue'
  import SettlementDetailDialog from './modules/settlement-detail-dialog.vue'
  import SettlementApproveDialog from './modules/settlement-approve-dialog.vue'
  import SettlementPayDialog from './modules/settlement-pay-dialog.vue'
  import SettlementCreateDialog from './modules/settlement-create-dialog.vue'

  defineOptions({ name: 'RecycleFinanceSettlement' })

  /** Tab：当前页签 + 各状态数量 */
  const activeTab = ref<SettlementBillNavTab>('all')
  const tabCounts = ref<Record<SettlementBillNavTab, number>>({
    all: 0,
    pending_audit: 0,
    approved: 0,
    rejected: 0,
    pending_pay: 0
  })
  /** Tab 与结算状态枚举映射（all 不限状态） */
  const TAB_STATUS: Record<SettlementBillNavTab, SettlementBillSearchParams['settlement_status']> =
    {
      all: '',
      pending_audit: 1,
      approved: 2,
      rejected: 5,
      pending_pay: 3
    }
  async function loadTabCounts() {
    const stats = await fetchSettlementBillStats()
    tabCounts.value = {
      all: Number(stats.all || 0),
      pending_audit: Number(stats.pending_audit || 0),
      approved: Number(stats.approved || 0),
      rejected: Number(stats.rejected || 0),
      pending_pay: Number(stats.pending_pay || 0)
    }
  }

  /** 列表筛选条件（与 SettlementSearch 同步） */
  const searchForm = ref<SettlementBillSearchParams>({
    settlement_status: '',
    keyword: '',
    applicant: '',
    start_time: '',
    end_time: '',
    settlement_type: ''
  })

  /** 详情弹窗 */
  const detailVisible = ref(false)
  const detailBillId = ref<number | null>(null)
  function openDetail(row: SettlementBillItem) {
    detailBillId.value = row.id
    detailVisible.value = true
  }

  /** 审核 / 付款弹窗（共用当前操作行） */
  const actionRow = ref<SettlementBillItem | null>(null)
  const approveVisible = ref(false)
  function openApprove(row: SettlementBillItem) {
    actionRow.value = row
    approveVisible.value = true
  }
  const payVisible = ref(false)
  function openPay(row: SettlementBillItem) {
    actionRow.value = row
    payVisible.value = true
  }

  /** 新建结算单弹窗 */
  const createVisible = ref(false)
  const createType = ref<SettlementBillType | null>(null)
  function openCreate(type: SettlementBillType) {
    createType.value = type
    createVisible.value = true
  }

  /** 表格：类型 / 状态标签 */
  function renderTypeTag(row: SettlementBillItem) {
    const cfg = SETTLEMENT_BILL_TYPE_CONFIG[row.settlement_type]
    return h(
      'span',
      { class: 'fs-tag', style: { color: cfg.color, background: cfg.bg } },
      cfg.label
    )
  }
  function renderStatusTag(row: SettlementBillItem) {
    const cfg = SETTLEMENT_BILL_STATUS_CONFIG[row.settlement_status]
    return h(
      'span',
      { class: 'fs-tag', style: { color: cfg.color, background: cfg.bg } },
      cfg.label
    )
  }

  function buildColumns(): ColumnOption<SettlementBillItem>[] {
    return [
      {
        prop: 'index',
        label: '序号',
        width: 60,
        align: 'center',
        formatter: (_row, _col, _cell, index) =>
          String((pagination.current - 1) * pagination.size + (index ?? 0) + 1)
      },
      {
        prop: 'contract_no',
        label: '合同编号',
        minWidth: 130,
        formatter: (row) =>
          h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            row.contract_no
          )
      },
      {
        prop: 'settlement_type_text',
        label: '结算单类型',
        minWidth: 120,
        formatter: (row) => renderTypeTag(row)
      },
      { prop: 'charge_type_text', label: '收费类型', minWidth: 100 },
      {
        prop: 'settlement_user_name',
        label: '申请人',
        minWidth: 90,
        formatter: (row) => row.settlement_user_name || row.applicant || '—'
      },
      { prop: 'apply_time', label: '申请时间', minWidth: 150 },
      {
        prop: 'settlement_status_text',
        label: '结算状态',
        minWidth: 100,
        formatter: (row) => renderStatusTag(row)
      },
      {
        prop: 'audit_user_name',
        label: '审核人',
        minWidth: 90,
        formatter: (r) => r.audit_user_name || '—'
      },
      {
        prop: 'audit_time',
        label: '审核时间',
        minWidth: 140,
        formatter: (r) => r.audit_time || '—'
      },
      {
        prop: 'audit_remark',
        label: '财务备注',
        minWidth: 120,
        formatter: (r) => r.audit_remark || '—'
      },
      {
        prop: 'final_price',
        label: '结算金额(元)',
        minWidth: 110,
        formatter: (row) =>
          h('span', { class: 'fs-amount' }, Number(row.final_price || 0).toLocaleString())
      },
      {
        prop: 'operation',
        label: '操作',
        width: 240,
        fixed: 'right',
        align: 'center',
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
                  onClick: () => openApprove(row)
                },
                [
                  h(ArtSvgIcon, { icon: 'ri:checkbox-circle-line', class: 'order-action-icon' }),
                  '审核'
                ]
              )
            )
          }
          if (row.settlement_status === 3) {
            buttons.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn warning',
                  onClick: () => openPay(row)
                },
                [
                  h(ArtSvgIcon, { icon: 'ri:upload-2-line', class: 'order-action-icon' }),
                  '上传凭证'
                ]
              )
            )
          }
          return h('div', { class: 'order-actions' }, buttons)
        }
      }
    ]
  }

  /** 列表分页与请求 */
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
      apiFn: fetchSettlementBillList,
      apiParams: {
        ...searchForm.value,
        page: 1,
        limit: 10
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  /** 将筛选条件写入 useTable 查询参数（Tab 状态优先） */
  function syncApiParams(extra?: Partial<SettlementBillSearchParams>) {
    replaceSearchParams({
      ...searchForm.value,
      settlement_status: TAB_STATUS[activeTab.value] || searchForm.value.settlement_status,
      ...extra
    })
  }

  function switchTab(tab: SettlementBillNavTab) {
    activeTab.value = tab
    searchForm.value.settlement_status = TAB_STATUS[tab]
    syncApiParams()
    getData()
  }

  function handleSearch(form: SettlementBillSearchParams) {
    searchForm.value = { ...form }
    syncApiParams()
    getData()
  }

  function handleReset() {
    searchForm.value = {
      settlement_status: TAB_STATUS[activeTab.value],
      keyword: '',
      applicant: '',
      start_time: '',
      end_time: '',
      settlement_type: ''
    }
    resetSearchParams()
    syncApiParams()
    getData()
  }

  /** 弹窗操作成功后刷新 Tab 计数与列表 */
  async function onActionSuccess() {
    await loadTabCounts()
    refreshData()
  }

  /** 导出 Excel */
  const exporting = ref(false)
  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchSettlementBillExport({
        ...searchForm.value,
        settlement_status: TAB_STATUS[activeTab.value] || searchForm.value.settlement_status
      })
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheet = XLSX.utils.json_to_sheet(list)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '结算单')
      XLSX.writeFile(book, `结算单_${new Date().toISOString().slice(0, 10)}.xlsx`)
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadTabCounts()
  })
</script>

<style lang="scss">
  @use './settlement';
</style>
