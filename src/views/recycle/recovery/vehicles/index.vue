<template>
  <div class="vehicles-page art-full-height">
    <div class="vehicle-page-header">
      <div>
        <div class="vehicle-page-title">车辆档案管理</div>
        <div class="vehicle-page-desc">
          三维并行管理：拖车 · 入厂拆解 · 注销办证，独立流转互不阻塞
        </div>
      </div>
      <div class="vehicle-page-actions" />
    </div>

    <div v-if="pendingLinkCount > 0" class="vehicle-pending-banner">
      <ArtSvgIcon icon="ri:error-warning-line" class="vehicle-pending-banner-icon" />
      <span class="vehicle-pending-banner-text">
        当前有 <strong>{{ pendingLinkCount }}</strong>
        条车辆档案已完成质检，但尚未关联回收订单，请及时处理补充。
      </span>
      <button type="button" class="vehicle-pending-banner-btn" @click="handleViewPendingLink">
        查看待处理
      </button>
    </div>

    <div class="vehicle-stats">
      <div
        v-for="item in statCards"
        :key="item.label"
        class="vehicle-stat-card"
        :class="{
          'is-alert': item.alert,
          'is-clickable': item.type === 'no_order'
        }"
        @click="item.type === 'no_order' ? handleStatCardClick(item.type) : undefined"
      >
        <div class="vehicle-stat-label">{{ item.label }}</div>
        <div class="vehicle-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <div class="vehicle-search-panel">
      <VehicleTabBar v-model="activeTab" :counts="tabCounts" @change="handleTabChange" />

      <VehicleSearch v-model="searchForm" embedded @search="handleSearch" @reset="handleReset" />
    </div>

    <ElCard
      class="vehicle-table-card art-table-card"
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

    <VehicleDetailDialog
      v-model:visible="detailVisible"
      :vehicle-id="detailVehicleId"
      :initial-dim-status="detailDimStatus"
    />

    <VehicleArchiveEditDialog
      v-model:visible="editVisible"
      :vehicle-id="editVehicleId"
      :vehicle-row="editVehicleRow"
      @success="handleEditSuccess"
    />

    <FormalOrderDetailDialog v-model:visible="orderDetailVisible" :order-id="orderDetailOrderId" />

    <VehicleLinkOrderDialog
      v-model:visible="linkOrderVisible"
      :vehicle="linkOrderVehicle"
      @linked="handleLinkOrderSuccess"
      @create-order="handleCreateOrderForLink"
    />

    <OrderCreateDialog
      v-model:visible="createOrderVisible"
      :prefill-order="createOrderPrefill"
      @submit="handleCreateOrderSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    fetchVehicleList,
    fetchVehicleStatusCounts,
    fetchVehicleTabCounts,
    fetchVehicleAssociateOrder
  } from '@/api/recycle/vehicle'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage } from 'element-plus'
  import type {
    ScrapVehicle,
    VehicleDimStatus,
    VehicleSearchParams,
    VehicleStatusCounts,
    VehicleTab,
    VehicleTabCount
  } from '@/types/recycle/recovery/vehicles/vehicle'
  import VehicleTabBar from './modules/vehicle-tab-bar.vue'
  import VehicleSearch from './modules/vehicle-search.vue'
  import VehicleDetailDialog from './modules/vehicle-detail/index.vue'
  import VehicleArchiveEditDialog from './modules/vehicle-archive-edit-dialog.vue'
  import VehicleLinkOrderDialog from './modules/vehicle-link-order-dialog.vue'
  import FormalOrderDetailDialog from '../orders/modules/formal-order-detail-dialog.vue'
  import OrderCreateDialog from '../orders/modules/order-create-dialog.vue'
  import type { OrderSaveResult, RecycleOrder } from '@/types/recycle/recovery/orders/order'

  defineOptions({ name: 'RecycleVehicles' })

  const activeTab = ref<VehicleTab>('all')
  const tabCounts = ref<VehicleTabCount[]>([])
  const statusCounts = ref<VehicleStatusCounts>({
    total: 0,
    transport: 0,
    factory: 0,
    cancellation: 0,
    completed: 0
  })

  const searchForm = ref<VehicleSearchParams>({
    keyword: '',
    tab: 'all',
    type: ''
  })

  const detailVisible = ref(false)
  const detailVehicleId = ref(0)
  const detailDimStatus = ref<VehicleDimStatus | undefined>()

  const editVisible = ref(false)
  const editVehicleId = ref(0)
  const editVehicleRow = ref<ScrapVehicle | null>(null)

  const orderDetailVisible = ref(false)
  const orderDetailOrderId = ref<number | null>(null)

  const linkOrderVisible = ref(false)
  const linkOrderVehicle = ref<ScrapVehicle | null>(null)

  const createOrderVisible = ref(false)
  const createOrderPrefill = ref<RecycleOrder | null>(null)
  const pendingLinkVehicleId = ref(0)

  const pendingLinkCount = computed(() => statusCounts.value.no_order_qc_done || 0)

  const statCards = computed(() => [
    { label: '档案总量', value: statusCounts.value.total, color: '#4169FF', type: '' as const },
    { label: '拖车阶段', value: statusCounts.value.transport, color: '#FA8C16', type: '' as const },
    { label: '入厂拆解', value: statusCounts.value.factory, color: '#722ED1', type: '' as const },
    {
      label: '注销办证中',
      value: statusCounts.value.cancellation,
      color: '#13C2C2',
      type: '' as const
    },
    { label: '已完结', value: statusCounts.value.completed, color: '#52C41A', type: '' as const },
    {
      label: '待补关联订单',
      value: statusCounts.value.no_order_qc_done || 0,
      color: '#FF4D4F',
      type: 'no_order' as const,
      alert: (statusCounts.value.no_order_qc_done || 0) > 0
    }
  ])

  function isPendingLinkOrder(row: ScrapVehicle) {
    return !row.order_id && !row.order_no
  }

  function openLinkOrderDialog(row: ScrapVehicle) {
    linkOrderVehicle.value = row
    linkOrderVisible.value = true
  }

  function renderDimStatus(row: ScrapVehicle) {
    const dim = row.dim_status
    if (!dim) {
      return h('span', { class: 'text-gray-400' }, row.status_text || '—')
    }
    const items = [
      { key: 'tow', icon: 'ri:truck-line', data: dim.tow },
      { key: 'factory', icon: 'ri:box-3-line', data: dim.factory },
      { key: 'cancel', icon: 'ri:file-list-3-line', data: dim.cancel }
    ]
    return h(
      'div',
      { class: 'vehicle-dim-status' },
      items.map((item) =>
        h('div', { class: 'vehicle-dim-row', key: item.key }, [
          h(ArtSvgIcon, { icon: item.icon, class: 'vehicle-dim-icon' }),
          h(
            'span',
            {
              class: 'vehicle-dim-badge',
              style: {
                color: item.data?.color || '#8C8C8C',
                background: item.data?.bg || '#F5F5F5'
              }
            },
            item.data?.label || '—'
          )
        ])
      )
    )
  }

  function openDetail(row: ScrapVehicle) {
    detailVehicleId.value = row.id
    detailDimStatus.value = row.dim_status
    detailVisible.value = true
  }

  function openEdit(row: ScrapVehicle) {
    editVehicleId.value = row.id
    editVehicleRow.value = row
    editVisible.value = true
  }

  function handleDownloadCert(row: ScrapVehicle) {
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${row.id}`, '_blank')
  }

  function openOrderDetailFromVehicle(row: ScrapVehicle) {
    if (!row.order_id) {
      ElMessage.warning('该车辆未关联订单')
      return
    }
    orderDetailOrderId.value = row.order_id
    orderDetailVisible.value = true
  }

  function renderLinkedOrderCell(row: ScrapVehicle) {
    if (row.order_no || row.order_id) {
      return h('div', { class: 'vehicle-order-cell' }, [
        h(
          'a',
          {
            href: 'javascript:void(0)',
            class: 'order-no',
            onClick: () => openOrderDetailFromVehicle(row)
          },
          row.order_no || '—'
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'vehicle-order-modify-btn',
            onClick: () => openLinkOrderDialog(row)
          },
          '修改'
        )
      ])
    }
    if (isPendingLinkOrder(row)) {
      return h('div', { class: 'vehicle-order-cell pending' }, [
        h('span', { class: 'vehicle-pending-link-tag' }, [
          h(ArtSvgIcon, { icon: 'ri:error-warning-line', class: 'vehicle-pending-link-icon' }),
          '待补关联订单'
        ]),
        h(
          'button',
          {
            type: 'button',
            class: 'vehicle-link-order-btn',
            onClick: () => openLinkOrderDialog(row)
          },
          '补充关联订单'
        )
      ])
    }
    return h('span', { class: 'text-gray-400' }, '—')
  }

  function buildColumns() {
    return [
      {
        prop: 'vehicle_no',
        label: '档案号',
        minWidth: 120,
        formatter: (row: ScrapVehicle) => {
          const no = row.vehicle_no || row.archive_no || '—'
          return h(
            'a',
            {
              href: 'javascript:void(0)',
              class: 'order-no',
              onClick: () => openDetail(row)
            },
            no
          )
        }
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row: ScrapVehicle) => row.plate_no || '—'
      },
      {
        prop: 'brand_model',
        label: '品牌车型',
        minWidth: 140,
        formatter: (row: ScrapVehicle) =>
          row.brand_model || [row.brand, row.model].filter(Boolean).join(' ') || '—'
      },
      {
        prop: 'vehicle_type_text',
        label: '车辆类型',
        minWidth: 100,
        formatter: (row: ScrapVehicle) => row.vehicle_type_text || row.fuel_type_text || '—'
      },
      {
        prop: 'owner_display',
        label: '车主信息',
        minWidth: 140,
        formatter: (row: ScrapVehicle) =>
          h('div', { class: 'vehicle-owner-cell' }, [
            h('div', { class: 'vehicle-owner-name' }, row.owner_name || row.owner_display || '—'),
            h('div', { class: 'vehicle-owner-phone' }, row.owner_phone || '')
          ])
      },
      {
        prop: 'dim_status',
        label: '三维度状态',
        minWidth: 140,
        formatter: (row: ScrapVehicle) => renderDimStatus(row)
      },
      {
        prop: 'order_no',
        label: '关联订单',
        minWidth: 150,
        formatter: (row: ScrapVehicle) => renderLinkedOrderCell(row)
      },
      {
        prop: 'update_time_text',
        label: '最后更新',
        minWidth: 140,
        formatter: (row: ScrapVehicle) => row.update_time_text || row.add_time_text || '—'
      },
      {
        prop: 'operation',
        label: '操作',
        width: 320,
        align: 'center',
        fixed: 'right',
        formatter: (row: ScrapVehicle) => {
          const actions = [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openDetail(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:eye-line', class: 'order-action-icon' }), '查看']
            )
          ]
          // 已提交商务部时不显示编辑（对齐 admin）
          if (Number(row.is_submitted_commerce) !== 1) {
            actions.push(
              h(
                'button',
                {
                  type: 'button',
                  class: 'order-action-btn primary',
                  onClick: () => openEdit(row)
                },
                [h(ArtSvgIcon, { icon: 'ri:edit-line', class: 'order-action-icon' }), '编辑档案']
              )
            )
          }
          actions.push(
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => handleDownloadCert(row)
              },
              [h(ArtSvgIcon, { icon: 'ri:download-line', class: 'order-action-icon' }), '下载证明']
            )
          )
          return h('div', { class: 'order-actions' }, actions)
        }
      }
    ]
  }

  const {
    data,
    loading,
    columns,
    pagination,
    getData,
    replaceSearchParams,
    handleSizeChange,
    handleCurrentChange,
    resetSearchParams
  } = useTable({
    core: {
      apiFn: fetchVehicleList,
      apiParams: {
        ...searchForm.value,
        tab: 'all',
        type: '',
        current: 1,
        size: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  async function loadCounts() {
    try {
      const [tabs, counts] = await Promise.all([
        fetchVehicleTabCounts({ keyword: searchForm.value.keyword }),
        fetchVehicleStatusCounts({ keyword: searchForm.value.keyword })
      ])
      tabCounts.value = tabs
      statusCounts.value = counts
    } catch {
      // 统计失败不阻断列表
    }
  }

  function handleLinkOrderSuccess() {
    getData()
    loadCounts()
  }

  function handleCreateOrderForLink() {
    if (!linkOrderVehicle.value) return
    const vehicle = linkOrderVehicle.value
    pendingLinkVehicleId.value = vehicle.id
    createOrderPrefill.value = {
      id: 0,
      order_type: 'staff_order',
      status: 0,
      plate_no: vehicle.plate_no,
      vin: vehicle.vin,
      brand: vehicle.brand,
      model: vehicle.model,
      real_name: vehicle.owner_name,
      phone: vehicle.owner_phone
    } as RecycleOrder
    linkOrderVisible.value = false
    createOrderVisible.value = true
  }

  async function handleCreateOrderSuccess(result?: OrderSaveResult) {
    createOrderVisible.value = false
    if (!pendingLinkVehicleId.value || !result?.id) {
      getData()
      loadCounts()
      return
    }
    try {
      await fetchVehicleAssociateOrder({
        vehicle_id: pendingLinkVehicleId.value,
        order_id: result.id
      })
    } finally {
      pendingLinkVehicleId.value = 0
      createOrderPrefill.value = null
      getData()
      loadCounts()
    }
  }

  function handleStatCardClick(type: VehicleSearchParams['type']) {
    if (type === searchForm.value.type) return
    searchForm.value = { ...searchForm.value, type }
    replaceSearchParams({ ...searchForm.value, tab: activeTab.value, current: 1 })
    getData()
  }

  function handleViewPendingLink() {
    activeTab.value = 'all'
    searchForm.value = { ...searchForm.value, tab: 'all', type: 'no_order' }
    replaceSearchParams({ ...searchForm.value, tab: 'all', type: 'no_order', current: 1 })
    getData()
  }

  function handleEditSuccess() {
    getData()
    loadCounts()
  }

  // function refreshAll() {
  //   refreshData()
  //   loadCounts()
  // }

  function handleTabChange(tab: VehicleTab) {
    activeTab.value = tab
    searchForm.value = { ...searchForm.value, tab }
    replaceSearchParams({ ...searchForm.value, tab, current: 1 })
    getData()
  }

  function handleSearch() {
    replaceSearchParams({
      ...searchForm.value,
      tab: activeTab.value,
      type: searchForm.value.type || '',
      current: 1
    })
    getData()
    loadCounts()
  }

  function handleReset() {
    searchForm.value = { keyword: '', tab: activeTab.value, type: '' }
    resetSearchParams()
    replaceSearchParams({
      keyword: '',
      tab: activeTab.value,
      type: '',
      current: 1,
      size: 20
    })
    getData()
    loadCounts()
  }

  onMounted(() => {
    loadCounts()
  })
</script>
<style lang="scss">
  @use './vehicles';
</style>
