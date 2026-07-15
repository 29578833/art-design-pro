<template>
  <div class="orders-page art-full-height">
    <div class="order-page-header">
      <div>
        <div class="order-page-title">{{ pageTitle }}</div>
        <div class="order-page-desc">{{ pageDesc }}</div>
      </div>
      <div class="order-page-actions">
        <ElButton :loading="exporting" @click="handleExport" v-ripple>
          <ArtSvgIcon icon="ri:download-2-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton v-if="showCreateButton" type="primary" v-ripple @click="openCreateDialog()">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          创建订单
        </ElButton>
      </div>
    </div>

    <div v-if="showTabBar" class="order-search-panel">
      <OrderTabBar v-model="activeTab" :counts="tabCounts" @change="handleTabChange" />

      <OrderSearch
        v-model="searchForm"
        :active-tab="activeTab"
        embedded
        @search="handleSearch"
        @reset="handleReset"
      />
    </div>

    <OrderSearch
      v-else
      v-model="searchForm"
      :active-tab="activeTab"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 待审核批量操作栏 -->
    <div v-if="showBatchBar" class="order-batch-bar">
      <div class="order-batch-bar-left">
        <span class="order-batch-bar-count">
          已选 <em>{{ selectedRows.length }}</em> 条待审核订单
        </span>
        <ElButton text type="primary" @click="handleSelectAllPage">全选当前页</ElButton>
        <ElButton text @click="clearSelection">取消选择</ElButton>
      </div>
      <ElButton
        type="primary"
        :disabled="!selectedRows.length"
        :loading="batchAuditing"
        @click="handleBatchApprove"
      >
        一键批量审核通过
      </ElButton>
    </div>

    <ElCard
      class="order-table-card art-table-card"
      shadow="never"
      :body-style="{ padding: 0, paddingBottom: '20px' }"
    >
      <ArtTable
        ref="tableRef"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="false"
        :stripe="false"
        row-key="id"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <OrderCreateDialog
      v-model:visible="createDialogVisible"
      :prefill-order="createPrefillOrder"
      @submit="refreshAll"
    />
    <OrderEditDialog
      v-model:visible="editDialogVisible"
      :order-data="editingOrder"
      @submit="refreshAll"
    />
    <LeadDetailDialog
      v-model:visible="leadDetailVisible"
      :order-id="leadDetailOrderId"
      @create-order="handleLeadDetailCreateOrder"
      @refresh="refreshAll"
    />
    <LeadAssignDialog
      v-model:visible="assignDialogVisible"
      :order-id="assignOrderId"
      @success="refreshAll"
    />
    <FormalOrderDetailDialog
      v-model:visible="formalDetailVisible"
      :order-id="formalDetailOrderId"
      @refresh="refreshAll"
    />
    <TowOrderDetailDialog
      v-model:visible="towDetailVisible"
      :order-id="towDetailOrderId"
      @refresh="refreshAll"
    />
    <TowDriverAssignDialog
      v-model:visible="towAssignVisible"
      :order-id="towAssignOrderId"
      :current-driver-id="towAssignDriverId"
      :delivery-address="towAssignDeliveryAddress"
      @success="refreshAll"
    />
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { ColumnOption } from '@/types/component'
  import {
    fetchAuditOrder,
    fetchBatchAudit,
    fetchOrderList,
    fetchOrderListForExport,
    fetchOrderTabCounts,
    fetchUpdateTowStatus
  } from '@/api/recycle/order'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    OrderSearchParams,
    OrderTab,
    OrderTabCount,
    RecycleOrder
  } from '@/types/recycle/order'
  import {
    getOrderDisplayNo,
    getOrderStatusText,
    isLeadOrder,
    isTowOrder,
    resolveOrderTypeStyle
  } from '@/types/recycle/order'
  import * as XLSX from 'xlsx'
  import OrderTabBar from './order-tab-bar.vue'
  import OrderSearch from './order-search.vue'
  import OrderTableActions from './order-table-actions.vue'
  import OrderCreateDialog from './order-create-dialog.vue'
  import OrderEditDialog from './order-edit-dialog.vue'
  import LeadDetailDialog from './lead-detail-dialog.vue'
  import LeadAssignDialog from './lead-assign-dialog.vue'
  import FormalOrderDetailDialog from './formal-order-detail-dialog.vue'
  import TowOrderDetailDialog from './tow-order-detail-dialog.vue'
  import TowDriverAssignDialog from './tow-driver-assign-dialog.vue'

  /** 列表页模式：全部管理 / 待审核 / 线索 */
  export type OrderListMode = 'all' | 'pending_review' | 'lead'

  interface Props {
    mode?: OrderListMode
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: 'all'
  })

  defineOptions({ name: 'OrderListPage' })

  const PAGE_META: Record<OrderListMode, { title: string; desc: string }> = {
    all: {
      title: '订单管理',
      desc: '管理回收订单、线索订单及拖车单'
    },
    pending_review: {
      title: '订单审核',
      desc: '审核客户提交的报废回收申请，支持快速通过、驳回及批量审核操作'
    },
    lead: {
      title: '线索订单',
      desc: '展示所有待跟进线索订单，支持查看详情、指派跟进人及转化为正式回收订单'
    }
  }

  const pageTitle = computed(() => PAGE_META[props.mode].title)
  const pageDesc = computed(() => PAGE_META[props.mode].desc)
  const showTabBar = computed(() => props.mode === 'all')
  const showCreateButton = computed(() => props.mode === 'all')
  const showBatchBar = computed(() => props.mode === 'pending_review')

  const initialTab = ((): OrderTab => {
    if (props.mode === 'pending_review') return 'pending_review'
    if (props.mode === 'lead') return 'lead'
    return 'all'
  })()

  const activeTab = ref<OrderTab>(initialTab)
  const tabCounts = ref<OrderTabCount[]>([])
  const exporting = ref(false)
  const batchAuditing = ref(false)
  const selectedRows = ref<RecycleOrder[]>([])
  const tableRef = ref<{
    elTableRef?: {
      clearSelection: () => void
      toggleRowSelection: (row: RecycleOrder, selected?: boolean) => void
    }
  } | null>(null)

  const createDialogVisible = ref(false)
  const editDialogVisible = ref(false)
  const createPrefillOrder = ref<RecycleOrder | null>(null)
  const editingOrder = ref<RecycleOrder | null>(null)
  const leadDetailVisible = ref(false)
  const leadDetailOrderId = ref<number | null>(null)
  const assignDialogVisible = ref(false)
  const assignOrderId = ref<number | null>(null)
  const formalDetailVisible = ref(false)
  const formalDetailOrderId = ref<number | null>(null)
  const towDetailVisible = ref(false)
  const towDetailOrderId = ref<number | null>(null)
  const towAssignVisible = ref(false)
  const towAssignOrderId = ref<number | null>(null)
  const towAssignDriverId = ref<number | null>(null)
  const towAssignDeliveryAddress = ref('')

  const defaultSearchForm = (): OrderSearchParams => ({
    current: 1,
    size: 20,
    tab: initialTab,
    keyword: undefined,
    progress: 'all',
    orderSource: 'all',
    orderStatus: props.mode === 'pending_review' ? 'pending_review' : 'all',
    batchType: 'all',
    signStatus: 'all',
    leadFollowStatus: props.mode === 'lead' ? 'pending' : 'all',
    leadType: 'all',
    towingStatus: 'all'
  })

  const searchForm = ref<OrderSearchParams>(defaultSearchForm())

  const STATUS_STYLE_MAP: Array<{ keywords: string[]; color: string; bgColor: string }> = [
    { keywords: ['待跟进', '待派单', '拖车待接单'], color: '#FAAD14', bgColor: '#FFFBE6' },
    {
      keywords: ['线索指派', '待审核', '待入厂', '待拖车', '拖车中'],
      color: '#1890FF',
      bgColor: '#E6F7FF'
    },
    {
      keywords: ['审核通过', '已跟进', '已完成', '拖车完成', '已注销'],
      color: '#52C41A',
      bgColor: '#F6FFED'
    },
    { keywords: ['审核驳回', '已驳回', '驳回'], color: '#FF4D4F', bgColor: '#FFF1F0' },
    { keywords: ['入厂查验'], color: '#722ED1', bgColor: '#F9F0FF' },
    { keywords: ['拆解中'], color: '#FA8C16', bgColor: '#FFF7E6' },
    { keywords: ['注销中'], color: '#D4380D', bgColor: '#FFF2E8' }
  ]

  function resolveOrderStatusStyle(row: RecycleOrder) {
    const label = getOrderStatusText(row)

    if (row.order_type === 'customer_order' && row.status === 1) {
      return { color: '#1890FF', bgColor: '#E6F7FF' }
    }

    if (row.order_type === 'tow') {
      const towStatusMap: Record<number, { color: string; bgColor: string }> = {
        1: { color: '#FAAD14', bgColor: '#FFFBE6' },
        2: { color: '#1890FF', bgColor: '#E6F7FF' },
        3: { color: '#1890FF', bgColor: '#E6F7FF' },
        4: { color: '#52C41A', bgColor: '#F6FFED' }
      }
      const towStyle = towStatusMap[row.status]
      if (towStyle) return towStyle
    }

    return (
      STATUS_STYLE_MAP.find((item) => item.keywords.some((keyword) => label.includes(keyword))) || {
        color: '#8C8C8C',
        bgColor: '#FAFAFA'
      }
    )
  }

  function renderTypeTag(row: RecycleOrder) {
    const cfg = resolveOrderTypeStyle(row)
    return h(
      'span',
      {
        class: 'order-type-tag',
        style: { color: cfg.color, background: cfg.bgColor }
      },
      cfg.label
    )
  }

  function renderStatusTag(row: RecycleOrder) {
    const cfg = resolveOrderStatusStyle(row)
    return h(
      'span',
      {
        class: 'order-status-tag',
        style: { color: cfg.color, background: cfg.bgColor }
      },
      getOrderStatusText(row)
    )
  }

  function renderCustomerCell(row: RecycleOrder) {
    return h('div', { class: 'order-customer-cell' }, [
      h('div', { class: 'order-customer-name' }, row.real_name || '—'),
      h('div', { class: 'order-customer-phone' }, row.phone || '—')
    ])
  }

  function renderVehicleCell(row: RecycleOrder) {
    if (isLeadOrder(row) && row.order_type === 'customer_lead') {
      return h('div', { class: 'order-vehicle-cell' }, [
        h('div', { class: 'order-vehicle-empty' }, '暂无车辆信息'),
        h('div', { class: 'order-vehicle-sub' }, '仅客户线索')
      ])
    }
    if (row.batch_display) {
      return h('div', { class: 'order-vehicle-cell' }, [
        h('div', { class: 'order-batch-title' }, row.batch_display),
        h(
          'div',
          { class: 'order-vehicle-sub' },
          [row.brand, row.model].filter(Boolean).join(' ') || '—'
        )
      ])
    }
    return h('div', { class: 'order-vehicle-cell' }, [
      h('span', { class: 'order-plate-tag' }, row.plate_no || '—'),
      h(
        'div',
        { class: 'order-vehicle-sub' },
        [row.brand, row.model].filter(Boolean).join(' ') || '—'
      )
    ])
  }

  function renderDeliveryMethod(row: RecycleOrder) {
    if (row.delivery_type === 'tow') {
      return h('span', { class: 'order-delivery-tag tow' }, [
        h(ArtSvgIcon, { icon: 'ri:truck-line', class: 'order-delivery-icon' }),
        '上门拖车'
      ])
    }
    return h('span', { class: 'order-delivery-tag self' }, '自行送厂')
  }

  function renderEstimatedAmount(row: RecycleOrder) {
    if (row.settlement_amount) {
      return h('span', { class: 'order-price' }, `¥${row.settlement_amount}`)
    }
    return h('span', { class: 'order-muted' }, '待评估')
  }

  function renderActions(row: RecycleOrder) {
    return h(OrderTableActions, {
      row,
      onView: handleView,
      onAudit: handleAudit,
      onApprove: handleApprove,
      onReject: handleReject,
      onAssignLead: handleAssignLead,
      onCreateOrder: handleCreateOrder,
      onEdit: handleEdit,
      onAssignDriver: handleAssignDriver,
      onContactDriver: handleContactDriver,
      onReassignDriver: handleReassignDriver,
      onCompleteTow: handleCompleteTow
    })
  }

  function buildColumns() {
    const tab = activeTab.value
    const isLead = tab === 'lead'
    const isPendingReview = tab === 'pending_review'
    const isFormalOrAll = tab === 'formal_order' || tab === 'all' || tab === 'towing'

    const cols: ColumnOption<RecycleOrder>[] = []

    if (isPendingReview) {
      cols.push({ type: 'selection', width: 48, fixed: 'left' })
    }

    cols.push({
      prop: 'order_no',
      width: 200,
      label: isLead ? '线索编号' : '订单编号',
      formatter: (row: RecycleOrder) =>
        h(
          'a',
          { href: 'javascript:void(0)', class: 'order-no', onClick: () => handleView(row) },
          getOrderDisplayNo(row)
        )
    })

    if (!isPendingReview && !isLead) {
      cols.push({
        prop: 'order_type_text',
        label: '订单类型',
        formatter: (row: RecycleOrder) => renderTypeTag(row)
      })
    }

    if (isLead) {
      cols.push({
        prop: 'lead_type_text',
        label: '线索类型',
        formatter: (row: RecycleOrder) => renderTypeTag(row)
      })
    }

    cols.push(
      {
        prop: 'real_name',
        label: '客户信息',
        formatter: (row: RecycleOrder) => renderCustomerCell(row)
      },
      {
        prop: 'plate_no',
        label: isPendingReview || (isFormalOrAll && !isLead) ? '关联车辆' : '车辆信息',
        formatter: (row: RecycleOrder) => renderVehicleCell(row)
      }
    )

    if (isPendingReview) {
      cols.push(
        {
          prop: 'delivery_type',
          label: '回收方式',
          formatter: (row: RecycleOrder) => renderDeliveryMethod(row)
        },
        {
          prop: 'settlement_amount',
          label: '预估残值',
          formatter: (row: RecycleOrder) => renderEstimatedAmount(row)
        }
      )
    } else {
      cols.push({
        prop: 'current_status_text',
        label: isLead ? '跟进状态' : '当前状态',
        align: 'left',
        formatter: (row: RecycleOrder) => renderStatusTag(row)
      })
    }

    cols.push(
      {
        prop: 'add_time_text',
        label: isLead ? '创建时间' : '提交时间',
        align: 'left',
        formatter: (row: RecycleOrder) =>
          h('span', { class: 'order-time' }, row.add_time_text || '—')
      },
      {
        prop: 'creator_name',
        align: 'center',
        label: isPendingReview ? '提交人' : isLead ? '线索来源' : '创建人',
        formatter: (row: RecycleOrder) =>
          h('span', { class: 'order-creator' }, row.creator_name || '—')
      },
      {
        prop: 'operation',
        label: '操作',
        width: 330,
        align: 'center',
        fixed: 'right',
        formatter: (row: RecycleOrder) => renderActions(row)
      }
    )

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
    refreshData,
    resetColumns
  } = useTable({
    core: {
      apiFn: fetchOrderList,
      apiParams: {
        ...searchForm.value,
        tab: initialTab,
        current: 1,
        size: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  function refreshAll() {
    clearSelection()
    refreshData()
    if (showTabBar.value) loadTabCounts()
  }

  async function loadTabCounts() {
    tabCounts.value = await fetchOrderTabCounts()
  }

  function handleTabChange(tab: OrderTab) {
    searchForm.value = { ...defaultSearchForm(), tab }
    replaceSearchParams({ ...searchForm.value, tab, current: 1 })
    resetColumns?.()
    getData()
  }

  function handleSearch() {
    clearSelection()
    replaceSearchParams({
      ...searchForm.value,
      tab: activeTab.value,
      current: 1
    })
    getData()
  }

  function handleReset() {
    clearSelection()
    resetSearchParams()
    searchForm.value = { ...defaultSearchForm(), tab: activeTab.value }
    replaceSearchParams({ ...searchForm.value, tab: activeTab.value })
    getData()
  }

  function handleSelectionChange(rows: RecycleOrder[]) {
    selectedRows.value = rows
  }

  function clearSelection() {
    selectedRows.value = []
    tableRef.value?.elTableRef?.clearSelection?.()
  }

  function handleSelectAllPage() {
    const elTable = tableRef.value?.elTableRef
    if (!elTable) return
    data.value.forEach((row) => {
      elTable.toggleRowSelection(row, true)
    })
  }

  async function handleBatchApprove() {
    if (!selectedRows.value.length) return
    await ElMessageBox.confirm(
      `确认批量审核通过已选的 ${selectedRows.value.length} 条订单？`,
      '批量审核通过',
      {
        type: 'warning',
        confirmButtonText: '确认通过',
        cancelButtonText: '取消'
      }
    )
    batchAuditing.value = true
    try {
      await fetchBatchAudit({
        ids: selectedRows.value.map((row) => row.id),
        approved: true
      })
      refreshAll()
    } finally {
      batchAuditing.value = false
    }
  }

  function handleView(row: RecycleOrder) {
    if (isLeadOrder(row)) {
      leadDetailOrderId.value = row.id
      leadDetailVisible.value = true
    } else if (isTowOrder(row)) {
      towDetailOrderId.value = row.id
      towDetailVisible.value = true
    } else {
      formalDetailOrderId.value = row.id
      formalDetailVisible.value = true
    }
  }

  function handleLeadDetailCreateOrder(orderId: number) {
    const row = data.value.find((r) => r.id === orderId) || null
    openCreateDialog(row ?? undefined)
  }

  /** 审核详情：打开正式订单详情 */
  function handleAudit(row: RecycleOrder) {
    formalDetailOrderId.value = row.id
    formalDetailVisible.value = true
  }

  function openCreateDialog(row?: RecycleOrder) {
    createPrefillOrder.value = row || null
    createDialogVisible.value = true
  }

  function handleCreateOrder(row: RecycleOrder) {
    openCreateDialog(row)
  }

  function handleEdit(row: RecycleOrder) {
    editingOrder.value = row
    editDialogVisible.value = true
  }

  function openTowAssignDialog(row: RecycleOrder) {
    towAssignOrderId.value = row.id
    towAssignDriverId.value =
      typeof row.driver_id === 'number' || typeof row.driver_id === 'string'
        ? Number(row.driver_id)
        : null
    towAssignDeliveryAddress.value =
      typeof row.delivery_address === 'string' ? row.delivery_address : ''
    towAssignVisible.value = true
  }

  function handleAssignDriver(row: RecycleOrder) {
    openTowAssignDialog(row)
  }

  function handleReassignDriver(row: RecycleOrder) {
    openTowAssignDialog(row)
  }

  function handleContactDriver(row: RecycleOrder) {
    const phone = row.driver_phone || row.assigned_driver_phone || row.phone
    if (!phone) {
      ElMessage.warning('暂无司机联系电话')
      return
    }
    ElMessageBox.alert(`司机电话：${phone}`, '联系司机', { confirmButtonText: '知道了' })
  }

  async function handleApprove(row: RecycleOrder) {
    await ElMessageBox.confirm(`确认审核通过订单 ${getOrderDisplayNo(row)}？`, '审核通过', {
      type: 'warning',
      confirmButtonText: '确认通过',
      cancelButtonText: '取消'
    })
    await fetchAuditOrder({ id: row.id, approved: true })
    refreshAll()
  }

  async function handleReject(row: RecycleOrder) {
    const { value } = await ElMessageBox.prompt(
      '请填写驳回原因',
      `驳回订单 ${getOrderDisplayNo(row)}`,
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '驳回原因不能为空'
      }
    )
    await fetchAuditOrder({ id: row.id, approved: false, remark: value })
    refreshAll()
  }

  function handleAssignLead(row: RecycleOrder) {
    assignOrderId.value = row.id
    assignDialogVisible.value = true
  }

  async function handleCompleteTow(row: RecycleOrder) {
    await ElMessageBox.confirm(`确认拖车任务 ${getOrderDisplayNo(row)} 已完成？`, '确认完成', {
      type: 'warning',
      confirmButtonText: '确认完成',
      cancelButtonText: '取消'
    })
    await fetchUpdateTowStatus(row.id, 4)
    refreshAll()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchOrderListForExport({
        ...searchForm.value,
        tab: activeTab.value
      })

      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }

      const rows = list.map((item) => ({
        订单编号: getOrderDisplayNo(item),
        订单类型: item.order_type_text || item.order_type,
        客户姓名: item.real_name || '',
        联系电话: item.phone || '',
        车牌号: item.plate_no || '',
        当前状态: getOrderStatusText(item),
        创建人: item.creator_name || '',
        提交时间: item.add_time_text || ''
      }))

      const sheet = XLSX.utils.json_to_sheet(rows)
      const book = XLSX.utils.book_new()
      const sheetName =
        props.mode === 'lead'
          ? '线索订单'
          : props.mode === 'pending_review'
            ? '订单审核'
            : '订单列表'
      XLSX.utils.book_append_sheet(book, sheet, sheetName)
      XLSX.writeFile(book, `${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    if (showTabBar.value) loadTabCounts()
  })
</script>

<style lang="scss">
  @use '../orders';
</style>

<style scoped lang="scss">
  .order-batch-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #e6f4ff;
    border: 1px solid #91caff;
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .order-batch-bar-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .order-batch-bar-count {
    font-size: 13px;
    color: #1677ff;

    em {
      margin: 0 2px;
      font-style: normal;
      font-weight: 700;
    }
  }
</style>
