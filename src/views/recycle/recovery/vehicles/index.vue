<template>
  <div class="vehicles-page art-full-height">
    <div class="vehicle-page-header">
      <div>
        <div class="vehicle-page-title">车辆档案管理</div>
        <div class="vehicle-page-desc">
          三维并行管理：拖车 · 入厂拆解 · 注销办证，独立流转互不阻塞
        </div>
      </div>
      <div class="vehicle-page-actions">
        <ElButton type="primary" @click="openCreateArchive">
          <ArtSvgIcon icon="ri:add-line" />
          新建车辆档案
        </ElButton>
      </div>
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

      <VehicleSearch
        v-model="searchForm"
        :active-tab="activeTab"
        embedded
        @search="handleSearch"
        @reset="handleReset"
      />
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

    <VehicleDetailDialog v-model:visible="detailVisible" :vehicle-id="detailVehicleId" />

    <VehicleArchiveEditDialog
      v-model:visible="editVisible"
      :mode="archiveMode"
      :vehicle-id="editVehicleId"
      :vehicle-row="editVehicleRow"
      @success="handleEditSuccess"
      @created="handleArchiveCreated"
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
    fetchVehicleAssociateOrder,
    fetchVehicleDelete
  } from '@/api/recycle/vehicle'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type {
    ScrapVehicle,
    VehicleSearchParams,
    VehicleStatusCounts,
    VehicleTab,
    VehicleTabCount
  } from '@/types/recycle/recovery/vehicles/vehicle'
  import VehicleTabBar from './components/VehicleTabBar.vue'
  import VehicleSearch from './components/VehicleSearch.vue'
  import VehicleDetailDialog from './panels/VehicleDetailDialog.vue'
  import VehicleArchiveEditDialog from './dialogs/VehicleArchiveEditDialog.vue'
  import VehicleLinkOrderDialog from './dialogs/VehicleLinkOrderDialog.vue'
  import FormalOrderDetailDialog from '../orders/modules/formal-order-detail-dialog.vue'
  import OrderCreateDialog from '../orders/modules/order-create-dialog.vue'
  import { buildVehicleColumns } from './composables/vehicle-columns'
  import type { OrderSaveResult, RecycleOrder } from '@/types/recycle/recovery/orders/order'

  defineOptions({ name: 'RecycleVehicles' })

  // ----- 公共：Tab / 搜索 -----
  const activeTab = ref<VehicleTab>('all')
  const searchForm = ref<VehicleSearchParams>({
    keyword: '',
    tab: 'all',
    type: ''
  })

  // ----- 车辆详情弹窗 -----
  const detailVisible = ref(false)
  const detailVehicleId = ref(0)

  function openDetail(row: ScrapVehicle) {
    detailVehicleId.value = row.id
    detailVisible.value = true
  }

  // ----- 编辑/新建档案弹窗 -----
  const archiveMode = ref<'create' | 'edit'>('edit')
  const editVisible = ref(false)
  const editVehicleId = ref(0)
  const editVehicleRow = ref<ScrapVehicle | null>(null)

  function openCreateArchive() {
    archiveMode.value = 'create'
    editVehicleId.value = 0
    editVehicleRow.value = null
    editVisible.value = true
  }

  function openEdit(row: ScrapVehicle) {
    archiveMode.value = 'edit'
    editVehicleId.value = row.id
    editVehicleRow.value = row
    editVisible.value = true
  }

  function handleArchiveCreated() {
    getData()
    loadCounts()
  }

  // ----- 回收订单详情弹窗 -----
  const orderDetailVisible = ref(false)
  const orderDetailOrderId = ref<number | null>(null)

  function openOrderDetailFromVehicle(row: ScrapVehicle) {
    if (!row.order_id) {
      ElMessage.warning('该车辆未关联订单')
      return
    }
    orderDetailOrderId.value = row.order_id
    orderDetailVisible.value = true
  }

  // ----- 补充关联订单 -----
  const linkOrderVisible = ref(false)
  const linkOrderVehicle = ref<ScrapVehicle | null>(null)
  const createOrderVisible = ref(false)
  const createOrderPrefill = ref<RecycleOrder | null>(null)
  const pendingLinkVehicleId = ref(0)

  function openLinkOrderDialog(row: ScrapVehicle) {
    linkOrderVehicle.value = row
    linkOrderVisible.value = true
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

  // ----- 列表表格 -----
  function handleDownloadCert(row: ScrapVehicle) {
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${row.owner_sync_djid}`, '_blank')
  }

  async function handleSoftDelete(row: ScrapVehicle) {
    const display = row.vehicle_no || row.plate_no || row.vin || row.id
    try {
      await ElMessageBox.confirm(`确认软删除车辆档案「${display}」？`, '删除', {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
    try {
      await fetchVehicleDelete(row.id)
      getData()
      loadCounts()
    } catch {
      // 删除失败提示由 http 封装统一处理
    }
  }

  function buildColumns() {
    return buildVehicleColumns({
      openDetail,
      openEdit,
      openLinkOrder: openLinkOrderDialog,
      openOrderDetail: openOrderDetailFromVehicle,
      downloadCert: handleDownloadCert,
      softDelete: handleSoftDelete
    })
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

  // ----- 统计卡片 / 待补关联横幅 -----
  const tabCounts = ref<VehicleTabCount[]>([])
  const statusCounts = ref<VehicleStatusCounts>({
    total: 0,
    transport: 0,
    factory: 0,
    cancellation: 0,
    completed: 0
  })

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

  async function loadCounts() {
    const countParams = {
      keyword: searchForm.value.keyword,
      vehicle_type: searchForm.value.vehicle_type,
      tow_status: searchForm.value.tow_status,
      cancel_status: searchForm.value.cancel_status,
      type: searchForm.value.type
    }
    try {
      const [tabs, counts] = await Promise.all([
        fetchVehicleTabCounts(countParams),
        fetchVehicleStatusCounts(countParams)
      ])
      tabCounts.value = tabs
      statusCounts.value = counts
    } catch {
      // 统计失败不阻断列表
    }
  }

  function handleEditSuccess() {
    getData()
    loadCounts()
  }

  function handleLinkOrderSuccess() {
    getData()
    loadCounts()
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

  // ----- Tab / 搜索交互 -----
  function handleTabChange(tab: VehicleTab) {
    activeTab.value = tab
    const cleared: VehicleSearchParams = { ...searchForm.value, tab }
    if (tab !== 'all' && tab !== 'transport') cleared.tow_status = ''
    if (tab !== 'all' && tab !== 'factory') cleared.factory_status = ''
    if (tab !== 'all' && tab !== 'cancellation') cleared.cancel_status = ''
    searchForm.value = cleared
    replaceSearchParams({ ...cleared, current: 1 })
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
    searchForm.value = {
      keyword: '',
      tab: activeTab.value,
      vehicle_type: '',
      tow_status: '',
      factory_status: '',
      cancel_status: '',
      type: ''
    }
    resetSearchParams()
    replaceSearchParams({
      keyword: '',
      tab: activeTab.value,
      vehicle_type: '',
      tow_status: '',
      factory_status: '',
      cancel_status: '',
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
  @use './index';
</style>
