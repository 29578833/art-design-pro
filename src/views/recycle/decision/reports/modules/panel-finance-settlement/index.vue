<template>
  <div v-loading="loading" class="fs-panel">
    <div class="fs-kpi-grid">
      <div v-for="item in kpiCards" :key="item.key" class="fs-kpi-card">
        <div class="fs-kpi-label">{{ item.label }}</div>
        <div class="fs-kpi-value" :style="{ color: item.color }">{{ item.value }}</div>
        <div class="fs-kpi-sub">{{ item.sub }}</div>
      </div>
    </div>

    <div class="fs-filter-bar">
      <div class="fs-filter-top">
        <div class="fs-gran-group">
          <button
            v-for="item in TIME_MODE_OPTIONS"
            :key="item.value"
            type="button"
            class="fs-gran-btn"
            :class="{ 'is-active': timeMode === item.value }"
            @click="switchTimeMode(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="fs-date-groups">
          <div class="fs-date-row">
            <span class="fs-date-label">入库时间</span>
            <ElButton size="small" @click="shiftGroup('entry', -1)"
              >‹ {{ shiftLabel(-1) }}</ElButton
            >
            <ElDatePicker
              v-model="entryRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="—"
              start-placeholder="开始"
              end-placeholder="结束"
              class="fs-date-single"
            />
            <ElButton size="small" @click="shiftGroup('entry', 1)">{{ shiftLabel(1) }} ›</ElButton>
            <ElButton link type="primary" @click="jumpGroupNow('entry')">{{ quickLabel }}</ElButton>
          </div>
          <div class="fs-date-row">
            <span class="fs-date-label">档案创建</span>
            <ElButton size="small" @click="shiftGroup('archive', -1)"
              >‹ {{ shiftLabel(-1) }}</ElButton
            >
            <ElDatePicker
              v-model="archiveRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="—"
              start-placeholder="开始"
              end-placeholder="结束"
              class="fs-date-single"
            />
            <ElButton size="small" @click="shiftGroup('archive', 1)"
              >{{ shiftLabel(1) }} ›</ElButton
            >
            <ElButton link type="primary" @click="jumpGroupNow('archive')">{{
              quickLabel
            }}</ElButton>
          </div>
          <div class="fs-date-row">
            <span class="fs-date-label">回收开单时间</span>
            <ElButton size="small" @click="shiftGroup('order', -1)"
              >‹ {{ shiftLabel(-1) }}</ElButton
            >
            <ElDatePicker
              v-model="orderRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="—"
              start-placeholder="开始"
              end-placeholder="结束"
              class="fs-date-single"
            />
            <ElButton size="small" @click="shiftGroup('order', 1)">{{ shiftLabel(1) }} ›</ElButton>
            <ElButton link type="primary" @click="jumpGroupNow('order')">{{ quickLabel }}</ElButton>
          </div>
        </div>

        <div class="fs-filter-btns">
          <ElButton @click="filterExpanded = !filterExpanded">
            <ArtSvgIcon icon="ri:filter-3-line" class="mr-1" />
            {{ filterExpanded ? '收起筛选' : '更多筛选' }}
          </ElButton>
          <ElButton type="primary" @click="handleSearch">
            <ArtSvgIcon icon="ri:filter-3-line" class="mr-1" />
            查询
          </ElButton>
          <ElButton @click="handleReset">
            <ArtSvgIcon icon="ri:close-line" class="mr-1" />
            重置
          </ElButton>
          <ElButton type="primary" :loading="exporting" @click="handleExport">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel
          </ElButton>
        </div>
      </div>

      <div v-if="filterExpanded" class="fs-more-grid">
        <div v-for="f in moreFilters" :key="f.key" class="fs-more-item">
          <div class="fs-more-item-label">{{ f.label }}</div>
          <ElInput
            v-model="filters[f.key]"
            :placeholder="f.ph"
            clearable
            @input="debouncedHandleSearch"
          />
        </div>
      </div>
    </div>

    <div class="fs-report-card">
      <div class="fs-report-title">
        <span class="fs-report-title-main">财务结算申请表</span>
        <span class="fs-record-count">{{ count }} 条记录</span>
      </div>

      <div class="fs-table-wrap">
        <vxe-grid
          class="fs-vxe-grid"
          v-bind="gridOptions"
          :data="list"
          :columns="gridColumns"
          :footer-method="footerMethod"
          :footer-span-method="footerSpanMethod"
        >
          <template #row_no="{ rowIndex }">
            {{ (page - 1) * limit + rowIndex + 1 }}
          </template>
          <template #vehicle_no="{ row }">
            <span class="fs-link">{{ fmtFsText(row.vehicle_no) }}</span>
          </template>
          <template #my_vehicle_model="{ row }">{{ fmtFsText(row.my_vehicle_model) }}</template>
          <template #vehicle_class="{ row }">
            <span class="fs-badge">{{ fmtFsText(row.vehicle_class) }}</span>
          </template>
          <template #entry_date="{ row }">{{ fmtFsText(row.entry_date) }}</template>
          <template #warehouse_date="{ row }">{{ fmtFsText(row.warehouse_date) }}</template>
          <template #warehouse_no="{ row }">
            <span class="fs-link-dark">{{ fmtFsText(row.warehouse_no) }}</span>
          </template>
          <template #owner_name="{ row }">
            <b>{{ fmtFsText(row.owner_name) }}</b>
          </template>
          <template #owner_id_number="{ row }">
            <span class="fs-muted">{{ fmtFsText(row.owner_id_number) }}</span>
          </template>
          <template #owner_address="{ row }">{{ fmtFsText(row.owner_address) }}</template>
          <template #owner_bank_card="{ row }">
            <span class="fs-muted">{{ fmtFsText(row.owner_bank_card) }}</span>
          </template>
          <template #archive_no="{ row }">
            <span class="fs-link-dark">{{ fmtFsText(row.archive_no) }}</span>
          </template>
          <template #order_no="{ row }">
            <span class="fs-link-dark">{{ fmtFsText(row.order_no) }}</span>
          </template>
          <template #agent_name="{ row }">{{ fmtFsText(row.agent_name) }}</template>
          <template #agent_id_number="{ row }">
            <span class="fs-muted">{{ fmtFsText(row.agent_id_number) }}</span>
          </template>
          <template #agent_phone="{ row }">{{ fmtFsText(row.agent_phone) }}</template>
          <template #agent_contact="{ row }">{{ fmtFsText(row.agent_contact) }}</template>
          <template #agent_address="{ row }">{{ fmtFsText(row.agent_address) }}</template>
          <template #agent_bank_card="{ row }">
            <span class="fs-muted">{{ fmtFsText(row.agent_bank_card) }}</span>
          </template>
          <template #plate_no="{ row }">
            <span class="fs-weight">{{ fmtFsText(row.plate_no) }}</span>
          </template>
          <template #vin="{ row }">
            <span class="fs-muted">{{ fmtFsText(row.vin) }}</span>
          </template>
          <template #engine_no="{ row }">
            <span class="fs-muted">{{ fmtFsText(row.engine_no) }}</span>
          </template>
          <template #brand="{ row }">{{ fmtFsText(row.brand) }}</template>
          <template #vehicle_type_text="{ row }">{{ fmtFsText(row.vehicle_type_text) }}</template>
          <template #weight="{ row }">
            <span class="fs-weight">{{ fmtFsText(row.weight) }}</span>
          </template>
          <template #scale_diff="{ row }">{{ fmtFsText(row.scale_diff) }}</template>
          <template #actual_scale="{ row }">{{ fmtFsText(row.actual_scale) }}</template>
          <template #transport_subsidy="{ row }">{{ fmtFsAmt(row.transport_subsidy) }}</template>
          <template #transport_subsidy_amt="{ row }">
            <span class="fs-year">{{ fmtFsAmt(row.transport_subsidy_amt) }}</span>
          </template>
          <template #freight_category="{ row }">{{ fmtFsText(row.freight_category) }}</template>
          <template #freight_per_ton="{ row }">{{ fmtFsAmt(row.freight_per_ton) }}</template>
          <template #settlement_category="{ row }">
            {{ fmtFsText(row.settlement_category) }}
          </template>
          <template #settlement_price="{ row }">{{ fmtFsAmt(row.settlement_price) }}</template>
          <template #vehicle_count="{ row }">{{ fmtFsText(row.vehicle_count) }}</template>
          <template #bidding_contract="{ row }">{{ fmtFsText(row.bidding_contract) }}</template>
          <template #contract_amt="{ row }">
            <b>{{ fmtFsAmt(row.contract_amt) }}</b>
          </template>
          <template #payable_amt="{ row }">
            <span class="fs-payable">{{ fmtFsAmt(row.payable_amt) }}</span>
          </template>
          <template #cash_pay_amt="{ row }">{{ fmtFsAmt(row.cash_pay_amt) }}</template>
          <template #service_fee_category="{ row }">
            {{ fmtFsText(row.service_fee_category) }}
          </template>
          <template #service_fee_per_ton="{ row }">
            {{ fmtFsText(row.service_fee_per_ton) }}
          </template>
          <template #service_fee_total="{ row }">
            <span style="color: #d46b08">{{ fmtFsAmt(row.service_fee_total) }}</span>
          </template>
          <template #regular_fee_total="{ row }">{{ fmtFsAmt(row.regular_fee_total) }}</template>
          <template #year_total_amt="{ row }">
            <span class="fs-year">{{ fmtFsAmt(row.year_total_amt) }}</span>
          </template>
          <template #grand_total="{ row }">
            <b>{{ fmtFsAmt(row.grand_total) }}</b>
          </template>
          <template #remark="{ row }">
            <span class="fs-link">{{ fmtFsText(row.remark) }}</span>
          </template>
          <template #settlement_no="{ row }">
            <span class="fs-link-dark">{{ fmtFsText(row.settlement_no) }}</span>
          </template>
          <template #other_fee="{ row }">{{ fmtFsAmt(row.other_fee) }}</template>
          <template #branch_office="{ row }">{{ fmtFsText(row.branch_office) }}</template>
          <template #empty>
            <span>暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>
      </div>

      <div class="fs-pagination">
        <span class="fs-pagination-info">
          共 <b>{{ count }}</b> 条，第 <b>{{ page }}</b> / {{ totalPages }} 页
        </span>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="limit"
          :total="count"
          :page-sizes="[10, 20, 50]"
          layout="sizes, prev, pager, next"
          @current-change="loadData"
          @size-change="onPageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { fetchFinancialSettlement } from '@/api/recycle/report'
  import type {
    FinancialSettlementItem,
    FinancialSettlementResult
  } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { granRange, shiftGranRange, type ReportTimeMode } from '../../utils'
  import {
    buildFinanceSettlementColumns,
    fmtFsAmt,
    fmtFsText,
    FS_FOOTER_LABEL_COLSPAN,
    FS_SUM_FIELDS,
    isFsFixedFooterColumns,
    parseFsNumber
  } from './grid-columns'
  import { useFinanceSettlementExport } from './grid-export'

  defineOptions({ name: 'PanelFinanceSettlement' })

  type FilterKey =
    | 'remark'
    | 'plate_no'
    | 'vehicle_no'
    | 'my_vehicle_model'
    | 'owner'
    | 'agent_name'
    | 'agent_phone'
    | 'warehouse_no'
    | 'archive_no'
    | 'order_no'
    | 'vehicle_category'

  const TIME_MODE_OPTIONS = [
    { label: '按天', value: 'day' as const },
    { label: '按周', value: 'week' as const },
    { label: '按月', value: 'month' as const }
  ]

  const moreFilters: { key: FilterKey; label: string; ph: string }[] = [
    { key: 'remark', label: '备注(业务员)', ph: '搜索备注/业务员' },
    { key: 'plate_no', label: '车牌号', ph: '搜索车牌号' },
    { key: 'vehicle_no', label: '自编号', ph: '搜索自编号' },
    { key: 'my_vehicle_model', label: '我司车型', ph: '搜索我司车型' },
    { key: 'owner', label: '车辆产权人', ph: '搜索产权人' },
    { key: 'agent_name', label: '代理人', ph: '搜索代理人' },
    { key: 'agent_phone', label: '代理人手机号', ph: '搜索手机号' },
    { key: 'warehouse_no', label: '车辆入库单号', ph: '搜索入库单号' },
    { key: 'archive_no', label: '车辆档案单号', ph: '搜索档案单号' },
    { key: 'order_no', label: '回收订单号', ph: '搜索回收订单号' },
    { key: 'vehicle_category', label: '车辆类型', ph: '搜索车辆类型' }
  ]

  const loading = ref(false)
  const filterExpanded = ref(false)
  const result = ref<FinancialSettlementResult | null>(null)
  const { exporting, exportReport } = useFinanceSettlementExport()

  const initRange = granRange('month')
  const timeMode = ref<ReportTimeMode>('month')
  const entryRange = ref<[string, string] | null>([...initRange])
  const archiveRange = ref<[string, string] | null>([...initRange])
  const orderRange = ref<[string, string] | null>([...initRange])
  const page = ref(1)
  const limit = ref(20)

  const filters = reactive<Record<FilterKey, string>>({
    remark: '',
    plate_no: '',
    vehicle_no: '',
    my_vehicle_model: '',
    owner: '',
    agent_name: '',
    agent_phone: '',
    warehouse_no: '',
    archive_no: '',
    order_no: '',
    vehicle_category: ''
  })

  const list = computed(() => result.value?.list || [])
  const count = computed(() => result.value?.count || 0)
  const stats = computed(() => result.value?.stats)
  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / limit.value)))

  const quickLabel = computed(() =>
    timeMode.value === 'day' ? '今天' : timeMode.value === 'week' ? '本周' : '本月'
  )

  const kpiCards = computed(() => [
    {
      key: 'cars',
      label: '本期结算车辆',
      value: `${stats.value?.settlementCount ?? 0} 辆`,
      sub: `共 ${count.value} 条`,
      color: '#1890FF'
    },
    {
      key: 'payable',
      label: '应付金额合计',
      value: `¥${stats.value?.totalAmount ?? '0'}`,
      sub: '元',
      color: '#FA8C16'
    },
    {
      key: 'fee',
      label: '服务费合计',
      value: `¥${stats.value?.serviceFee ?? '0'}`,
      sub: '元',
      color: '#722ED1'
    },
    {
      key: 'year',
      label: '本年总金额合计',
      value: `¥${stats.value?.yearTotalAmount ?? '0'}`,
      sub: '元',
      color: '#52C41A'
    }
  ])

  const gridColumns = computed(() => buildFinanceSettlementColumns())

  const gridOptions = {
    border: true,
    size: 'medium' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    scrollX: { enabled: true },
    columnConfig: { resizable: false },
    rowConfig: { isHover: true, height: 40 },
    showFooter: true,
    footerRowClassName: 'fs-footer-row'
  }

  const footerTotals = computed(() => {
    const totals: Record<string, string> = {}
    FS_SUM_FIELDS.forEach((field) => {
      const sum = list.value.reduce(
        (s, row) =>
          s + parseFsNumber(row[field as keyof FinancialSettlementItem] as string | number),
        0
      )
      if (!sum) {
        totals[field] = '—'
        return
      }
      if (field === 'weight' || field === 'actual_scale') {
        totals[field] = sum.toFixed(2)
      } else {
        totals[field] = sum.toLocaleString()
      }
    })
    return totals
  })

  function shiftLabel(dir: -1 | 1) {
    const map = {
      day: dir < 0 ? '前一天' : '后一天',
      week: dir < 0 ? '前一周' : '后一周',
      month: dir < 0 ? '前一月' : '后一月'
    }
    return map[timeMode.value]
  }

  function switchTimeMode(mode: ReportTimeMode) {
    timeMode.value = mode
    if (entryRange.value) entryRange.value = granRange(mode, new Date(entryRange.value[0]))
    if (archiveRange.value) archiveRange.value = granRange(mode, new Date(archiveRange.value[0]))
    if (orderRange.value) orderRange.value = granRange(mode, new Date(orderRange.value[0]))
  }

  function shiftGroup(key: 'entry' | 'archive' | 'order', delta: number) {
    if (key === 'entry') {
      if (!entryRange.value) return
      entryRange.value = shiftGranRange(
        entryRange.value[0],
        entryRange.value[1],
        timeMode.value,
        delta
      )
    } else if (key === 'archive') {
      if (!archiveRange.value) return
      archiveRange.value = shiftGranRange(
        archiveRange.value[0],
        archiveRange.value[1],
        timeMode.value,
        delta
      )
    } else {
      if (!orderRange.value) return
      orderRange.value = shiftGranRange(
        orderRange.value[0],
        orderRange.value[1],
        timeMode.value,
        delta
      )
    }
  }

  function jumpGroupNow(key: 'entry' | 'archive' | 'order') {
    const range = granRange(timeMode.value)
    if (key === 'entry') {
      entryRange.value = range
    } else if (key === 'archive') {
      archiveRange.value = range
    } else {
      orderRange.value = range
    }
  }

  function footerMethod({ columns }: { columns: { field?: string }[] }) {
    return [
      columns.map((col) => {
        if (col.field === 'row_no') return '合计'
        if (col.field === 'vehicle_no' || col.field === 'my_vehicle_model') return ''
        if (col.field && col.field in footerTotals.value) return footerTotals.value[col.field]
        return '—'
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
    columns?: { field?: string }[]
  }) {
    if (rowIndex !== 0) return { rowspan: 1, colspan: 1 }

    // 固定列区：前三列（二级表头）合并为「合计」
    if (columns && isFsFixedFooterColumns(columns)) {
      if (columnIndex === 0) return { rowspan: 1, colspan: FS_FOOTER_LABEL_COLSPAN }
      if (columnIndex > 0 && columnIndex < FS_FOOTER_LABEL_COLSPAN) {
        return { rowspan: 0, colspan: 0 }
      }
    }

    // 滚动列区：每个二级表头独立一格，不再合并
    return { rowspan: 1, colspan: 1 }
  }

  function buildParams() {
    return {
      plate_no: filters.plate_no || '',
      vehicle_no: filters.vehicle_no || '',
      my_vehicle_model: filters.my_vehicle_model || '',
      owner: filters.owner || '',
      agent_name: filters.agent_name || '',
      agent_phone: filters.agent_phone || '',
      warehouse_no: filters.warehouse_no || '',
      archive_no: filters.archive_no || '',
      order_no: filters.order_no || '',
      vehicle_category: filters.vehicle_category || '',
      remark: filters.remark || '',
      entry_start_date: entryRange.value ? entryRange.value[0] : '',
      entry_end_date: entryRange.value ? entryRange.value[1] : '',
      archive_start_date: archiveRange.value ? archiveRange.value[0] : '',
      archive_end_date: archiveRange.value ? archiveRange.value[1] : '',
      order_start_date: orderRange.value ? orderRange.value[0] : '',
      order_end_date: orderRange.value ? orderRange.value[1] : '',
      time_mode: timeMode.value,
      page: page.value,
      limit: limit.value
    }
  }

  function onPageSizeChange() {
    page.value = 1
    loadData()
  }

  async function loadData() {
    loading.value = true
    try {
      result.value = await fetchFinancialSettlement(buildParams())
    } catch (e) {
      console.log(e, 111)
      result.value = null
      ElMessage.error('加载财务结算申请表失败')
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    page.value = 1
    loadData()
  }

  const debouncedHandleSearch = useDebounceFn(handleSearch, 300)

  function handleReset() {
    timeMode.value = 'month'
    const range = granRange('month')
    entryRange.value = range
    archiveRange.value = range
    orderRange.value = range
    ;(Object.keys(filters) as FilterKey[]).forEach((k) => {
      filters[k] = ''
    })
    page.value = 1
    loadData()
  }

  function handleExport() {
    exportReport(
      { ...buildParams(), page: 1, limit: 200 },
      `入库日期：${entryRange.value?.[0] ?? ''} — ${entryRange.value?.[1] ?? ''}`
    )
  }

  onMounted(loadData)
</script>

<style lang="scss">
  @use './index';
</style>
