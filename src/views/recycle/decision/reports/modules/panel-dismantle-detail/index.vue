<template>
  <div v-loading="loading" class="dd-panel">
    <div class="dd-kpi-grid">
      <div v-for="item in kpiCards" :key="item.key" class="dd-kpi-card">
        <div class="dd-kpi-label">{{ item.label }}</div>
        <div class="dd-kpi-value" :style="{ color: item.color }">{{ item.value }}</div>
        <div class="dd-kpi-sub">{{ item.sub }}</div>
      </div>
    </div>

    <div class="dd-filter-bar">
      <div class="dd-filter-row">
        <div class="dd-date-group">
          <ElButton size="small" class="dd-shift-btn" @click="shiftDate(-1)">‹ 前一天</ElButton>
          <ElDatePicker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="—"
            start-placeholder="开始"
            end-placeholder="结束"
            class="dd-date-single"
          />
          <ElButton size="small" class="dd-shift-btn" @click="shiftDate(1)">后一天 ›</ElButton>
          <ElButton v-if="!isToday" link type="primary" @click="goToday">今天</ElButton>
        </div>

        <ElSelect
          v-model="vehicleCategory"
          placeholder="车型（全部）"
          clearable
          filterable
          class="dd-filter-select"
        >
          <ElOption v-for="name in vehicleOptions" :key="name" :label="name" :value="name" />
        </ElSelect>

        <ElInput
          v-model="productKeyword"
          placeholder="搜索产物名称"
          clearable
          class="dd-search-input"
          @input="debouncedHandleSearch"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" class="dd-search-icon" />
          </template>
        </ElInput>

        <ElButton type="text" @click="handleReset"> 重置 </ElButton>

        <div class="dd-filter-actions">
          <ElButton :loading="exporting" @click="handleExport">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel
          </ElButton>
        </div>
      </div>
    </div>

    <div class="dd-report-card">
      <div class="dd-tabs">
        <button
          v-for="tab in subTabs"
          :key="tab.key"
          type="button"
          class="dd-tab"
          :class="{ 'is-active': subTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </button>
        <span class="dd-tab-meta">车辆拆解明细表 · {{ dateTitleText }}</span>
      </div>

      <div v-if="subTab === 'product'" class="dd-storage-banner">产物缴库</div>

      <div class="dd-table-wrap">
        <vxe-grid
          v-if="subTab === 'vehicle'"
          class="dd-vxe-grid"
          v-bind="vehicleGridOptions"
          :data="vehiclePageList"
          :columns="vehicleColumns"
          :footer-method="vehicleFooterMethod"
          :footer-span-method="vehicleFooterSpanMethod"
        >
          <template #name="{ row }">
            <span class="dd-name">{{ row.name || '' }}</span>
          </template>
          <template v-for="field in DD_VEHICLE_SUM_FIELDS" :key="field" #[field]="{ row }">
            <span :class="vehicleCellClass(field, row[field])">
              {{ fmtDdNumber(row[field]) }}
            </span>
          </template>
          <template #empty>
            <span class="dd-empty-text">暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>

        <vxe-grid
          v-else
          class="dd-vxe-grid"
          v-bind="storageGridOptions"
          :data="storagePageList"
          :columns="storageColumns"
          :span-method="storageSpanMethod"
          :cell-style="storageCellStyle"
          :footer-method="storageFooterMethod"
          :footer-span-method="storageFooterSpanMethod"
        >
          <template #category="{ row }">
            <span class="dd-cat-cell" :style="{ color: categoryColor(row.category).fg }">
              {{ row.category || '' }}
            </span>
          </template>
          <template #product_name="{ row }">
            <span>{{ row.product_name || '' }}</span>
          </template>
          <template v-for="field in DD_STORAGE_SUM_FIELDS" :key="field" #[field]="{ row }">
            <span :class="storageCellClass(field, row[field])">
              {{
                field.includes('weight') ? fmtDdNumber(row[field], 3) : fmtDdNumber(row[field], 0)
              }}
            </span>
          </template>
          <template #empty>
            <span class="dd-empty-text">暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>
      </div>

      <div class="dd-pagination">
        <span class="dd-pagination-info">
          共 <b>{{ currentTotal }}</b> 条，第 <b>{{ page }}</b> / {{ totalPages }} 页
        </span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="currentTotal"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="onPageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchDismantleReport } from '@/api/recycle/report'
  import type {
    DismantleResult,
    DismantleStorageItem
  } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { defaultTodayRange, formatCnDateRange, shiftDayRange } from '../../utils'
  import {
    buildDismantleStorageColumns,
    buildDismantleVehicleColumns,
    categoryColor,
    DD_STORAGE_SUM_FIELDS,
    DD_VEHICLE_SUM_FIELDS,
    fmtDdNumber,
    parseDdNumber,
    type DdStorageSumField,
    type DdVehicleSumField
  } from './grid-columns'
  import { useDismantleExport } from './grid-export'

  defineOptions({ name: 'PanelDismantleDetail' })

  const subTabs = [
    { key: 'vehicle' as const, label: '车辆拆解报表' },
    { key: 'product' as const, label: '产物缴库报表' }
  ]

  const loading = ref(false)
  const result = ref<DismantleResult | null>(null)
  const { exporting, exportReport } = useDismantleExport()

  const defaultRange = defaultTodayRange()
  const dateRange = ref<[string, string] | null>([...defaultRange])
  const queryRange = ref<[string, string]>([...defaultRange])
  const vehicleCategory = ref('')
  const productKeyword = ref('')
  const appliedProductKeyword = ref('')
  const subTab = ref<'vehicle' | 'product'>('vehicle')
  const page = ref(1)
  const limit = ref(20)

  const vehicleList = computed(() => result.value?.vehicle_list || [])
  const storageAll = computed(() => result.value?.storage_list || [])
  const storageList = computed(() => {
    const kw = appliedProductKeyword.value.trim()
    if (!kw) return storageAll.value
    return storageAll.value.filter((p) => p.product_name.includes(kw) || p.category.includes(kw))
  })
  const stats = computed(() => result.value?.stats)

  const currentTotal = computed(() =>
    subTab.value === 'vehicle' ? vehicleList.value.length : storageList.value.length
  )
  const totalPages = computed(() => Math.max(1, Math.ceil(currentTotal.value / limit.value)))

  const vehiclePageList = computed(() => {
    const start = (page.value - 1) * limit.value
    return vehicleList.value.slice(start, start + limit.value)
  })
  const storagePageList = computed(() => {
    const start = (page.value - 1) * limit.value
    return storageList.value.slice(start, start + limit.value)
  })

  const vehicleOptions = computed(() => vehicleList.value.map((r) => r.name).filter(Boolean))

  const todayStr = computed(() => defaultTodayRange()[0])
  const isToday = computed(
    () =>
      !!dateRange.value &&
      dateRange.value[0] === todayStr.value &&
      dateRange.value[1] === todayStr.value
  )
  const dateTitleText = computed(() => formatCnDateRange(queryRange.value[0], queryRange.value[1]))

  const kpiCards = computed(() => {
    const s = stats.value
    return [
      {
        key: 'monthIn',
        label: '本月累计领料',
        value: `${s?.month_received_count ?? 0} 台`,
        sub: `${s?.month_received_weight ?? '0.00'} 吨`,
        color: '#1890FF'
      },
      {
        key: 'monthOut',
        label: '本月累计拆解',
        value: `${s?.month_dismantle_count ?? 0} 台`,
        sub: `${s?.month_dismantle_weight ?? '0.00'} 吨`,
        color: '#52C41A'
      },
      {
        key: 'todayOut',
        label: '当日拆解',
        value: `${s?.today_dismantle_count ?? 0} 台`,
        sub: `${s?.today_dismantle_weight ?? '0.00'} 吨`,
        color: '#FA8C16'
      },
      {
        key: 'prevWip',
        label: '前期在制品',
        value: `${s?.prev_wip_count ?? 0} 台`,
        sub: `${s?.prev_wip_weight ?? '0.00'} 吨`,
        color: '#722ED1'
      }
    ]
  })

  const vehicleColumns = computed(() => buildDismantleVehicleColumns())
  const storageColumns = computed(() => buildDismantleStorageColumns())

  const vehicleGridOptions = {
    border: true,
    size: 'mini' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    width: '100%',
    scrollX: { enabled: false },
    scrollY: { enabled: false },
    columnConfig: { resizable: false },
    rowConfig: { isHover: true, height: 36 },
    showFooter: true,
    footerRowClassName: 'dd-footer-row'
  }

  const storageGridOptions = { ...vehicleGridOptions }

  const vehicleFooterTotals = computed(() => {
    const totals: Record<string, string> = {}
    DD_VEHICLE_SUM_FIELDS.forEach((field) => {
      const sum = vehicleList.value.reduce((s, row) => s + parseDdNumber(row[field]), 0)
      totals[field] = field.includes('weight')
        ? sum
          ? sum.toFixed(2)
          : ''
        : sum
          ? String(sum)
          : ''
    })
    return totals
  })

  const storageFooterTotals = computed(() => {
    const list = storageList.value
    return {
      today_storage_count: String(
        list.reduce((s, r) => s + parseDdNumber(r.today_storage_count), 0)
      ),
      today_storage_weight: list
        .reduce((s, r) => s + parseDdNumber(r.today_storage_weight), 0)
        .toFixed(3),
      month_storage_count: String(
        list.reduce((s, r) => s + parseDdNumber(r.month_storage_count), 0)
      ),
      month_storage_weight: list
        .reduce((s, r) => s + parseDdNumber(r.month_storage_weight), 0)
        .toFixed(3)
    }
  })

  function vehicleCellClass(field: DdVehicleSumField, val?: string | number) {
    if (!parseDdNumber(val)) return ''
    if (field.startsWith('prev_')) return 'dd-val-prev'
    if (field.startsWith('today_receive_')) return 'dd-val-today-in'
    if (field.startsWith('month_receive_')) return 'dd-val-month-in'
    if (field.startsWith('today_dismantle_')) return 'dd-val-today-out'
    if (field.startsWith('month_dismantle_')) return 'dd-val-month-out'
    if (field.startsWith('today_wip_')) return 'dd-val-wip'
    return ''
  }

  function storageCellClass(field: DdStorageSumField, val?: string | number) {
    if (!parseDdNumber(val)) return ''
    return field.startsWith('today_') ? 'dd-val-today-in' : 'dd-val-today-out'
  }

  function vehicleFooterMethod({ columns }: { columns: { field?: string; type?: string }[] }) {
    return [
      columns.map((col, idx) => {
        if (idx === 0 || col.type === 'seq') return '合计'
        if (col.field && col.field in vehicleFooterTotals.value) {
          return vehicleFooterTotals.value[col.field]
        }
        return ''
      })
    ]
  }

  function vehicleFooterSpanMethod({
    rowIndex,
    column
  }: {
    rowIndex: number
    column: { field?: string; type?: string }
  }) {
    if (rowIndex !== 0) return { rowspan: 1, colspan: 1 }
    if (column?.type === 'seq') return { rowspan: 1, colspan: 2 }
    if (column?.field === 'name') return { rowspan: 0, colspan: 0 }
    return { rowspan: 1, colspan: 1 }
  }

  function storageFooterMethod({ columns }: { columns: { field?: string }[] }) {
    return [
      columns.map((col) => {
        if (col.field === 'category') return '合计'
        if (col.field === 'today_storage_count')
          return storageFooterTotals.value.today_storage_count
        if (col.field === 'today_storage_weight')
          return storageFooterTotals.value.today_storage_weight
        if (col.field === 'month_storage_count')
          return storageFooterTotals.value.month_storage_count
        if (col.field === 'month_storage_weight')
          return storageFooterTotals.value.month_storage_weight
        return ''
      })
    ]
  }

  function storageFooterSpanMethod({
    rowIndex,
    column
  }: {
    rowIndex: number
    column: { field?: string }
  }) {
    if (rowIndex !== 0) return { rowspan: 1, colspan: 1 }
    if (column?.field === 'category') return { rowspan: 1, colspan: 2 }
    if (column?.field === 'product_name') return { rowspan: 0, colspan: 0 }
    return { rowspan: 1, colspan: 1 }
  }

  function storageSpanMethod({
    row,
    rowIndex,
    column
  }: {
    row: DismantleStorageItem
    rowIndex: number
    column: { field?: string }
  }) {
    if (column.field !== 'category') return { rowspan: 1, colspan: 1 }
    const list = storagePageList.value
    const prev = list[rowIndex - 1]
    if (prev && prev.category === row.category) return { rowspan: 0, colspan: 0 }
    let span = 1
    while (rowIndex + span < list.length && list[rowIndex + span].category === row.category) {
      span++
    }
    return { rowspan: span, colspan: 1 }
  }

  function storageCellStyle({
    row,
    column
  }: {
    row: DismantleStorageItem
    column: { field?: string }
  }) {
    if (column.field !== 'category' || !row.category) return null
    return { backgroundColor: categoryColor(row.category).bg }
  }

  function switchTab(key: 'vehicle' | 'product') {
    subTab.value = key
    page.value = 1
  }

  function shiftDate(delta: number) {
    if (!dateRange.value) return
    const [s, e] = shiftDayRange(dateRange.value[0], dateRange.value[1], delta)
    dateRange.value = [s, e]
  }

  function goToday() {
    dateRange.value = defaultTodayRange()
  }

  function onPageSizeChange() {
    page.value = 1
  }

  async function loadData() {
    if (!dateRange.value) {
      ElMessage.warning('请选择日期范围')
      return
    }
    loading.value = true
    try {
      result.value = await fetchDismantleReport({
        vehicle_category: vehicleCategory.value || undefined,
        start_date: dateRange.value[0],
        end_date: dateRange.value[1],
        time_mode: 'day'
      })
      queryRange.value = [dateRange.value[0], dateRange.value[1]]
      appliedProductKeyword.value = productKeyword.value
    } catch {
      result.value = null
      ElMessage.error('加载拆解报表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    if (!dateRange.value || dateRange.value.length !== 2) {
      ElMessage.warning('请选择日期范围')
      return
    }
    page.value = 1
    loadData()
  }

  const debouncedHandleSearch = useDebounceFn(handleSearch, 300)
  watch([dateRange, vehicleCategory], debouncedHandleSearch, { deep: true })

  function handleReset() {
    dateRange.value = defaultTodayRange()
    vehicleCategory.value = ''
    productKeyword.value = ''
    page.value = 1
    loadData()
  }

  function handleExport() {
    exportReport(vehicleList.value, storageList.value, queryRange.value[0], queryRange.value[1])
  }

  onMounted(loadData)
</script>

<style lang="scss">
  @use './index';
</style>
