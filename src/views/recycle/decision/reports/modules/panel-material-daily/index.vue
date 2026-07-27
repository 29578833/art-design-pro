<template>
  <div v-loading="loading" class="md-panel">
    <!-- KPI 统计 -->
    <div class="md-kpi-grid">
      <div v-for="item in kpiCards" :key="item.key" class="md-kpi-card">
        <div class="md-kpi-label">{{ item.label }}</div>
        <div class="md-kpi-value" :style="{ color: item.color }">{{ item.value }}</div>
        <div class="md-kpi-sub">{{ item.sub }}</div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="md-filter-bar">
      <div class="md-filter-row">
        <div class="md-gran-group">
          <button
            v-for="item in TIME_MODE_OPTIONS"
            :key="item.value"
            type="button"
            class="md-gran-btn"
            :class="{ 'is-active': timeMode === item.value }"
            @click="timeMode = item.value"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="md-date-group">
          <ElButton size="small" class="md-shift-btn" @click="shiftDate(-1)">‹ 前一天</ElButton>
          <ElDatePicker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="—"
            start-placeholder="开始"
            end-placeholder="结束"
            class="md-date-single"
          />
          <ElButton size="small" class="md-shift-btn" @click="shiftDate(1)">后一天 ›</ElButton>
          <ElButton v-if="!isToday" link type="primary" @click="goToday">今天</ElButton>
        </div>

        <ElSelect
          v-model="vehicleCategory"
          placeholder="车型（全部）"
          clearable
          filterable
          class="md-filter-select"
        >
          <ElOption v-for="name in vehicleOptions" :key="name" :label="name" :value="name" />
        </ElSelect>

        <ElInput
          v-model="keyword"
          placeholder="搜索车型名称"
          clearable
          class="md-search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" class="md-search-icon" />
          </template>
        </ElInput>

        <ElButton type="primary" @click="handleSearch">
          <ArtSvgIcon icon="ri:filter-3-line" class="mr-1" />
          查询
        </ElButton>
        <ElButton @click="handleReset">
          <ArtSvgIcon icon="ri:close-line" class="mr-1" />
          重置
        </ElButton>

        <div class="md-filter-actions">
          <ElButton :loading="exporting" @click="handleExport">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="md-report-card">
      <div class="md-report-title">
        <div>
          <div class="md-report-title-main">{{ MD_REPORT_TITLE }}</div>
          <div class="md-report-title-sub">
            {{ dateTitleText }}
            <span v-if="timeModeSuffix">{{ timeModeSuffix }}</span>
          </div>
        </div>
        <span class="md-record-count">{{ count }} 条记录</span>
      </div>

      <div class="md-table-wrap">
        <vxe-grid
          class="md-vxe-grid"
          v-bind="gridOptions"
          :data="displayList"
          :columns="gridColumns"
          :footer-method="footerMethod"
        >
          <template #name="{ row }">
            <span class="md-name" :class="{ 'is-active': hasRowData(row) }">{{
              row.name || '—'
            }}</span>
          </template>
          <template #spec="{ row }">
            <span class="md-spec">{{ row.spec && row.spec !== '--' ? row.spec : '—' }}</span>
          </template>
          <template v-for="field in MD_SUM_FIELDS" :key="field" #[field]="{ row }">
            <span :class="cellClass(field, row[field])">{{ fmtMdNumber(row[field]) || '—' }}</span>
          </template>
          <template #empty>
            <span class="md-empty-text">暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>
      </div>

      <div class="md-sign-row">
        <div v-for="role in signRoles" :key="role" class="md-sign-item">
          <span class="md-sign-label">{{ role }}：</span>
          <span class="md-sign-line" />
        </div>
      </div>

      <div class="md-pagination">
        <span class="md-pagination-info">
          共 <b>{{ count }}</b> 条，第 <b>{{ page }}</b> / {{ totalPages }} 页
        </span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="count"
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
  import { fetchMaterialDaily } from '@/api/recycle/report'
  import type {
    MaterialDailyItem,
    MaterialDailyResult
  } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { defaultTodayRange } from '../../utils'
  import {
    buildMaterialDailyColumns,
    flattenMdColumns,
    fmtMdNumber,
    MD_SUM_FIELDS,
    parseMdNumber
  } from './grid-columns'
  import { MD_REPORT_TITLE, useMaterialDailyExport } from './grid-export'

  const TIME_MODE_OPTIONS = [
    { label: '按天', value: 'day' as const },
    { label: '按周', value: 'week' as const },
    { label: '按月', value: 'month' as const }
  ]

  const signRoles = ['分管副总', '在管主管', '填表人']

  const loading = ref(false)
  const result = ref<MaterialDailyResult | null>(null)
  const { exporting, exportReport } = useMaterialDailyExport()

  const defaultRange = defaultTodayRange()
  const dateRange = ref<[string, string]>([...defaultRange])
  const queryRange = ref<[string, string]>([...defaultRange])
  const timeMode = ref<'day' | 'week' | 'month'>('day')
  const keyword = ref('')
  const vehicleCategory = ref('')
  const page = ref(1)
  const limit = ref(25)

  const allList = computed(() => result.value?.list || [])
  const count = computed(() => result.value?.count || 0)
  const stats = computed(() => result.value?.stats)
  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / limit.value)))

  const displayList = computed(() => {
    const start = (page.value - 1) * limit.value
    return allList.value.slice(start, start + limit.value)
  })

  const vehicleOptions = computed(() => {
    const names = allList.value.map((row) => row.name).filter(Boolean)
    return [...new Set(names)]
  })

  const todayStr = computed(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })

  const isToday = computed(
    () => dateRange.value[0] === todayStr.value && dateRange.value[1] === todayStr.value
  )

  const dateTitleText = computed(() => {
    const fmt = (d: string) => {
      const [y, m, day] = d.split('-')
      return `${y}年${m}月${day}日`
    }
    const [start, end] = queryRange.value
    return start === end ? fmt(start) : `${fmt(start)} — ${fmt(end)}`
  })

  const timeModeSuffix = computed(() => {
    if (timeMode.value === 'week') return '（本周）'
    if (timeMode.value === 'month') return '（本月）'
    return ''
  })

  const kpiCards = computed(() => {
    const s = stats.value
    return [
      {
        key: 'todayIn',
        label: '本日入库车辆',
        value: `${s?.todayInCount ?? 0} 辆`,
        sub: `${s?.todayInWeight ?? '0.00'} 吨`,
        color: '#1890ff'
      },
      {
        key: 'todayOut',
        label: '本日出库数量',
        value: `${s?.todayOutCount ?? 0} 辆`,
        sub: `${s?.todayOutWeight ?? '0.00'} 吨`,
        color: '#fa8c16'
      },
      {
        key: 'monthIn',
        label: '本月累计入库',
        value: `${s?.monthInCount ?? 0} 辆`,
        sub: `${s?.monthInWeight ?? '0.00'} 吨`,
        color: '#722ed1'
      },
      {
        key: 'stock',
        label: '当前库存结存',
        value: `${s?.stockCount ?? 0} 辆`,
        sub: `${s?.stockWeight ?? '0.00'} 吨`,
        color: '#52c41a'
      }
    ]
  })

  const gridColumns = computed(() => buildMaterialDailyColumns())

  const gridOptions = {
    border: true,
    size: 'mini' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    height: '100%',
    scrollX: { enabled: false },
    scrollY: { enabled: true, gt: 0 },
    columnConfig: { resizable: false },
    rowConfig: { isHover: true, height: 40 },
    showFooter: true,
    footerRowClassName: 'md-footer-row'
  }

  const footerTotals = computed(() => {
    const totals: Record<string, string> = {}
    MD_SUM_FIELDS.forEach((field) => {
      const sum = allList.value.reduce((s, row) => s + parseMdNumber(row[field]), 0)
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

  function hasRowData(row: MaterialDailyItem) {
    return MD_SUM_FIELDS.some((field) => parseMdNumber(row[field]) > 0)
  }

  function cellClass(field: string, val?: string | number) {
    if (!parseMdNumber(val)) return ''
    if (field.startsWith('init_')) return 'md-val-init'
    if (field.startsWith('today_in_')) return 'md-val-in'
    if (field.startsWith('today_out_')) return 'md-val-out'
    if (field.startsWith('month_in_')) return 'md-val-month-in'
    if (field.startsWith('month_out_')) return 'md-val-month-out'
    if (field.startsWith('stock_')) return 'md-val-stock'
    return ''
  }

  function footerMethod({ columns }: { columns: { field?: string; type?: string }[] }) {
    if (!allList.value.length) return []
    const sectionColumns = columns.length > 0 ? columns : flattenMdColumns()
    return [
      sectionColumns.map((col) => {
        if (col.field === 'name') return '合计'
        const field = col.field as (typeof MD_SUM_FIELDS)[number] | undefined
        if (field && MD_SUM_FIELDS.includes(field)) return footerTotals.value[field] || ''
        return ''
      })
    ]
  }

  function buildQueryParams() {
    return {
      keyword: keyword.value || undefined,
      vehicle_category: vehicleCategory.value || undefined,
      start_date: queryRange.value[0],
      end_date: queryRange.value[1],
      time_mode: timeMode.value,
      page: 1,
      limit: 200
    }
  }

  async function loadData() {
    loading.value = true
    try {
      result.value = await fetchMaterialDaily(buildQueryParams())
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    if (!dateRange.value[0] || !dateRange.value[1]) {
      ElMessage.warning('请选择日期范围')
      return
    }
    queryRange.value = [...dateRange.value]
    page.value = 1
    loadData()
  }

  function handleReset() {
    const range = defaultTodayRange()
    dateRange.value = [...range]
    queryRange.value = [...range]
    timeMode.value = 'day'
    keyword.value = ''
    vehicleCategory.value = ''
    page.value = 1
    loadData()
  }

  function onPageSizeChange() {
    page.value = 1
  }

  function shiftDate(days: number) {
    if (!dateRange.value[0] || !dateRange.value[1]) return
    const shift = (dateStr: string) => {
      const d = new Date(dateStr)
      d.setDate(d.getDate() + days)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    dateRange.value = [shift(dateRange.value[0]), shift(dateRange.value[1])]
  }

  function goToday() {
    dateRange.value = defaultTodayRange()
  }

  function handleExport() {
    exportReport({
      ...buildQueryParams(),
      startDate: queryRange.value[0],
      endDate: queryRange.value[1]
    })
  }

  onMounted(() => {
    loadData()
  })
</script>

<style lang="scss">
  @use './index';
</style>
