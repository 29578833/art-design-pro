<template>
  <div class="fs-export-page art-full-height">
    <div class="fs-export-header">
      <div>
        <div class="fs-page-title">结算车辆导出</div>
        <div class="fs-page-desc">按分组字段导出车辆结算宽表，支持列显示配置</div>
      </div>
      <div class="fs-export-header-actions">
        <ElButton @click="columnDialogVisible = true">
          <ArtSvgIcon icon="ri:table-line" class="mr-1" />
          列显示设置
        </ElButton>
        <ElButton type="primary" :loading="exporting" @click="handleExport">
          <ArtSvgIcon icon="ri:download-line" class="mr-1" />
          导出Excel
        </ElButton>
      </div>
    </div>

    <ElCard shadow="never" class="fs-export-card" :body-style="{ padding: 0 }">
      <div class="fs-export-filters">
        <ElInput
          v-model="searchForm.plate_no"
          placeholder="车牌号"
          clearable
          style="width: 120px"
        />
        <ElInput
          v-model="searchForm.vehicle_no"
          placeholder="自编号"
          clearable
          style="width: 120px"
        />
        <ElInput
          v-model="searchForm.owner_name"
          placeholder="产权人"
          clearable
          style="width: 120px"
        />
        <ElInput
          v-model="searchForm.payee_name"
          placeholder="收款人"
          clearable
          style="width: 120px"
        />
        <ElInput
          v-model="searchForm.payee_account"
          placeholder="收款账号"
          clearable
          style="width: 140px"
        />
        <ElSelect v-model="searchForm.salesman" placeholder="业务员" clearable style="width: 120px">
          <ElOption
            v-for="item in businessOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </ElSelect>
        <ElSelect v-model="searchForm.status" placeholder="是否结算" clearable style="width: 120px">
          <ElOption label="待结算" value="pending" />
          <ElOption label="已结算" value="settled" />
        </ElSelect>
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="入库开始"
          end-placeholder="入库结束"
          :unlink-panels="true"
          style="width: 240px"
        />
        <ElButton type="primary" @click="handleSearch">查询</ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </div>

      <div v-loading="loading" class="fs-export-table-wrap">
        <vxe-grid
          v-bind="gridOptions"
          class="fs-export-vxe"
          :data="tableRows"
          :columns="gridColumns"
          :header-cell-style="headerCellStyle"
        >
          <template #status="{ row }">
            <span
              class="fs-settle-badge"
              :class="row.status === 'pending' ? 'is-pending' : 'is-done'"
            >
              {{ row.status === 'pending' ? '待结算' : '已结算' }}
            </span>
          </template>
          <template #settlement_amount="{ row }">
            <span v-if="row.status === 'pending'" class="text-gray-300">—</span>
            <span v-else class="fs-settle-amt">{{
              Number(row.settlement_amount || 0).toLocaleString()
            }}</span>
          </template>
          <template #service_fee_amount="{ row }">
            <span class="fs-svc-amt">{{
              Number(row.service_fee_amount || 0).toLocaleString()
            }}</span>
          </template>
          <template #service_fee_invoice="{ row }">
            <span
              class="fs-svc-inv-badge"
              :class="row.service_fee_invoice ? 'is-invoiced' : 'is-none'"
            >
              {{ row.service_fee_invoice || '未开票' }}
            </span>
          </template>
          <template #empty>
            <span class="text-gray-400">暂无数据</span>
          </template>
        </vxe-grid>
      </div>

      <div class="pagination custom-pagination right fs-export-pagination">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </ElCard>

    <ElDialog
      v-model="columnDialogVisible"
      title="导出列显示设置"
      width="820px"
      align-center
      destroy-on-close
      class="fs-export-col-dialog"
    >
      <div class="fs-col-dialog-summary">
        <span
          >已选 <b>{{ selectedKeys.size }}</b> / {{ SETTLEMENT_EXPORT_COLUMNS.length }} 列</span
        >
        <ElButton link type="primary" @click="selectAllColumns">全选</ElButton>
        <ElButton link @click="clearAllColumns">清空</ElButton>
      </div>
      <div class="fs-col-dialog-body">
        <div
          v-for="group in SETTLEMENT_EXPORT_COLUMN_GROUPS"
          :key="group"
          class="fs-col-group"
          :style="groupPanelStyle(group)"
        >
          <div class="fs-col-group-head">
            <ElCheckbox
              :model-value="isGroupChecked(group)"
              :indeterminate="isGroupIndeterminate(group)"
              @change="(v: boolean) => toggleGroup(group, v)"
            >
              {{ group }}
            </ElCheckbox>
            <span class="fs-col-group-count">
              {{ groupSelectedCount(group) }}/{{ columnsByGroup(group).length }}
            </span>
          </div>
          <div class="fs-col-group-items">
            <label
              v-for="col in columnsByGroup(group)"
              :key="col.key"
              class="fs-col-item"
              :class="{ 'is-checked': selectedKeys.has(col.key) }"
            >
              <ElCheckbox
                :model-value="selectedKeys.has(col.key)"
                @change="toggleColumn(col.key)"
              />
              <span class="fs-col-item-label">{{ col.label }}</span>
            </label>
          </div>
        </div>
      </div>
      <template #footer>
        <ElButton @click="columnDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="columnDialogVisible = false">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchSettlementExportBusinessList,
    fetchSettlementVehicleExport,
    fetchSettlementVehicleExportList
  } from '@/api/recycle/finance-settlement'
  import {
    SETTLEMENT_EXPORT_COLUMN_GROUPS,
    SETTLEMENT_EXPORT_COLUMNS,
    SETTLEMENT_EXPORT_GROUP_COLORS,
    type SettlementExportColumnDef,
    type SettlementExportBusiness,
    type SettlementVehicleExportRow
  } from '@/types/recycle/finance/export/finance-settlement-export'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'RecycleFinanceExport' })

  /** 需要自定义插槽渲染的列字段 */
  const SLOT_FIELDS = new Set([
    'status',
    'settlement_amount',
    'service_fee_amount',
    'service_fee_invoice'
  ])

  /** 筛选条件 */
  const searchForm = reactive({
    vehicle_no: '',
    owner_name: '',
    plate_no: '',
    payee_name: '',
    payee_account: '',
    salesman: '' as number | '',
    status: '' as '' | 'pending' | 'settled',
    start_time: '',
    end_time: ''
  })
  const dateRange = ref<[string, string] | null>(null)

  /** 列表数据与分页 */
  const loading = ref(false)
  const tableRows = ref<SettlementVehicleExportRow[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })
  function buildParams() {
    return {
      vehicle_no: searchForm.vehicle_no,
      owner_name: searchForm.owner_name,
      plate_no: searchForm.plate_no,
      payee_name: searchForm.payee_name,
      payee_account: searchForm.payee_account,
      salesman: searchForm.salesman,
      status: searchForm.status,
      start_time: dateRange.value?.[0] || '',
      end_time: dateRange.value?.[1] || '',
      page: pagination.current,
      limit: pagination.size
    }
  }
  async function loadList() {
    loading.value = true
    try {
      const res = await fetchSettlementVehicleExportList(buildParams())
      tableRows.value = res.records
      pagination.total = res.total
      pagination.current = res.current
      pagination.size = res.size
    } finally {
      loading.value = false
    }
  }
  function handleSearch() {
    pagination.current = 1
    loadList()
  }
  function handleReset() {
    searchForm.vehicle_no = ''
    searchForm.owner_name = ''
    searchForm.plate_no = ''
    searchForm.payee_name = ''
    searchForm.payee_account = ''
    searchForm.salesman = ''
    searchForm.status = ''
    dateRange.value = null
    pagination.current = 1
    loadList()
  }

  /** 业务员下拉 */
  const businessOptions = ref<SettlementExportBusiness[]>([])

  /** 列显示设置弹窗 */
  const columnDialogVisible = ref(false)
  const selectedKeys = ref(new Set(SETTLEMENT_EXPORT_COLUMNS.map((c) => c.key)))
  const visibleColumns = computed(() =>
    SETTLEMENT_EXPORT_COLUMNS.filter((c) => selectedKeys.value.has(c.key))
  )
  const visibleGroups = computed(() => {
    const map = new Map<string, SettlementExportColumnDef[]>()
    for (const col of visibleColumns.value) {
      if (!map.has(col.group)) map.set(col.group, [])
      map.get(col.group)!.push(col)
    }
    return SETTLEMENT_EXPORT_COLUMN_GROUPS.filter((g) => map.has(g)).map((name) => ({
      name,
      cols: map.get(name)!
    }))
  })
  function columnsByGroup(group: string) {
    return SETTLEMENT_EXPORT_COLUMNS.filter((c) => c.group === group)
  }
  function isGroupChecked(group: string) {
    const cols = columnsByGroup(group)
    return cols.every((c) => selectedKeys.value.has(c.key))
  }
  function isGroupIndeterminate(group: string) {
    const cols = columnsByGroup(group)
    const n = cols.filter((c) => selectedKeys.value.has(c.key)).length
    return n > 0 && n < cols.length
  }
  function toggleGroup(group: string, on: boolean) {
    const next = new Set(selectedKeys.value)
    for (const col of columnsByGroup(group)) {
      if (on) next.add(col.key)
      else next.delete(col.key)
    }
    selectedKeys.value = next
  }
  function toggleColumn(key: string) {
    const next = new Set(selectedKeys.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    selectedKeys.value = next
  }
  function selectAllColumns() {
    selectedKeys.value = new Set(SETTLEMENT_EXPORT_COLUMNS.map((c) => c.key))
  }
  function clearAllColumns() {
    selectedKeys.value = new Set()
  }
  function groupSelectedCount(group: string) {
    return columnsByGroup(group).filter((c) => selectedKeys.value.has(c.key)).length
  }
  function groupPanelStyle(group: string) {
    const colors = SETTLEMENT_EXPORT_GROUP_COLORS[group]
    if (!colors) return undefined
    return {
      '--fs-col-group-bg': colors[0],
      '--fs-col-group-color': colors[1]
    }
  }

  /** vxe 表格列与样式 */
  const gridColumns = computed(() => {
    const leafCols = visibleGroups.value.map((group) => ({
      title: group.name,
      children: group.cols.map((col) => buildLeafColumn(col))
    }))
    return [
      {
        type: 'seq',
        title: '序号',
        width: 44,
        fixed: 'left',
        align: 'center',
        headerAlign: 'center',
        headerClassName: 'fs-export-seq-header',
        className: 'fs-export-seq-cell'
      },
      ...leafCols
    ]
  })
  const gridOptions = {
    border: true,
    size: 'mini' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    height: '100%',
    scrollX: { enabled: true, gt: 0 },
    rowConfig: { isHover: true, height: 48 },
    columnConfig: { resizable: false },
    emptyText: '暂无数据'
  }
  function buildLeafColumn(col: SettlementExportColumnDef) {
    const base = {
      field: col.key,
      title: col.label,
      width: col.width || 88,
      align: 'center' as const,
      headerAlign: 'center' as const,
      headerClassName: 'fs-export-col-header'
    }
    if (SLOT_FIELDS.has(col.key)) {
      return { ...base, slots: { default: col.key } }
    }
    return {
      ...base,
      formatter: ({ cellValue }: { cellValue: unknown }) => formatCellValue(cellValue)
    }
  }
  function headerCellStyle({ column }: { column: { title?: string; children?: unknown[] } }) {
    if (column.children?.length && column.title) {
      const colors = SETTLEMENT_EXPORT_GROUP_COLORS[column.title]
      if (colors) {
        return {
          backgroundColor: colors[0],
          color: colors[1],
          fontWeight: '700',
          fontSize: '11px'
        }
      }
    }
    return null
  }
  function formatCellValue(val: unknown) {
    if (val === undefined || val === null || val === '') return '—'
    return String(val)
  }

  /** 导出 Excel（按当前可见列） */
  const exporting = ref(false)
  async function handleExport() {
    exporting.value = true
    try {
      const cols = visibleColumns.value
      if (!cols.length) {
        ElMessage.warning('请至少选择一列')
        return
      }
      const result = await fetchSettlementVehicleExport({
        vehicle_no: searchForm.vehicle_no,
        owner_name: searchForm.owner_name,
        plate_no: searchForm.plate_no,
        payee_name: searchForm.payee_name,
        payee_account: searchForm.payee_account,
        salesman: searchForm.salesman,
        status: searchForm.status,
        start_time: dateRange.value?.[0] || '',
        end_time: dateRange.value?.[1] || '',
        fields: cols.map((col) => col.exportKey).join(',')
      })
      const rows = result.list || []
      if (!rows.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheetRows = rows.map((row) => {
        const obj: Record<string, string | number> = {}
        cols.forEach((col) => {
          obj[col.label] = row[col.exportKey] ?? row[col.key] ?? ''
        })
        return obj
      })
      const sheet = XLSX.utils.json_to_sheet(sheetRows)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '结算车辆')
      XLSX.writeFile(book, `结算车辆导出_${new Date().toISOString().slice(0, 10)}.xlsx`)
      ElMessage.success('导出成功')
    } finally {
      exporting.value = false
    }
  }

  onMounted(() => {
    loadList()
    fetchSettlementExportBusinessList().then((list) => {
      businessOptions.value = list || []
    })
  })
</script>

<style lang="scss">
  @use './export';
</style>
