<template>
  <div v-loading="loading" class="qc-summary-panel">
    <!-- 标题 + 导出 -->
    <div class="qc-header">
      <div>
        <div class="qc-header-title">{{ QC_REPORT_TITLE }}</div>
        <div class="qc-header-desc">本表数据仅供内部参考，以实际质检单为准</div>
      </div>
      <ElButton :loading="exporting" @click="handleExport">
        <ArtSvgIcon icon="ri:download-line" class="mr-1" />
        导出Excel
      </ElButton>
    </div>

    <!-- KPI 统计 -->
    <div class="qc-kpi-grid">
      <div v-for="item in kpiCards" :key="item.label" class="qc-kpi-card">
        <span class="qc-kpi-label">{{ item.label }}</span>
        <span class="qc-kpi-value" :style="{ color: item.color }">{{ item.value }}</span>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="qc-filter-bar">
      <div class="qc-filter-row">
        <ElInput
          v-model="keyword"
          placeholder="质检单号 / 车辆档案号 / 自编号 / 车牌 / 车主 / 业务员 / 代理人"
          clearable
          class="qc-search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" class="qc-search-icon" />
          </template>
        </ElInput>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :unlink-panels="true"
          class="qc-date-picker"
        />
      </div>
      <div class="qc-filter-row">
        <ElSelect
          v-model="qcStatus"
          placeholder="质检状态（全部）"
          clearable
          class="qc-filter-select"
        >
          <ElOption
            v-for="opt in QC_STATUS_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
        <ElSelect
          v-model="ownerType"
          placeholder="私家车/非私家车"
          clearable
          class="qc-filter-select"
        >
          <ElOption label="私家车" value="personal" />
          <ElOption label="非私家车" value="corporate" />
        </ElSelect>
        <ElSelect
          v-model="emissionStandard"
          placeholder="排量/排放标准"
          clearable
          class="qc-filter-select"
        >
          <ElOption v-for="s in EMISSION_OPTIONS" :key="s" :label="s" :value="s" />
        </ElSelect>
        <ElSelect
          v-model="fuelType"
          placeholder="驱动类型（全部）"
          clearable
          class="qc-filter-select"
        >
          <ElOption v-for="s in FUEL_OPTIONS" :key="s" :label="s" :value="s" />
        </ElSelect>
        <ElSelect
          v-model="agentName"
          placeholder="代理人姓名"
          clearable
          filterable
          allow-create
          default-first-option
          class="qc-filter-select"
        >
          <ElOption v-for="name in agentOptions" :key="name" :label="name" :value="name" />
        </ElSelect>
        <ElSelect
          v-model="inspectorName"
          placeholder="质检员姓名"
          clearable
          filterable
          allow-create
          default-first-option
          class="qc-filter-select"
        >
          <ElOption v-for="name in inspectorOptions" :key="name" :label="name" :value="name" />
        </ElSelect>
        <div class="qc-filter-actions">
          <ElButton @click="handleReset">
            <ArtSvgIcon icon="ri:close-line" class="mr-1" />
            重置
          </ElButton>
          <ElButton type="primary" @click="handleSearch">
            <ArtSvgIcon icon="ri:filter-3-line" class="mr-1" />
            查询
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 表格 -->
    <div class="qc-report-card">
      <div class="qc-table-wrap">
        <vxe-grid
          ref="gridRef"
          class="qc-vxe-grid"
          v-bind="gridOptions"
          :data="displayList"
          :columns="gridColumns"
          :footer-method="footerMethod"
          :footer-span-method="footerSpanMethod"
        >
          <template #collect_date="{ row }">
            {{ formatCollectDate(row.collect_date) }}
          </template>
          <template #vehicle_no="{ row }">
            <span class="qc-archive-no">{{ row.vehicle_no || '—' }}</span>
          </template>
          <template #self_no="{ row }">
            <span class="qc-mono">{{ row.self_no || '—' }}</span>
          </template>
          <template #plate_no="{ row }">
            <span class="qc-plate">{{ row.plate_no || '—' }}</span>
          </template>
          <template #qc_status="{ row }">
            <span class="qc-badge is-status" :class="qcStatusClass(row.qc_status)">
              {{ row.qc_status_text || '—' }}
            </span>
          </template>
          <template #owner_type="{ row }">
            <span
              class="qc-badge"
              :class="row.owner_type === 'personal' ? 'is-personal' : 'is-corporate'"
            >
              {{ ownerTypeText(row.owner_type) }}
            </span>
          </template>
          <template #owner_name="{ row }">
            <span
              class="qc-owner-name"
              :class="row.owner_type === 'personal' ? 'is-personal' : 'is-corporate'"
              :title="row.owner_name"
            >
              {{ row.owner_name || '—' }}
            </span>
          </template>
          <template #emission_standard="{ row }">
            <span class="qc-badge is-emission">{{ row.emission_standard || '—' }}</span>
          </template>
          <template #plate_status="{ row }">
            <span class="qc-badge" :class="plateStatusClass(row.plate_status)">
              {{ row.plate_status || '—' }}
            </span>
          </template>
          <template #delivery_type="{ row }">
            <span class="qc-badge" :class="row.delivery_type === 'tow' ? 'is-tow' : 'is-self'">
              {{ deliveryTypeText(row.delivery_type) }}
            </span>
          </template>
          <template #driver_name="{ row }">
            <span :class="row.driver_name ? 'qc-driver' : 'qc-muted'">
              {{ row.driver_name || '—' }}
            </span>
          </template>
          <template #fuel_type_text="{ row }">
            <span class="qc-badge" :class="fuelTypeClass(row.fuel_type_text)">
              {{ row.fuel_type_text || '—' }}
            </span>
          </template>
          <template #weight="{ row }">
            <span class="qc-weight">{{ Number(row.weight || 0).toFixed(2) }}</span>
          </template>
          <template #battery_status="{ row }">
            <span :class="row.battery_status === '正常' ? 'qc-ok' : 'qc-bad'">
              {{ row.battery_status || '—' }}
            </span>
          </template>
          <template #catalyst_status="{ row }">
            <span :class="catalystClass(row.catalyst_status)">
              {{ row.catalyst_status || '—' }}
            </span>
          </template>
          <template #deduction="{ row }">
            <span
              class="qc-deduction-text"
              :class="row.deduction ? 'qc-bad' : 'qc-muted'"
              :title="String(row.deduction || '')"
            >
              {{ row.deduction ? row.deduction : '—' }}
            </span>
          </template>
          <template #check_no="{ row }">
            <span class="qc-mono">{{ row.check_no || '—' }}</span>
          </template>
          <template #empty>
            <span class="qc-empty-text">暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>
      </div>

      <div class="qc-pagination">
        <span class="qc-pagination-info">
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
  import { fetchQualityInspection } from '@/api/recycle/report'
  import type { QualityInspectionResult } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { defaultReportDateRange } from '../../utils'
  import {
    buildQcColumns,
    deliveryTypeText,
    flattenQcColumns,
    formatCollectDate,
    getQcFooterMeta,
    isQcFixedFooterColumns,
    ownerTypeText,
    QC_FIXED_COL_COUNT,
    qcStatusClass
  } from './grid-columns'
  import { QC_REPORT_TITLE, useQualityInspectionExport } from './grid-export'

  const QC_STATUS_OPTIONS = [
    { label: '待质检', value: 'pending' },
    { label: '质检中', value: 'in_progress' },
    { label: '已完成', value: 'completed' },
    { label: '不合格', value: 'failed' },
    { label: '已质检·待补资料', value: 'pending_materials' }
  ]

  const EMISSION_OPTIONS = ['国二', '国三', '国四', '国五', '国六']
  const FUEL_OPTIONS = ['汽油', '柴油', '纯电动', '插电混动', '油电混动']

  const gridRef = ref<{ updateFooter?: () => void } | null>(null)
  const loading = ref(false)
  const result = ref<QualityInspectionResult | null>(null)
  const totalWeight = ref<number | null>(null)
  const { exporting, exportReport } = useQualityInspectionExport()

  const dateRange = ref<[string, string]>(defaultReportDateRange())
  const queryRange = ref<[string, string]>(defaultReportDateRange())

  const keyword = ref('')
  const qcStatus = ref('')
  const ownerType = ref('')
  const emissionStandard = ref('')
  const fuelType = ref('')
  const agentName = ref('')
  const inspectorName = ref('')
  const page = ref(1)
  const limit = ref(10)

  const list = computed(() => result.value?.list || [])
  const count = computed(() => result.value?.count || 0)
  const stats = computed(() => result.value?.stats)
  const agentOptions = computed(() => result.value?.filter_options?.agents || [])
  const inspectorOptions = computed(() => result.value?.filter_options?.inspectors || [])
  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / limit.value)))

  /** 按收车日期分组标记首行，便于视觉分隔 */
  const displayList = computed(() =>
    list.value.map((row, idx, arr) => ({
      ...row,
      _dateGroupStart: idx === 0 || arr[idx - 1].collect_date !== row.collect_date
    }))
  )

  const kpiCards = computed(() => [
    { label: '质检总数', value: `${stats.value?.total ?? 0} 辆`, color: '#1890FF' },
    { label: '已完成', value: `${stats.value?.completed ?? 0} 辆`, color: '#52C41A' },
    { label: '质检中', value: `${stats.value?.in_progress ?? 0} 辆`, color: '#13C2C2' },
    {
      label: '已质检·待补资料',
      value: `${stats.value?.pending_materials ?? 0} 辆`,
      color: '#722ED1'
    },
    { label: '不合格', value: `${stats.value?.failed ?? 0} 辆`, color: '#FF4D4F' }
  ])

  const gridOptions = {
    border: true,
    size: 'small' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    height: '100%',
    scrollX: { enabled: true, gt: 0 },
    columnConfig: { resizable: false },
    rowConfig: { isHover: true, height: 44 },
    rowClassName: ({ row }: { row: { _dateGroupStart?: boolean } }) =>
      row._dateGroupStart ? 'qc-date-group-start' : '',
    showFooter: true,
    footerRowClassName: 'qc-footer-row'
  }

  const gridColumns = computed(() => buildQcColumns())

  function plateStatusClass(status?: string) {
    if (status === '牌照齐全') return 'is-plate-ok'
    if (status === '无牌照') return 'is-plate-none'
    return 'is-plate-partial'
  }

  function fuelTypeClass(fuel?: string) {
    if (fuel === '纯电动') return 'is-ev'
    if (fuel?.includes('混动')) return 'is-hybrid'
    return 'is-fuel-default'
  }

  function catalystClass(status?: string) {
    if (status === '有' || status === '正常') return 'qc-ok'
    if (status === '无' || status === '损坏' || status === '已拆') return 'qc-bad'
    return 'qc-muted'
  }

  const footerWeightText = computed(() => {
    const weight =
      totalWeight.value ?? list.value.reduce((sum, row) => sum + Number(row.weight || 0), 0)
    return weight.toFixed(2)
  })

  function footerMethod({ columns }: { columns: { field?: string; type?: string }[] }) {
    if (!list.value.length) return []
    if (isQcFixedFooterColumns(columns)) {
      return [columns.map(() => '')]
    }
    const { weightIdx } = getQcFooterMeta(columns)
    return [
      columns.map((col, idx) => {
        if (idx === 0) return `合计（${count.value} 辆）：`
        if (col.field === 'weight') return footerWeightText.value
        if (idx > 0 && idx < weightIdx) return ''
        return ''
      })
    ]
  }

  function footerSpanMethod({
    columnIndex,
    rowIndex,
    column,
    columns
  }: {
    columnIndex: number
    rowIndex: number
    column?: { field?: string; type?: string; fixed?: string }
    columns?: { field?: string; type?: string }[]
  }) {
    if (rowIndex !== 0 || !list.value.length) return { rowspan: 1, colspan: 1 }

    const isFixedSection =
      column?.fixed === 'left' || (columns?.length ? isQcFixedFooterColumns(columns) : false)

    if (isFixedSection) {
      if (columnIndex === 0) return { rowspan: 1, colspan: QC_FIXED_COL_COUNT }
      return { rowspan: 0, colspan: 0 }
    }

    const sectionColumns =
      columns && columns.length > 0 ? columns : flattenQcColumns().slice(QC_FIXED_COL_COUNT)
    const { weightIdx, labelColspan, tailColspan } = getQcFooterMeta(sectionColumns)
    if (columnIndex === 0) return { rowspan: 1, colspan: labelColspan }
    if (columnIndex > 0 && columnIndex < labelColspan) return { rowspan: 0, colspan: 0 }
    if (columnIndex === weightIdx + 1 && tailColspan > 0) {
      return { rowspan: 1, colspan: tailColspan }
    }
    if (columnIndex > weightIdx + 1) return { rowspan: 0, colspan: 0 }
    return { rowspan: 1, colspan: 1 }
  }

  /** 拉取全量磅重合计（优先 stats.total_weight） */
  async function loadTotalWeight(params: ReturnType<typeof buildQueryParams>) {
    const currentStats = result.value?.stats
    if (currentStats?.total_weight != null) {
      totalWeight.value = Number(currentStats.total_weight)
      return
    }
    const total = result.value?.count || 0
    if (!total) {
      totalWeight.value = null
      return
    }
    try {
      const res = await fetchQualityInspection({
        ...params,
        page: 1,
        limit: Math.min(total, 9999)
      })
      totalWeight.value = (res.list || []).reduce((sum, row) => sum + Number(row.weight || 0), 0)
    } catch {
      totalWeight.value = null
    }
  }

  function buildQueryParams() {
    return {
      keyword: keyword.value || undefined,
      start_date: queryRange.value[0],
      end_date: queryRange.value[1],
      qc_status: qcStatus.value || undefined,
      owner_type: ownerType.value || undefined,
      emission_standard: emissionStandard.value || undefined,
      fuel_type: fuelType.value || undefined,
      agent_name: agentName.value || undefined,
      inspector_name: inspectorName.value || undefined,
      page: page.value,
      limit: limit.value
    }
  }

  async function loadData() {
    loading.value = true
    try {
      const params = buildQueryParams()
      result.value = await fetchQualityInspection(params)
      void loadTotalWeight(params)
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    if (!dateRange.value || dateRange.value.length !== 2) {
      ElMessage.warning('请选择日期范围')
      return
    }
    queryRange.value = [...dateRange.value]
    page.value = 1
    loadData()
  }

  function handleReset() {
    dateRange.value = defaultReportDateRange()
    queryRange.value = defaultReportDateRange()
    keyword.value = ''
    qcStatus.value = ''
    ownerType.value = ''
    emissionStandard.value = ''
    fuelType.value = ''
    agentName.value = ''
    inspectorName.value = ''
    page.value = 1
    loadData()
  }

  function onPageSizeChange() {
    page.value = 1
    loadData()
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

  watch(totalWeight, () => {
    gridRef.value?.updateFooter?.()
  })
</script>

<style lang="scss">
  @use './index';
</style>
