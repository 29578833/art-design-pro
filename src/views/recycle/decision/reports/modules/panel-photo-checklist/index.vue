<template>
  <div v-loading="loading" class="pc-panel">
    <div class="pc-kpi-grid">
      <div v-for="item in kpiCards" :key="item.key" class="pc-kpi-card">
        <div class="pc-kpi-label">{{ item.label }}</div>
        <div class="pc-kpi-value" :style="{ color: item.color }">{{ item.value }}</div>
        <div class="pc-kpi-sub">{{ item.sub }}</div>
      </div>
    </div>

    <div class="pc-filter-bar">
      <div class="pc-filter-row">
        <div class="pc-gran-group">
          <button
            v-for="item in TIME_MODE_OPTIONS"
            :key="item.value"
            type="button"
            class="pc-gran-btn"
            :class="{ 'is-active': timeMode === item.value }"
            @click="switchTimeMode(item.value)"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="pc-date-group">
          <ElButton size="small" @click="shiftDate(-1)">‹ 前一天</ElButton>
          <ElDatePicker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="—"
            start-placeholder="开始"
            end-placeholder="结束"
            class="pc-date-single"
          />
          <ElButton size="small" @click="shiftDate(1)">后一天 ›</ElButton>
          <ElButton link type="primary" @click="goToday">今天</ElButton>
        </div>

        <ElInput
          v-model="plateNo"
          placeholder="搜索车牌号"
          clearable
          class="pc-search-input"
          @input="debouncedHandleSearch"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" class="pc-search-icon" />
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

        <div class="pc-filter-actions">
          <ElButton :loading="exporting" @click="handleExport">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel（不含照片）
          </ElButton>
          <ElButton class="pc-dl-btn" :loading="downloading" @click="handleDownloadAll">
            <ArtSvgIcon icon="ri:folder-download-line" class="mr-1" />
            一键下载全部照片
          </ElButton>
        </div>
      </div>
    </div>

    <div class="pc-report-card">
      <div class="pc-report-title">
        <div>
          <div class="pc-report-title-main">{{ PC_REPORT_TITLE }}</div>
          <div class="pc-report-title-sub">{{ queryRange[0] }} — {{ queryRange[1] }}</div>
        </div>
        <span class="pc-record-count">{{ count }} 条记录</span>
      </div>

      <div class="pc-table-wrap">
        <vxe-grid
          class="pc-vxe-grid"
          v-bind="gridOptions"
          :data="list"
          :columns="gridColumns"
          :footer-method="footerMethod"
          :footer-span-method="footerSpanMethod"
        >
          <template #plate_no="{ row }">
            <span class="pc-plate">{{ row.plate_no || '—' }}</span>
          </template>
          <template #uploaded="{ row }">
            <span class="pc-count" :class="row.uploaded >= row.total ? 'is-ok' : 'is-warn'">
              {{ row.uploaded }}/{{ row.total }}
            </span>
          </template>
          <template v-for="col in PHOTO_COLS" :key="col.key" #[col.key]="{ row }">
            <ElImage
              v-if="row[col.key]"
              :src="row[col.key]"
              :preview-src-list="[row[col.key]]"
              fit="cover"
              class="pc-thumb"
              :style="{ background: col.color }"
            >
              <template #error>
                <div class="pc-thumb" :style="{ background: col.color }">
                  <ArtSvgIcon icon="ri:image-line" style="color: rgb(255 255 255 / 70%)" />
                  <span class="pc-thumb-label">{{ col.label }}</span>
                </div>
              </template>
            </ElImage>
            <div v-else class="pc-thumb-empty">未上传</div>
          </template>
          <template #action="{ row }">
            <ElButton size="small" class="pc-dl-btn" @click="handleDownloadRow(row)">
              下载照片
            </ElButton>
          </template>
          <template #empty>
            <span class="pc-empty-text">暂无数据，请调整筛选条件后查询</span>
          </template>
        </vxe-grid>
      </div>

      <div class="pc-pagination">
        <span class="pc-pagination-info">
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
  import { fetchPhotoChecklist } from '@/api/recycle/report'
  import type {
    PhotoChecklistItem,
    PhotoChecklistResult
  } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import {
    defaultReportDateRange,
    defaultTodayRange,
    granRange,
    shiftDayRange,
    type ReportTimeMode
  } from '../../utils'
  import { buildPhotoChecklistColumns, PHOTO_COLS } from './grid-columns'
  import { PC_REPORT_TITLE, usePhotoChecklistExport } from './grid-export'

  defineOptions({ name: 'PanelPhotoChecklist' })

  const TIME_MODE_OPTIONS = [
    { label: '按天', value: 'day' as const },
    { label: '按周', value: 'week' as const },
    { label: '按月', value: 'month' as const }
  ]

  const loading = ref(false)
  const result = ref<PhotoChecklistResult | null>(null)
  const { exporting, downloading, exportExcel, downloadPhotos } = usePhotoChecklistExport()

  const defaultRange = defaultReportDateRange()
  const dateRange = ref<[string, string] | null>([...defaultRange])
  const queryRange = ref<[string, string]>([...defaultRange])
  const timeMode = ref<ReportTimeMode>('month')
  const plateNo = ref('')
  const page = ref(1)
  const limit = ref(20)

  const list = computed(() => result.value?.list || [])
  const count = computed(() => result.value?.count || 0)
  const stats = computed(() => result.value?.stats)
  const summary = computed(() => result.value?.summary)
  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / limit.value)))

  const kpiCards = computed(() => [
    {
      key: 'cars',
      label: '本期归档车辆',
      value: `${count.value} 辆`,
      sub: '已拆解登记',
      color: '#1890FF'
    },
    {
      key: 'photos',
      label: '照片总数',
      value: `${stats.value?.totalPhotos ?? 0} 个`,
      sub: '已上传文件',
      color: '#13C2C2'
    },
    {
      key: 'rate',
      label: '资料完整率',
      value: `${stats.value?.completionRate ?? 0}%`,
      sub: '全量上传车辆',
      color: '#52C41A'
    },
    {
      key: 'pending',
      label: '待补传车辆',
      value: `${stats.value?.pendingCount ?? 0} 辆`,
      sub: '资料不完整',
      color: '#FA8C16'
    }
  ])

  const gridColumns = computed(() => buildPhotoChecklistColumns())

  const gridOptions = {
    border: true,
    size: 'mini' as const,
    align: 'center' as const,
    headerAlign: 'center' as const,
    showOverflow: 'tooltip' as const,
    autoResize: true,
    height: '100%',
    scrollX: { enabled: true },
    scrollY: { enabled: true, gt: 0 },
    columnConfig: { resizable: false },
    rowConfig: { isHover: true, height: 64 },
    showFooter: true,
    footerRowClassName: 'pc-footer-row'
  }

  function footerMethod({ columns }: { columns: { field?: string; type?: string }[] }) {
    const s = summary.value
    const rows = s?.total_rows || list.value.length || 0
    return [
      columns.map((col) => {
        if (col.type === 'seq') return '合计'
        if (col.field === 'uploaded') return `${s?.uploaded ?? 0}/${s?.total ?? 0}`
        const photoCol = PHOTO_COLS.find((c) => c.key === col.field)
        if (photoCol) {
          const n = (s?.[photoCol.key] as number | undefined) ?? 0
          return `${n}/${rows}`
        }
        return ''
      })
    ]
  }

  function footerSpanMethod({ columnIndex, rowIndex }: { columnIndex: number; rowIndex: number }) {
    if (rowIndex !== 0) return { rowspan: 1, colspan: 1 }
    if (columnIndex === 0) return { rowspan: 1, colspan: 5 }
    if (columnIndex > 0 && columnIndex < 5) return { rowspan: 0, colspan: 0 }
    return { rowspan: 1, colspan: 1 }
  }

  function buildParams() {
    return {
      plate_no: plateNo.value || undefined,
      start_date: dateRange.value?.[0],
      end_date: dateRange.value?.[1],
      time_mode: timeMode.value,
      page: page.value,
      limit: limit.value
    }
  }

  function switchTimeMode(mode: ReportTimeMode) {
    timeMode.value = mode
    if (!dateRange.value) return
    const [s, e] = granRange(mode, new Date(dateRange.value[0]))
    dateRange.value = [s, e]
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
    loadData()
  }

  async function loadData() {
    loading.value = true
    try {
      result.value = await fetchPhotoChecklist(buildParams())
      if (dateRange.value) queryRange.value = [...dateRange.value]
    } catch {
      result.value = null
      ElMessage.error('加载照片清单失败')
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

  function handleReset() {
    timeMode.value = 'month'
    dateRange.value = defaultReportDateRange()
    plateNo.value = ''
    page.value = 1
    loadData()
  }

  function handleExport() {
    exportExcel({
      plate_no: plateNo.value || undefined,
      start_date: queryRange.value[0],
      end_date: queryRange.value[1],
      time_mode: timeMode.value
    })
  }

  function handleDownloadAll() {
    downloadPhotos({
      plate_no: plateNo.value || undefined,
      start_date: queryRange.value[0],
      end_date: queryRange.value[1],
      time_mode: timeMode.value
    })
  }

  function handleDownloadRow(row: PhotoChecklistItem) {
    downloadPhotos(
      {
        start_date: queryRange.value[0],
        end_date: queryRange.value[1],
        time_mode: timeMode.value
      },
      row.plate_no
    )
  }

  onMounted(loadData)
</script>

<style lang="scss">
  @use './index';
</style>
