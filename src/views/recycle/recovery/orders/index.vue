<template>
  <div class="orders-page art-full-height">
    <div class="order-page-header">
      <div>
        <div class="order-page-title">订单管理</div>
        <div class="order-page-desc">管理回收订单、线索订单及拖车单</div>
      </div>
      <div class="order-page-actions">
        <ElButton :loading="exporting" @click="handleExport" v-ripple>
          <ArtSvgIcon icon="ri:download-2-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton type="primary" v-ripple @click="openCreateDialog()">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          创建订单
        </ElButton>
      </div>
    </div>

    <OrderTabBar v-model="activeTab" :counts="tabCounts" @change="handleTabChange" />

    <OrderSearch
      v-model="searchForm"
      :active-tab="activeTab"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard
      class="order-table-card art-table-card"
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
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    fetchAssignLeadFollow,
    fetchAuditOrder,
    fetchLeadFollowPersons,
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
    resolveOrderTypeStyle
  } from '@/types/recycle/order'
  import * as XLSX from 'xlsx'
  import OrderTabBar from './modules/order-tab-bar.vue'
  import OrderSearch from './modules/order-search.vue'
  import OrderTableActions from './modules/order-table-actions.vue'
  import OrderCreateDialog from './modules/order-create-dialog.vue'
  import OrderEditDialog from './modules/order-edit-dialog.vue'

  defineOptions({ name: 'RecycleOrders' })

  const activeTab = ref<OrderTab>('all')
  const tabCounts = ref<OrderTabCount[]>([])
  const exporting = ref(false)
  const createDialogVisible = ref(false)
  const editDialogVisible = ref(false)
  const createPrefillOrder = ref<RecycleOrder | null>(null)
  const editingOrder = ref<RecycleOrder | null>(null)

  const defaultSearchForm = (): OrderSearchParams => ({
    current: 1,
    size: 20,
    tab: 'all',
    keyword: undefined,
    progress: 'all',
    orderSource: 'all',
    orderStatus: 'all',
    batchType: 'all',
    signStatus: 'all',
    leadFollowStatus: 'all',
    leadType: 'all',
    towingStatus: 'all'
  })

  const searchForm = ref<OrderSearchParams>(defaultSearchForm())

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
    return h('span', { class: 'order-status-tag plain' }, getOrderStatusText(row))
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
      return h('span', { class: 'order-delivery-tag tow' }, '上门拖车')
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

    const cols = [
      {
        prop: 'order_no',
        label: isLead ? '线索编号' : '订单编号',
        formatter: (row: RecycleOrder) => h('span', { class: 'order-no' }, getOrderDisplayNo(row))
      }
    ]

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
        label: isFormalOrAll && !isLead ? '关联车辆' : '车辆信息',
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
        align: 'center' as const,
        formatter: (row: RecycleOrder) => renderStatusTag(row)
      })
    }

    cols.push(
      {
        prop: 'add_time_text',
        label: isLead ? '创建时间' : '提交时间',
        formatter: (row: RecycleOrder) =>
          h('span', { class: 'order-time' }, row.add_time_text || '—')
      },
      {
        prop: 'creator_name',
        label: isPendingReview ? '提交人' : isLead ? '线索来源' : '创建人',
        formatter: (row: RecycleOrder) =>
          h('span', { class: 'order-creator' }, row.creator_name || '—')
      },
      {
        prop: 'operation',
        label: '操作',
        align: 'center' as const,
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
        current: 1,
        size: 20,
        tab: 'all',
        ...searchForm.value
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  function refreshAll() {
    refreshData()
    loadTabCounts()
  }

  async function loadTabCounts() {
    tabCounts.value = await fetchOrderTabCounts()
  }

  function handleTabChange(tab: OrderTab) {
    searchForm.value = { ...defaultSearchForm(), tab }
    replaceSearchParams({ tab, current: 1, ...searchForm.value })
    resetColumns?.()
    getData()
  }

  function handleSearch() {
    replaceSearchParams({
      ...searchForm.value,
      tab: activeTab.value,
      current: 1
    })
    getData()
  }

  function handleReset() {
    resetSearchParams()
    searchForm.value = { ...defaultSearchForm(), tab: activeTab.value }
    replaceSearchParams({ tab: activeTab.value, ...searchForm.value })
    getData()
  }

  function handleView(row: RecycleOrder) {
    ElMessage.info(`查看订单：${getOrderDisplayNo(row)}`)
  }

  function handleAudit(row: RecycleOrder) {
    ElMessage.info(`审核详情：${getOrderDisplayNo(row)}`)
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

  function handleAssignDriver(row: RecycleOrder) {
    ElMessage.info(`指派司机：${getOrderDisplayNo(row)}`)
  }

  function handleReassignDriver(row: RecycleOrder) {
    ElMessage.info(`重新指派司机：${getOrderDisplayNo(row)}`)
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

  async function handleAssignLead(row: RecycleOrder) {
    const persons = await fetchLeadFollowPersons()
    if (!persons.length) {
      ElMessage.warning('暂无可用跟进人')
      return
    }
    const hint = persons.map((item) => `${item.nickname}（UID: ${item.uid}）`).join('、')
    const { value } = await ElMessageBox.prompt(`可选跟进人：${hint}`, '指派跟进人', {
      confirmButtonText: '确认指派',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入跟进人 UID'
    })
    const followUid = Number(value)
    if (!followUid) {
      ElMessage.warning('请输入有效的跟进人 UID')
      return
    }
    await fetchAssignLeadFollow({ id: row.id, followUid })
    refreshAll()
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
      XLSX.utils.book_append_sheet(book, sheet, '订单列表')
      XLSX.writeFile(book, `订单列表_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './orders';
</style>
