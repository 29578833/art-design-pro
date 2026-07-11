<template>
  <div class="work-page art-full-height">
    <div class="work-page-header">
      <div>
        <div class="work-page-title">拆解管理</div>
        <div class="work-page-desc">拆解工单管理：创建即待拆解，线下完成后操作进入待缴库流程</div>
      </div>
      <div class="work-page-actions">
        <ElButton :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出
        </ElButton>
        <ElButton type="primary" @click="createVisible = true">
          <ArtSvgIcon icon="ri:add-line" class="mr-1" />
          新建拆解工单
        </ElButton>
      </div>
    </div>

    <div class="work-stats">
      <div v-for="item in statCards" :key="item.label" class="work-stat-card">
        <div class="work-stat-icon" :style="{ background: item.bg }">
          <ArtSvgIcon :icon="item.icon" :style="{ color: item.color, fontSize: '20px' }" />
        </div>
        <div>
          <div class="work-stat-label">{{ item.label }}</div>
          <div class="work-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <WorkSearch
      v-model:search-form="searchForm"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <div class="work-list-page">
      <ElCard
        class="work-table-card art-table-card"
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

    <WorkCreateDialog v-model:visible="createVisible" @success="handleCreateSuccess" />

    <WorkDetailDialog
      v-model:visible="detailVisible"
      :plate-id="detailPlateId"
      @success="handleDetailSuccess"
    />

    <WorkPreprocessDialog
      v-model:visible="preprocessVisible"
      :plate-id="preprocessPlateId"
      :readonly="preprocessReadonly"
      @success="handlePreprocessSuccess"
    />
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { fetchPlateCounts, fetchPlateExport, fetchPlateList } from '@/api/recycle/plate'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/hooks/core/useTable'
  import type {
    PlateItem,
    PlateSearchParams,
    PlateStats,
    PlateVehicleType
  } from '@/types/recycle/plate'
  import {
    PLATE_PREPROCESS_STATUS_CONFIG,
    PLATE_STATUS_CONFIG,
    PLATE_VEHICLE_TYPE_CONFIG
  } from '@/types/recycle/plate'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import WorkSearch from './modules/work-search.vue'
  import WorkCreateDialog from './modules/work-create-dialog.vue'
  import WorkDetailDialog from './modules/work-detail-dialog.vue'
  import WorkPreprocessDialog from './modules/work-preprocess-dialog.vue'

  defineOptions({ name: 'RecycleDismantleWork' })

  const searchForm = ref<PlateSearchParams>({
    keyword: undefined,
    status: ''
  })

  const stats = ref<PlateStats>({
    pending: 0,
    preprocess_done: 0,
    completed: 0,
    monthly: 0
  })

  const statCards = computed(() => [
    {
      label: '待拆解',
      value: stats.value.pending,
      color: '#FA8C16',
      bg: '#FFF7E6',
      icon: 'ri:time-line'
    },
    {
      label: '预处理完成',
      value: stats.value.preprocess_done,
      color: '#722ED1',
      bg: '#F9F0FF',
      icon: 'ri:settings-3-line'
    },
    {
      label: '已完成',
      value: stats.value.completed,
      color: '#52C41A',
      bg: '#F6FFED',
      icon: 'ri:checkbox-circle-line'
    },
    {
      label: '本月工单',
      value: stats.value.monthly,
      color: '#1677ff',
      bg: '#E6F7FF',
      icon: 'ri:file-list-3-line'
    }
  ])

  const createVisible = ref(false)
  const detailVisible = ref(false)
  const detailPlateId = ref<number>()
  const preprocessVisible = ref(false)
  const preprocessPlateId = ref<number>()
  const preprocessReadonly = ref(false)
  const exporting = ref(false)

  function renderVehicleTypeTag(row: PlateItem) {
    const type = row.vehicle_type as PlateVehicleType | undefined
    const cfg = type ? PLATE_VEHICLE_TYPE_CONFIG[type] : null
    const label = row.vehicle_type_text || '—'
    if (!cfg) return h('span', { class: 'order-muted' }, label)
    return h(
      'span',
      {
        class: 'work-type-tag',
        style: { color: cfg.color, background: cfg.bg }
      },
      label
    )
  }

  function renderPreprocessTag(row: PlateItem) {
    const key = row.preprocess_status || 'pending'
    const cfg = PLATE_PREPROCESS_STATUS_CONFIG[key]
    const label = row.preprocess_status_text || cfg?.label || '待预处理'
    if (!cfg) {
      return h('span', { class: 'order-muted' }, label)
    }
    return h(
      'span',
      {
        class: 'work-preprocess-tag',
        style: { color: cfg.color, background: cfg.bg }
      },
      label
    )
  }

  function renderStatusTag(row: PlateItem) {
    const cfg = PLATE_STATUS_CONFIG[row.status as 0 | 1]
    const label = row.status_text || cfg?.label || '—'
    if (!cfg) return h('span', { class: 'order-muted' }, label)
    return h(
      'span',
      {
        class: 'order-status-tag',
        style: { color: cfg.color, background: cfg.bg, borderColor: cfg.color }
      },
      label
    )
  }

  function renderQcConclusion(row: PlateItem) {
    if (row.qc_result) return row.qc_result
    if (row.is_normal_weigh === 1) return '称重正常'
    if (row.is_normal_weigh === 0) return '称重异常'
    return row.remark || '—'
  }

  function openDetail(row: PlateItem) {
    detailPlateId.value = row.id
    detailVisible.value = true
  }

  function openPreprocess(row: PlateItem) {
    preprocessPlateId.value = row.id
    preprocessReadonly.value = row.preprocess_status === 'completed'
    preprocessVisible.value = true
  }

  function renderActions(row: PlateItem) {
    const preprocessDone = row.preprocess_status === 'completed'
    return h('div', { class: 'order-actions' }, [
      h(
        'button',
        {
          type: 'button',
          class: 'order-action-btn primary',
          onClick: () => openDetail(row)
        },
        '拆解工单'
      ),
      h(
        'button',
        {
          type: 'button',
          class: preprocessDone
            ? 'order-action-btn preprocess-done'
            : 'order-action-btn preprocess-pending',
          onClick: () => openPreprocess(row)
        },
        '预处理工序'
      )
    ])
  }

  function buildColumns() {
    const cols: ColumnOption<PlateItem>[] = [
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
        formatter: (row) => h('span', { class: 'order-plate-tag' }, row.plate_no || '—')
      },
      {
        prop: 'vehicle_type_text',
        label: '车辆类型',
        minWidth: 100,
        formatter: (row) => renderVehicleTypeTag(row)
      },
      {
        prop: 'owner_name',
        label: '车主',
        minWidth: 90,
        formatter: (row) => row.owner_name || '—'
      },
      {
        prop: 'is_normal_weigh',
        label: '质检结论',
        minWidth: 110,
        formatter: (row) => h('span', { class: 'order-muted' }, renderQcConclusion(row))
      },
      {
        prop: 'net_weight',
        label: '净重',
        minWidth: 90,
        formatter: (row) => (row.net_weight ? `${row.net_weight}${row.unit || 'kg'}` : '—')
      },
      {
        prop: 'parking_spot',
        label: '库位',
        minWidth: 100,
        formatter: (row) =>
          row.parking_spot
            ? h('span', { class: 'order-location-tag' }, row.parking_spot)
            : h('span', { class: 'order-muted' }, '—')
      },
      {
        prop: 'progress',
        label: '预处理',
        minWidth: 110,
        formatter: (row) => renderPreprocessTag(row)
      },
      {
        prop: 'status_text',
        label: '工单状态',
        minWidth: 100,
        formatter: (row) => renderStatusTag(row)
      },
      {
        prop: 'person_in_charge',
        label: '负责人',
        minWidth: 90,
        formatter: (row) => h('span', { class: 'order-muted' }, row.person_in_charge || '—')
      },
      {
        prop: 'add_time_text',
        label: '创建时间',
        minWidth: 150,
        formatter: (row) => h('span', { class: 'order-time' }, row.add_time_text || '—')
      },
      {
        prop: 'operation',
        label: '操作',
        width: 200,
        align: 'center',
        fixed: 'right',
        formatter: (row) => renderActions(row)
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
      apiFn: fetchPlateList,
      apiParams: {
        keyword: searchForm.value.keyword,
        status: searchForm.value.status,
        page: 1,
        limit: 20
      },
      paginationKey: { current: 'page', size: 'limit' },
      columnsFactory: () => buildColumns()
    }
  })

  async function loadStats() {
    try {
      stats.value = await fetchPlateCounts()
    } catch {
      // 统计失败不阻断页面
    }
  }

  function handleToolbarSearch(form: PlateSearchParams) {
    searchForm.value = form
    replaceSearchParams({
      keyword: form.keyword,
      status: form.status
    })
    getData()
  }

  function handleToolbarReset() {
    searchForm.value = { keyword: undefined, status: '' }
    resetSearchParams()
    replaceSearchParams({ keyword: undefined, status: '' })
    getData()
  }

  function handleCreateSuccess() {
    createVisible.value = false
    loadStats()
    refreshData()
  }

  function handleDetailSuccess() {
    loadStats()
    refreshData()
  }

  function handlePreprocessSuccess() {
    preprocessVisible.value = false
    preprocessPlateId.value = undefined
    loadStats()
    refreshData()
  }

  async function handleExport() {
    exporting.value = true
    try {
      const list = await fetchPlateExport(searchForm.value)
      if (!list.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const rows = list.map((item) => ({
        档案号: item.archive_no,
        车牌号: item.plate_no,
        车辆类型: item.vehicle_type_text,
        车主: item.owner_name,
        净重: item.net_weight,
        库位: item.parking_spot,
        工单状态: item.status_text,
        负责人: item.person_in_charge,
        创建时间: item.add_time_text
      }))
      const sheet = XLSX.utils.json_to_sheet(rows)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '拆解工单')
      XLSX.writeFile(book, `拆解工单_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
  @use './work';
</style>
