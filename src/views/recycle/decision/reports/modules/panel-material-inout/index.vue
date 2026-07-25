<template>
  <div v-loading="loading" class="rmi-panel">
    <!-- KPI 统计 -->
    <div class="rmi-kpi-grid">
      <div class="rmi-kpi-card">
        <div class="rmi-kpi-label">合计车辆</div>
        <div class="rmi-kpi-value" style="color: #08979c">{{ count }} 辆</div>
        <div class="rmi-kpi-sub">本期入库</div>
      </div>
      <div v-for="item in categoryKpiCards" :key="item.key" class="rmi-kpi-card">
        <div class="rmi-kpi-label">{{ item.label }}</div>
        <div class="rmi-kpi-value" :style="{ color: item.color }">{{ item.count }} 辆</div>
        <div class="rmi-kpi-sub">{{ item.weight }} 吨</div>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="rmi-filter-bar">
      <div class="rmi-filter-row">
        <ElInput
          v-for="item in searchInputs"
          :key="item.key"
          v-model="filters[item.key]"
          :placeholder="item.placeholder"
          clearable
          :class="['rmi-search-input', item.widthClass]"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" class="rmi-search-icon" />
          </template>
        </ElInput>
      </div>
      <div class="rmi-filter-row">
        <ElSelect
          v-model="vehicleCategory"
          placeholder="车辆分类"
          clearable
          class="rmi-filter-select"
        >
          <ElOption
            v-for="opt in CATEGORY_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElInput v-model="vehicleModel" placeholder="筛选车型" clearable class="rmi-filter-input" />
        <ElSelect v-model="driveType" placeholder="驱动类型" clearable class="rmi-filter-select">
          <ElOption
            v-for="opt in DRIVE_TYPE_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElSelect
          v-model="supervision"
          placeholder="监销/非监销"
          clearable
          class="rmi-filter-select"
        >
          <ElOption label="监销" value="监销" />
          <ElOption label="非监销" value="非监销" />
        </ElSelect>

        <div class="rmi-date-group">
          <span class="rmi-date-label">入库日期:</span>
          <ElButton size="small" class="rmi-shift-btn" @click="shiftInboundDate(-1)">‹</ElButton>
          <ElDatePicker
            v-model="inboundStart"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="开始"
            class="rmi-date-single"
          />
          <span class="rmi-date-sep">—</span>
          <ElDatePicker
            v-model="inboundEnd"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="结束"
            class="rmi-date-single"
          />
          <ElButton size="small" class="rmi-shift-btn" @click="shiftInboundDate(1)">›</ElButton>
        </div>

        <div class="rmi-date-group">
          <span class="rmi-date-label">领料日期:</span>
          <ElDatePicker
            v-model="materialStart"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="开始"
            clearable
            class="rmi-date-single"
          />
          <span class="rmi-date-sep">—</span>
          <ElDatePicker
            v-model="materialEnd"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="结束"
            clearable
            class="rmi-date-single"
          />
        </div>

        <ElButton type="primary" @click="handleSearch">
          <ArtSvgIcon icon="ri:filter-3-line" class="mr-1" />
          查询
        </ElButton>
        <ElButton @click="handleReset">
          <ArtSvgIcon icon="ri:close-line" class="mr-1" />
          重置
        </ElButton>
        <div class="rmi-filter-actions">
          <ElButton :loading="exporting" @click="handleExport">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="rmi-report-card">
      <div class="rmi-report-title">
        <div class="rmi-report-title-main">{{ RMI_REPORT_TITLE }}</div>
        <div class="rmi-report-title-sub">入库时间：{{ queryRange[0] }} — {{ queryRange[1] }}</div>
      </div>

      <div class="rmi-legend">
        <div v-for="item in legendItems" :key="item.key" class="rmi-legend-item">
          <span class="rmi-legend-dot" :class="item.class" />
          <span>{{ item.label }}</span>
        </div>
        <span class="rmi-legend-summary"> 共 {{ count }} 条合计 {{ totalWeightText }} 吨 </span>
      </div>

      <div class="rmi-table-wrap">
        <vxe-grid
          ref="gridRef"
          class="rmi-vxe-grid"
          v-bind="gridOptions"
          :data="list"
          :columns="gridColumns"
          :footer-method="footerMethod"
          :footer-span-method="footerSpanMethod"
        >
          <template #date="{ row }">
            <span class="rmi-date">{{ row.date || '—' }}</span>
          </template>
          <template #plate_no="{ row }">
            <span class="rmi-plate">{{ row.plate_no || '—' }}</span>
          </template>
          <template #owner="{ row }">
            <span class="rmi-owner" :title="row.owner">{{ row.owner || '—' }}</span>
          </template>
          <template #entry_no="{ row }">
            <span class="rmi-entry-no">{{ row.entry_no || '—' }}</span>
          </template>
          <template #internal_no="{ row }">
            <span class="rmi-internal-no">{{ row.internal_no || '—' }}</span>
          </template>
          <template #category_label="{ row }">
            <span class="rmi-badge" :class="categoryBadgeClass(row.category)">
              {{ row.category_label || '—' }}
            </span>
          </template>
          <template #vin="{ row }">
            <span class="rmi-vin">{{ row.vin || '—' }}</span>
          </template>
          <template #drive_type="{ row }">
            <span class="rmi-badge" :class="driveTypeClass(row.drive_type)">
              {{ row.drive_type || '—' }}
            </span>
          </template>
          <template #weight="{ row }">
            <span class="rmi-weight">{{ row.weight || '—' }}</span>
          </template>
          <template #supervision="{ row }">
            <template v-if="row.category === 'moto'">
              <span class="rmi-muted">—</span>
            </template>
            <span
              v-else-if="row.supervision"
              class="rmi-badge"
              :class="row.supervision === '监销' ? 'is-supervision' : 'is-normal'"
            >
              {{ row.supervision }}
            </span>
            <span v-else class="rmi-muted">—</span>
          </template>
          <template #material_date="{ row }">
            <span v-if="row.material_date" class="rmi-material-date">{{ row.material_date }}</span>
            <span v-else class="rmi-pending">待领料</span>
          </template>
          <template #cert_date="{ row }">
            <span v-if="row.cert_date" class="rmi-cert-done">✓ {{ row.cert_date }}</span>
            <span v-else class="rmi-pending">待领证</span>
          </template>
          <template #remark="{ row }">
            <span class="rmi-remark">{{
              row.remark && row.remark !== '--' ? row.remark : '—'
            }}</span>
          </template>
          <template #empty>
            <span class="rmi-empty-text">暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>
      </div>

      <div class="rmi-pagination">
        <span class="rmi-pagination-info">
          共 <b>{{ count }}</b> 条，第 <b>{{ page }}</b> / {{ totalPages }} 页
        </span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="count"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @size-change="onPageSizeChange"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchMaterialInOut } from '@/api/recycle/report'
  import type { MaterialInOutResult } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { defaultReportDateRange } from '../../utils'
  import {
    buildMaterialInOutColumns,
    CATEGORY_BADGE_CLASS,
    CATEGORY_ROW_CLASS,
    driveTypeClass,
    getRmiFooterMeta
  } from './grid-columns'
  import { RMI_REPORT_TITLE, useMaterialInOutExport } from './grid-export'

  const CATEGORY_OPTIONS = [
    { label: '商用车', value: 'commercial' },
    { label: '轻摩', value: 'moto' },
    { label: '私家车', value: 'private' }
  ]

  const DRIVE_TYPE_OPTIONS = [
    { label: '燃油', value: '1' },
    { label: '纯电', value: '2' },
    { label: '混动', value: '3' }
  ]

  const searchInputs = [
    { key: 'plate_no' as const, placeholder: '车牌号', widthClass: 'is-w-120' },
    { key: 'internal_no' as const, placeholder: '厂内编号', widthClass: 'is-w-110' },
    { key: 'vin' as const, placeholder: '车架号', widthClass: 'is-w-150' },
    { key: 'owner' as const, placeholder: '车辆产权人', widthClass: 'is-w-120' },
    { key: 'entry_no' as const, placeholder: '入库单号', widthClass: 'is-w-110' },
    { key: 'business' as const, placeholder: '业务员/代理人', widthClass: 'is-w-120' }
  ]

  const legendItems = [
    { key: 'commercial', label: '商用车', class: 'is-commercial' },
    { key: 'moto', label: '轻摩', class: 'is-moto' },
    { key: 'private', label: '私家车', class: 'is-private' }
  ]

  const loading = ref(false)
  const result = ref<MaterialInOutResult | null>(null)
  const gridRef = ref<{ $el?: HTMLElement } | null>(null)
  const { exporting, exportReport } = useMaterialInOutExport()

  const defaultRange = defaultReportDateRange()
  const inboundStart = ref(defaultRange[0])
  const inboundEnd = ref(defaultRange[1])
  const queryRange = ref<[string, string]>([...defaultRange])
  const materialStart = ref('')
  const materialEnd = ref('')

  const filters = reactive({
    plate_no: '',
    internal_no: '',
    vin: '',
    owner: '',
    entry_no: '',
    business: ''
  })
  const vehicleCategory = ref('')
  const vehicleModel = ref('')
  const driveType = ref('')
  const supervision = ref('')
  const page = ref(1)
  const limit = ref(20)

  const list = computed(() => result.value?.list || [])
  const count = computed(() => result.value?.count || 0)
  const stats = computed(() => result.value?.stats)
  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / limit.value)))

  const categoryKpiCards = computed(() => [
    {
      key: 'commercial',
      label: '商用车',
      count: stats.value?.commercial ?? 0,
      weight: stats.value?.commercialWeight ?? '0.000',
      color: '#fa8c16'
    },
    {
      key: 'moto',
      label: '轻摩',
      count: stats.value?.moto ?? 0,
      weight: stats.value?.motoWeight ?? '0.000',
      color: '#52c41a'
    },
    {
      key: 'private',
      label: '私家车',
      count: stats.value?.private ?? 0,
      weight: stats.value?.privateWeight ?? '0.000',
      color: '#1890ff'
    }
  ])

  const totalWeightText = computed(() => {
    const s = stats.value
    if (!s) return '0.000'
    const sum =
      Number(s.commercialWeight || 0) + Number(s.motoWeight || 0) + Number(s.privateWeight || 0)
    return sum.toFixed(3)
  })

  const gridColumns = computed(() => buildMaterialInOutColumns())

  const gridOptions = {
    border: true,
    size: 'mini' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    height: '100%',
    scrollX: { enabled: true, gt: 0 },
    columnConfig: { resizable: false },
    rowConfig: { isHover: true, height: 44 },
    rowClassName: ({ row }: { row: { category?: string } }) =>
      CATEGORY_ROW_CLASS[row.category || ''] || '',
    showFooter: true,
    footerRowClassName: 'rmi-footer-row'
  }

  function categoryBadgeClass(category?: string) {
    return CATEGORY_BADGE_CLASS[category || ''] || ''
  }

  function footerSummaryText() {
    const s = stats.value
    return `合计 ${count.value} 辆  商用车:${s?.commercial ?? 0}辆  轻摩:${s?.moto ?? 0}辆  私家车:${s?.private ?? 0}辆`
  }

  function footerMethod({ columns }: { columns: { field?: string; type?: string }[] }) {
    if (!list.value.length) return []
    const { weightIdx } = getRmiFooterMeta(columns)
    return [
      columns.map((col, idx) => {
        if (idx === 0) return footerSummaryText()
        if (col.field === 'weight') return totalWeightText.value
        if (idx > 0 && idx < weightIdx) return ''
        return ''
      })
    ]
  }

  function footerSpanMethod({
    columnIndex,
    rowIndex,
    columns
  }: {
    columnIndex: number
    rowIndex: number
    columns?: { field?: string; type?: string }[]
  }) {
    if (rowIndex !== 0 || !list.value.length) return { rowspan: 1, colspan: 1 }
    const sectionColumns = columns && columns.length > 0 ? columns : buildMaterialInOutColumns()
    const { weightIdx, labelColspan, tailColspan } = getRmiFooterMeta(
      sectionColumns as ReturnType<typeof buildMaterialInOutColumns>
    )
    if (columnIndex === 0) return { rowspan: 1, colspan: labelColspan }
    if (columnIndex > 0 && columnIndex < labelColspan) return { rowspan: 0, colspan: 0 }
    if (columnIndex === weightIdx + 1 && tailColspan > 0) {
      return { rowspan: 1, colspan: tailColspan }
    }
    if (columnIndex > weightIdx + 1) return { rowspan: 0, colspan: 0 }
    return { rowspan: 1, colspan: 1 }
  }

  function buildQueryParams() {
    return {
      plate_no: filters.plate_no || undefined,
      internal_no: filters.internal_no || undefined,
      vin: filters.vin || undefined,
      owner: filters.owner || undefined,
      entry_no: filters.entry_no || undefined,
      business: filters.business || undefined,
      vehicle_category: vehicleCategory.value || undefined,
      vehicle_model: vehicleModel.value || undefined,
      drive_type: driveType.value || undefined,
      supervision: supervision.value || undefined,
      start_date: queryRange.value[0],
      end_date: queryRange.value[1],
      material_start_date: materialStart.value || undefined,
      material_end_date: materialEnd.value || undefined,
      page: page.value,
      limit: limit.value
    }
  }

  async function loadData() {
    loading.value = true
    try {
      result.value = await fetchMaterialInOut(buildQueryParams())
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    if (!inboundStart.value || !inboundEnd.value) {
      ElMessage.warning('请选择入库日期范围')
      return
    }
    queryRange.value = [inboundStart.value, inboundEnd.value]
    page.value = 1
    loadData()
  }

  function handleReset() {
    const range = defaultReportDateRange()
    inboundStart.value = range[0]
    inboundEnd.value = range[1]
    queryRange.value = [...range]
    materialStart.value = ''
    materialEnd.value = ''
    filters.plate_no = ''
    filters.internal_no = ''
    filters.vin = ''
    filters.owner = ''
    filters.entry_no = ''
    filters.business = ''
    vehicleCategory.value = ''
    vehicleModel.value = ''
    driveType.value = ''
    supervision.value = ''
    page.value = 1
    loadData()
  }

  function onPageSizeChange() {
    page.value = 1
    loadData()
  }

  function shiftInboundDate(days: number) {
    if (!inboundStart.value || !inboundEnd.value) return
    const shift = (dateStr: string) => {
      const d = new Date(dateStr)
      d.setDate(d.getDate() + days)
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    inboundStart.value = shift(inboundStart.value)
    inboundEnd.value = shift(inboundEnd.value)
  }

  function handleExport() {
    exportReport({
      ...buildQueryParams(),
      startDate: queryRange.value[0],
      endDate: queryRange.value[1],
      page: undefined,
      limit: undefined
    })
  }

  onMounted(() => {
    loadData()
  })
</script>

<style lang="scss">
  @use './index';
</style>
