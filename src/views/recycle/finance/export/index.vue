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
        <ElInput v-model="searchForm.plate" placeholder="车牌号" clearable style="width: 120px" />
        <ElInput v-model="searchForm.self_no" placeholder="自编号" clearable style="width: 120px" />
        <ElInput
          v-model="searchForm.salesman"
          placeholder="业务员"
          clearable
          style="width: 120px"
        />
        <ElSelect
          v-model="searchForm.settle_status"
          placeholder="是否结算"
          clearable
          style="width: 120px"
        >
          <ElOption label="待结算" value="待结算" />
          <ElOption label="已结算" value="已结算" />
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
        <table class="fs-export-table">
          <thead>
            <tr>
              <th
                v-for="group in visibleGroups"
                :key="group.name"
                :colspan="group.cols.length"
                class="fs-group-th"
                :style="{
                  background: SETTLEMENT_EXPORT_GROUP_COLORS[group.name][0],
                  color: SETTLEMENT_EXPORT_GROUP_COLORS[group.name][1]
                }"
              >
                {{ group.name }}
              </th>
            </tr>
            <tr>
              <th v-for="col in visibleColumns" :key="col.key" class="fs-col-th">{{
                col.label
              }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!tableRows.length">
              <td :colspan="visibleColumns.length || 1" class="fs-empty">暂无数据</td>
            </tr>
            <tr v-for="(row, idx) in tableRows" :key="idx">
              <td v-for="col in visibleColumns" :key="col.key">{{ formatCell(row, col.key) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="fs-export-pagination">
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

    <ElDialog v-model="columnDialogVisible" title="导出列显示设置" width="760px" destroy-on-close>
      <div v-for="group in SETTLEMENT_EXPORT_COLUMN_GROUPS" :key="group" class="fs-col-group">
        <div class="fs-col-group-head">
          <ElCheckbox
            :model-value="isGroupChecked(group)"
            :indeterminate="isGroupIndeterminate(group)"
            @change="(v: boolean) => toggleGroup(group, v)"
          >
            {{ group }}
          </ElCheckbox>
        </div>
        <div class="fs-col-group-items">
          <ElCheckbox
            v-for="col in columnsByGroup(group)"
            :key="col.key"
            :model-value="selectedKeys.has(col.key)"
            @change="toggleColumn(col.key)"
          >
            {{ col.label }}
          </ElCheckbox>
        </div>
      </div>
      <template #footer>
        <ElButton @click="selectAllColumns">全选</ElButton>
        <ElButton type="primary" @click="columnDialogVisible = false">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import {
    fetchSettlementVehicleExportAll,
    fetchSettlementVehicleExportList
  } from '@/api/recycle/finance-settlement-export.mock'
  import {
    SETTLEMENT_EXPORT_COLUMN_GROUPS,
    SETTLEMENT_EXPORT_COLUMNS,
    SETTLEMENT_EXPORT_GROUP_COLORS,
    type SettlementVehicleExportRow
  } from '@/types/recycle/finance-settlement-export'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  defineOptions({ name: 'RecycleFinanceExport' })

  const searchForm = reactive({
    plate: '',
    self_no: '',
    salesman: '',
    settle_status: '' as '' | '待结算' | '已结算',
    date_start: '',
    date_end: ''
  })

  const dateRange = ref<[string, string] | null>(null)
  const loading = ref(false)
  const exporting = ref(false)
  const tableRows = ref<SettlementVehicleExportRow[]>([])
  const pagination = reactive({ current: 1, size: 10, total: 0 })

  const selectedKeys = ref(new Set(SETTLEMENT_EXPORT_COLUMNS.map((c) => c.key)))
  const columnDialogVisible = ref(false)

  const visibleColumns = computed(() =>
    SETTLEMENT_EXPORT_COLUMNS.filter((c) => selectedKeys.value.has(c.key))
  )

  const visibleGroups = computed(() => {
    const map = new Map<string, typeof SETTLEMENT_EXPORT_COLUMNS>()
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

  function buildParams() {
    return {
      plate: searchForm.plate,
      self_no: searchForm.self_no,
      salesman: searchForm.salesman,
      settle_status: searchForm.settle_status,
      date_start: dateRange.value?.[0] || '',
      date_end: dateRange.value?.[1] || '',
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
    searchForm.plate = ''
    searchForm.self_no = ''
    searchForm.salesman = ''
    searchForm.settle_status = ''
    dateRange.value = null
    pagination.current = 1
    loadList()
  }

  function formatCell(row: SettlementVehicleExportRow, key: string) {
    const val = (row as Record<string, unknown>)[key]
    if (val === undefined || val === null || val === '') return '—'
    return String(val)
  }

  async function handleExport() {
    exporting.value = true
    try {
      const cols = visibleColumns.value
      if (!cols.length) {
        ElMessage.warning('请至少选择一列')
        return
      }
      const rows = await fetchSettlementVehicleExportAll({
        plate: searchForm.plate,
        self_no: searchForm.self_no,
        salesman: searchForm.salesman,
        settle_status: searchForm.settle_status,
        date_start: dateRange.value?.[0] || '',
        date_end: dateRange.value?.[1] || ''
      })
      if (!rows.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const sheetRows = rows.map((row) => {
        const obj: Record<string, string | number> = {}
        for (const col of cols) {
          obj[col.label] = (row as Record<string, unknown>)[col.key] as string | number
        }
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
  })
</script>

<style lang="scss">
  @use './export';
</style>
