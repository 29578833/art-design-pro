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
        <ElButton type="primary" v-ripple>
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
    STATUS_COLOR,
    getOrderCreator,
    getOrderCustomerInfo,
    getOrderDisplayName,
    getOrderStatusText,
    getOrderVehicleInfo,
    resolveOrderTypeStyle
  } from '@/types/recycle/order'
  import * as XLSX from 'xlsx'
  import OrderTabBar from './modules/order-tab-bar.vue'
  import OrderSearch from './modules/order-search.vue'
  import OrderTableActions from './modules/order-table-actions.vue'

  defineOptions({ name: 'RecycleOrders' })

  const activeTab = ref<OrderTab>('all')
  const tabCounts = ref<OrderTabCount[]>([])
  const exporting = ref(false)

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
    const label = getOrderStatusText(row)
    const cfg = STATUS_COLOR[row.status] || { text: '#8C8C8C', bg: '#FAFAFA' }
    return h(
      'span',
      {
        class: 'order-status-tag',
        style: { color: cfg.text, background: cfg.bg }
      },
      label
    )
  }

  function renderCustomerCell(row: RecycleOrder) {
    const info = getOrderCustomerInfo(row)
    return h('div', { class: 'order-customer-cell' }, [
      h('div', { class: 'order-customer-name' }, info.name),
      h('div', { class: 'order-customer-phone' }, info.phone)
    ])
  }

  function renderVehicleCell(row: RecycleOrder) {
    if (row.orderType === 'lead' && row.leadType === 'customer') {
      return h('div', { class: 'order-vehicle-cell' }, [
        h('div', { class: 'order-vehicle-empty' }, '暂无车辆信息'),
        h('div', { class: 'order-vehicle-sub' }, '仅客户线索')
      ])
    }
    if ((row.orderType === 'customer' || row.orderType === 'staff') && row.isBatch) {
      return h('div', { class: 'order-vehicle-cell' }, [
        h('div', { class: 'order-batch-title' }, `批量 · ${row.vehicleCount ?? 3} 台`),
        h('div', { class: 'order-vehicle-sub' }, getOrderVehicleInfo(row))
      ])
    }
    return h('div', { class: 'order-vehicle-cell' }, [
      h('span', { class: 'order-plate-tag' }, getOrderDisplayName(row)),
      h('div', { class: 'order-vehicle-sub' }, getOrderVehicleInfo(row))
    ])
  }

  function renderDeliveryMethod(row: RecycleOrder) {
    if (row.deliveryMethod === 'tow') {
      return h('span', { class: 'order-delivery-tag tow' }, '上门拖车')
    }
    return h('span', { class: 'order-delivery-tag self' }, '自行送厂')
  }

  function renderEstimatedAmount(row: RecycleOrder) {
    if (row.estimatedAmount) {
      return h('span', { class: 'order-price' }, `¥${row.estimatedAmount}`)
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
        prop: 'id',
        label: isLead ? '线索编号' : '订单编号',
        formatter: (row: RecycleOrder) => h('span', { class: 'order-no' }, row.id)
      }
    ]

    if (!isPendingReview && !isLead) {
      cols.push({
        prop: 'orderType',
        label: '订单类型',
        formatter: (row: RecycleOrder) => renderTypeTag(row)
      })
    }

    if (isLead) {
      cols.push({
        prop: 'leadType',
        label: '线索类型',
        formatter: (row: RecycleOrder) => renderTypeTag(row)
      })
    }

    cols.push(
      {
        prop: 'customerName',
        label: '客户信息',
        formatter: (row: RecycleOrder) => renderCustomerCell(row)
      },
      {
        prop: 'plateNumber',
        label: isFormalOrAll && !isLead ? '关联车辆' : '车辆信息',
        formatter: (row: RecycleOrder) => renderVehicleCell(row)
      }
    )

    if (isPendingReview) {
      cols.push(
        {
          prop: 'deliveryMethod',
          label: '回收方式',
          formatter: (row: RecycleOrder) => renderDeliveryMethod(row)
        },
        {
          prop: 'estimatedAmount',
          label: '预估残值',
          formatter: (row: RecycleOrder) => renderEstimatedAmount(row)
        }
      )
    } else {
      cols.push({
        prop: 'status',
        label: isLead ? '跟进状态' : '当前状态',
        align: 'center' as const,
        formatter: (row: RecycleOrder) => renderStatusTag(row)
      })
    }

    cols.push(
      {
        prop: 'createTime',
        label: isLead ? '创建时间' : '提交时间',
        formatter: (row: RecycleOrder) => h('span', { class: 'order-time' }, row.createTime)
      },
      {
        prop: 'createdBy',
        label: isPendingReview ? '提交人' : isLead ? '线索来源' : '创建人',
        formatter: (row: RecycleOrder) =>
          h('span', { class: 'order-creator' }, getOrderCreator(row))
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
    ElMessage.info(`查看订单：${row.id}`)
  }

  function handleAudit(row: RecycleOrder) {
    ElMessage.info(`审核详情：${row.id}`)
  }

  function handleCreateOrder(row: RecycleOrder) {
    ElMessage.info(`创建订单：${row.id}`)
  }

  function handleEdit(row: RecycleOrder) {
    ElMessage.info(`编辑订单：${row.id}`)
  }

  function handleAssignDriver(row: RecycleOrder) {
    ElMessage.info(`指派司机：${row.id}`)
  }

  function handleReassignDriver(row: RecycleOrder) {
    ElMessage.info(`重新指派司机：${row.id}`)
  }

  function handleContactDriver(row: RecycleOrder) {
    const phone = row.driverPhone || row.customerPhone
    if (!phone) {
      ElMessage.warning('暂无司机联系电话')
      return
    }
    ElMessageBox.alert(`司机电话：${phone}`, '联系司机', { confirmButtonText: '知道了' })
  }

  async function handleApprove(row: RecycleOrder) {
    await ElMessageBox.confirm(`确认审核通过订单 ${row.id}？`, '审核通过', {
      type: 'warning',
      confirmButtonText: '确认通过',
      cancelButtonText: '取消'
    })
    await fetchAuditOrder({ id: row.rawId, approved: true })
    refreshAll()
  }

  async function handleReject(row: RecycleOrder) {
    const { value } = await ElMessageBox.prompt('请填写驳回原因', `驳回订单 ${row.id}`, {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '驳回原因不能为空'
    })
    await fetchAuditOrder({ id: row.rawId, approved: false, remark: value })
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
    await fetchAssignLeadFollow({ id: row.rawId, followUid })
    refreshAll()
  }

  async function handleCompleteTow(row: RecycleOrder) {
    await ElMessageBox.confirm(`确认拖车任务 ${row.id} 已完成？`, '确认完成', {
      type: 'warning',
      confirmButtonText: '确认完成',
      cancelButtonText: '取消'
    })
    await fetchUpdateTowStatus(row.rawId, 4)
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

      const rows = list.map((item) => {
        const customer = getOrderCustomerInfo(item)
        return {
          编号: item.id,
          订单类型: item.orderType,
          客户姓名: customer.name,
          联系电话: customer.phone,
          车牌号: item.plateNumber,
          当前状态: getOrderStatusText(item),
          创建人: getOrderCreator(item),
          提交时间: item.createTime
        }
      })

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
