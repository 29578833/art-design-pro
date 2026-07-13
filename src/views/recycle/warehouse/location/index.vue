<template>
  <div class="loc-page art-full-height">
    <div class="loc-page-header">
      <div>
        <div class="loc-page-title">库位管理</div>
        <div class="loc-page-desc">库位分配与占用状态管理</div>
      </div>
      <div v-if="activeTab === 'areas'" class="loc-page-actions">
        <ElButton type="primary" @click="openAreaDialog()">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新增仓库
        </ElButton>
      </div>
    </div>

    <div class="loc-main-tabs">
      <button
        type="button"
        class="loc-main-tab"
        :class="{ 'is-active': activeTab === 'areas' }"
        @click="activeTab = 'areas'"
      >
        仓库列表
        <span class="loc-tab-count">({{ areaList.length }})</span>
      </button>
      <button
        type="button"
        class="loc-main-tab"
        :class="{ 'is-active': activeTab === 'vehicles' }"
        @click="switchToVehicles"
      >
        已入库车辆列表
        <span class="loc-tab-count">({{ vehicleTotal }})</span>
      </button>
    </div>

    <!-- 仓库列表 Tab -->
    <template v-if="activeTab === 'areas'">
      <div class="loc-stats">
        <div v-for="item in summaryCards" :key="item.label" class="loc-stat-card">
          <div class="loc-stat-label">{{ item.label }}</div>
          <div class="loc-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>

      <LocationAreaSearch
        v-model:search-form="areaSearch"
        @search="loadAreas"
        @reset="handleAreaReset"
      />

      <div class="loc-list-page">
        <ElCard
          class="loc-table-card art-table-card"
          shadow="never"
          :body-style="{ padding: 0, paddingBottom: '20px' }"
        >
          <ArtTable
            :loading="areaLoading"
            :data="filteredAreas"
            :columns="areaColumns"
            :show-table-header="false"
            :stripe="false"
            row-key="id"
          />
        </ElCard>
      </div>

      <LocationGridPanel />
    </template>

    <!-- 已入库车辆 Tab -->
    <template v-else>
      <LocationInboundSearch
        v-model:search-form="vehicleSearch"
        :warehouse-options="warehouseNameOptions"
        @search="handleVehicleSearch"
        @reset="handleVehicleReset"
      />

      <div class="loc-list-page">
        <ElCard
          class="loc-table-card art-table-card"
          shadow="never"
          :body-style="{ padding: 0, paddingBottom: '20px' }"
        >
          <ArtTable
            :loading="vehicleLoading"
            :data="vehicleData"
            :columns="vehicleColumns"
            :pagination="vehiclePagination"
            :show-table-header="false"
            :stripe="false"
            row-key="id"
            @pagination:size-change="handleVehicleSizeChange"
            @pagination:current-change="handleVehicleCurrentChange"
          />
        </ElCard>
      </div>
    </template>

    <LocationAreaDialog
      v-model:visible="areaDialogVisible"
      :record="editingArea"
      @success="handleAreaSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessageBox } from 'element-plus'
  import {
    fetchWarehouseAreaOverview,
    fetchWarehouseAreaToggleStatus,
    fetchWarehouseInboundVehicles
  } from '@/api/recycle/warehouse-location'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    WarehouseAreaOverviewItem,
    WarehouseAreaSearchParams,
    WarehouseInboundVehicle,
    WarehouseInboundVehicleSearchParams
  } from '@/types/recycle/warehouse-location'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import LocationAreaSearch from './modules/location-area-search.vue'
  import LocationAreaDialog from './modules/location-area-dialog.vue'
  import LocationGridPanel from './modules/location-grid-panel.vue'
  import LocationInboundSearch from './modules/location-inbound-search.vue'

  defineOptions({ name: 'RecycleWarehouseLocation' })

  type LocTab = 'areas' | 'vehicles'

  const activeTab = ref<LocTab>('areas')
  const areaLoading = ref(false)
  const areaList = ref<WarehouseAreaOverviewItem[]>([])
  const areaSearch = ref<WarehouseAreaSearchParams>({ keyword: undefined, status: '' })
  const areaDialogVisible = ref(false)
  const editingArea = ref<WarehouseAreaOverviewItem | null>(null)
  const vehicleTotal = ref(0)

  const filteredAreas = computed(() => areaList.value)

  const summaryCards = computed(() => {
    const totalCapacity = areaList.value.reduce((s, a) => s + (a.total || 0), 0)
    const totalOccupied = areaList.value.reduce((s, a) => s + (Number(a.occupied) || 0), 0)
    return [
      { label: '仓库总数', value: `${areaList.value.length}个`, color: '#1677ff' },
      { label: '总库位容量', value: `${totalCapacity}个`, color: '#595959' },
      { label: '已占用库位', value: `${totalOccupied}个`, color: '#FA8C16' },
      {
        label: '可用库位',
        value: `${Math.max(totalCapacity - totalOccupied, 0)}个`,
        color: '#52C41A'
      }
    ]
  })

  const warehouseNameOptions = computed(() =>
    areaList.value.filter((a) => a.name).map((a) => ({ label: a.name!, value: a.name! }))
  )

  function getUsageRate(row: WarehouseAreaOverviewItem) {
    const total = row.total || 0
    const occupied = Number(row.occupied) || 0
    if (total <= 0) return 0
    return Math.round((occupied / total) * 100)
  }

  function getRateColor(rate: number) {
    if (rate >= 90) return '#FF4D4F'
    if (rate >= 70) return '#FA8C16'
    return '#52C41A'
  }

  function openAreaDialog(row?: WarehouseAreaOverviewItem) {
    editingArea.value = row || null
    areaDialogVisible.value = true
  }

  async function handleToggleStatus(row: WarehouseAreaOverviewItem) {
    const isActive = row.status === 1
    try {
      await ElMessageBox.confirm(`确认${isActive ? '禁用' : '启用'}仓库「${row.name}」？`, '提示', {
        type: 'warning'
      })
    } catch {
      return
    }
    await fetchWarehouseAreaToggleStatus(row.id)
    loadAreas()
  }

  function buildAreaColumns(): ColumnOption<WarehouseAreaOverviewItem>[] {
    return [
      {
        prop: 'name',
        label: '仓库名称',
        minWidth: 140,
        formatter: (row) => h('span', { class: 'loc-area-name' }, row.name || '—')
      },
      {
        prop: 'tag',
        label: '编码',
        minWidth: 80,
        formatter: (row) =>
          row.tag
            ? h('span', { class: 'loc-code-tag' }, row.tag)
            : h('span', { class: 'loc-muted' }, '—')
      },
      {
        prop: 'total',
        label: '库位容量',
        minWidth: 90,
        formatter: (row) => `${row.total ?? 0} 个`
      },
      {
        prop: 'occupied',
        label: '已用/可用',
        minWidth: 100,
        formatter: (row) => {
          const occupied = Number(row.occupied) || 0
          const available = Math.max((row.total || 0) - occupied, 0)
          const rate = getUsageRate(row)
          return h('span', null, [
            h('span', { style: { color: getRateColor(rate), fontWeight: 600 } }, String(occupied)),
            h('span', { class: 'loc-muted' }, ` / ${available}`)
          ])
        }
      },
      {
        prop: 'usage',
        label: '使用率',
        minWidth: 140,
        formatter: (row) => {
          const rate = getUsageRate(row)
          const color = getRateColor(rate)
          return h('div', { class: 'loc-usage-cell' }, [
            h('div', { class: 'loc-usage-track' }, [
              h('div', {
                class: 'loc-usage-fill',
                style: { width: `${rate}%`, background: color }
              })
            ]),
            h('span', { style: { color, fontWeight: 500 } }, `${rate}%`)
          ])
        }
      },
      {
        prop: 'remark',
        label: '备注',
        minWidth: 140,
        formatter: (row) => h('span', { class: 'loc-muted' }, row.remark || '—')
      },
      {
        prop: 'status',
        label: '状态',
        minWidth: 80,
        formatter: (row) => {
          const active = row.status === 1
          return h(
            'span',
            {
              class: 'loc-status-tag',
              style: {
                color: active ? '#52C41A' : '#8C8C8C',
                background: active ? '#F6FFED' : '#F5F5F5'
              }
            },
            active ? '启用' : '禁用'
          )
        }
      },
      {
        prop: 'operation',
        label: '操作',
        width: 140,
        align: 'center',
        fixed: 'right',
        formatter: (row) =>
          h('div', { class: 'order-actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'order-action-btn default',
                onClick: () => openAreaDialog(row)
              },
              '编辑'
            ),
            h(
              'button',
              {
                type: 'button',
                class: row.status === 1 ? 'order-action-btn warning' : 'order-action-btn primary',
                onClick: () => handleToggleStatus(row)
              },
              row.status === 1 ? '禁用' : '启用'
            )
          ])
      }
    ]
  }

  const areaColumns = computed(() => buildAreaColumns())

  async function loadAreas() {
    areaLoading.value = true
    try {
      areaList.value = (await fetchWarehouseAreaOverview(areaSearch.value)) || []
    } catch {
      areaList.value = []
    } finally {
      areaLoading.value = false
    }
  }

  function handleAreaReset() {
    areaSearch.value = { keyword: undefined, status: '' }
    loadAreas()
  }

  function handleAreaSuccess() {
    areaDialogVisible.value = false
    editingArea.value = null
    loadAreas()
  }

  // —— 已入库车辆 ——
  const vehicleSearch = ref<WarehouseInboundVehicleSearchParams>({
    keyword: undefined,
    vin: undefined,
    order_no: undefined,
    warehouse_name: undefined
  })

  function buildVehicleColumns(): ColumnOption<WarehouseInboundVehicle>[] {
    return [
      {
        prop: 'archive_no',
        label: '档案号',
        minWidth: 130,
        formatter: (row) => h('span', { class: 'order-no' }, row.archive_no || '—')
      },
      {
        prop: 'plate_no',
        label: '车牌号',
        minWidth: 110,
        formatter: (row) => row.plate_no || '—'
      },
      {
        prop: 'brand',
        label: '车辆信息',
        minWidth: 140,
        formatter: (row) => h('span', null, [row.brand, row.model].filter(Boolean).join(' ') || '—')
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'loc-muted' }, row.owner_name || '—')
      },
      {
        prop: 'inspector_name',
        label: '质检员',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'loc-muted' }, row.inspector_name || '—')
      },
      {
        prop: 'warehouse_name',
        label: '仓库',
        minWidth: 110,
        formatter: (row) => row.warehouse_name || '—'
      },
      {
        prop: 'warehouse_slot',
        label: '库位',
        minWidth: 90,
        formatter: (row) =>
          row.warehouse_slot
            ? h('span', { class: 'loc-code-tag' }, row.warehouse_slot)
            : h('span', { class: 'loc-muted' }, '—')
      },
      {
        prop: 'order_no',
        label: '订单号',
        minWidth: 130,
        formatter: (row) => h('span', { class: 'order-no' }, row.order_no || '—')
      },
      {
        prop: 'entry_no',
        label: '入库单号',
        minWidth: 130,
        formatter: (row) => row.entry_no || '—'
      },
      {
        prop: 'entry_time',
        label: '入库时间',
        minWidth: 150,
        formatter: (row) => h('span', { class: 'loc-muted' }, row.entry_time || '—')
      }
    ]
  }

  async function vehicleApiFn(params: WarehouseInboundVehicleSearchParams) {
    const res = await fetchWarehouseInboundVehicles(params)
    vehicleTotal.value = res.total
    return res
  }

  const {
    columns: vehicleColumns,
    data: vehicleData,
    loading: vehicleLoading,
    pagination: vehiclePagination,
    getData: getVehicleData,
    replaceSearchParams: replaceVehicleParams,
    resetSearchParams: resetVehicleParams,
    handleSizeChange: handleVehicleSizeChange,
    handleCurrentChange: handleVehicleCurrentChange
  } = useTable({
    core: {
      apiFn: vehicleApiFn,
      apiParams: {
        keyword: vehicleSearch.value.keyword,
        vin: vehicleSearch.value.vin,
        order_no: vehicleSearch.value.order_no,
        warehouse_name: vehicleSearch.value.warehouse_name,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildVehicleColumns(),
      immediate: false
    }
  })

  function switchToVehicles() {
    activeTab.value = 'vehicles'
    getVehicleData()
  }

  function handleVehicleSearch(form: WarehouseInboundVehicleSearchParams) {
    vehicleSearch.value = form
    replaceVehicleParams({
      keyword: form.keyword,
      vin: form.vin,
      order_no: form.order_no,
      warehouse_name: form.warehouse_name
    })
    getVehicleData()
  }

  function handleVehicleReset() {
    vehicleSearch.value = {
      keyword: undefined,
      vin: undefined,
      order_no: undefined,
      warehouse_name: undefined
    }
    resetVehicleParams()
    replaceVehicleParams({
      keyword: undefined,
      vin: undefined,
      order_no: undefined,
      warehouse_name: undefined
    })
    getVehicleData()
  }

  onMounted(() => {
    loadAreas()
  })
</script>

<style lang="scss">
  @use './location';
</style>
