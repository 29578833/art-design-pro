<template>
  <div v-loading="loading" class="vehicle-archive-panel">
    <!-- Tab + 筛选栏 -->
    <div class="va-toolbar">
      <div class="va-tabs">
        <button
          type="button"
          class="va-tab-btn"
          :class="{ 'is-active': activeType === 'car' }"
          @click="switchType('car')"
        >
          汽车（乘用车和商用车）
          <span class="va-tab-count">{{ tabs.car }}</span>
        </button>
        <button
          type="button"
          class="va-tab-btn"
          :class="{ 'is-active': activeType === 'moto' }"
          @click="switchType('moto')"
        >
          轻摩摩托车
          <span class="va-tab-count">{{ tabs.moto }}</span>
        </button>
      </div>

      <div class="va-filter-row">
        <ElDatePicker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :unlink-panels="true"
          class="va-date-picker"
        />

        <ElInput
          v-model="keyword"
          :placeholder="
            activeType === 'car'
              ? '搜索：业务员/代理人/电话/车牌/车架号/产权人/自编号'
              : '搜索：业务员/代理人/电话/车牌/车架号/产权人/自编号/品牌'
          "
          clearable
          class="va-search-input"
          @input="debouncedHandleSearch"
        >
          <template #prefix>
            <ArtSvgIcon icon="ri:search-line" class="va-search-icon" />
          </template>
        </ElInput>

        <ElSelect
          v-if="activeType === 'car'"
          v-model="progressStatus"
          placeholder="进度/状态"
          clearable
          class="va-progress-select"
        >
          <ElOption
            v-for="opt in PROGRESS_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>

        <ElButton type="text" @click="handleReset"> 重置 </ElButton>

        <div class="va-filter-actions">
          <ElButton :loading="exporting" @click="handleExport">
            <ArtSvgIcon icon="ri:download-line" class="mr-1" />
            导出Excel
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 报表区域 -->
    <div class="va-report-card">
      <div class="va-report-title">
        <div class="va-report-title-main">{{ reportTitle }}</div>
        <div class="va-report-title-sub">{{ queryRange[0] }} — {{ queryRange[1] }}</div>
      </div>

      <div class="va-table-wrap">
        <vxe-grid
          ref="gridRef"
          class="va-vxe-grid"
          v-bind="gridOptions"
          :data="list"
          :columns="gridColumns"
        >
          <!-- 汽车自编号 -->
          <template #self_no="{ row }">
            <span class="va-self-no is-car">{{ row.self_no || '—' }}</span>
          </template>
          <!-- 摩托车自编号 -->
          <template #self_no_moto="{ row }">
            <span class="va-self-no is-moto">{{ row.self_no || '—' }}</span>
          </template>
          <template #plate_no="{ row }">
            <span>{{ row.plate_no || '—' }}</span>
          </template>
          <template #vin="{ row }">
            <span class="va-vin">{{ row.vin || '—' }}</span>
          </template>
          <template #category="{ row }">
            <span
              class="va-badge"
              :class="row.category === '乘用车' ? 'is-passenger' : 'is-commercial'"
            >
              {{ row.category || '—' }}
            </span>
          </template>
          <template #supervision="{ row }">
            <span
              class="va-badge"
              :class="row.supervision === '监销' ? 'is-supervision' : 'is-normal-scrap'"
            >
              {{ row.supervision || '—' }}
            </span>
          </template>
          <template #abnormal="{ row }">
            <span class="va-badge" :class="row.abnormal === '正常' ? 'is-ok' : 'is-abnormal'">
              {{ row.abnormal || '—' }}
            </span>
          </template>
          <template #material_date="{ row }">
            <span v-if="row.material_date" class="va-flow-date">{{ row.material_date }}</span>
            <span v-else class="va-empty-cell">—</span>
          </template>
          <template #cert_date="{ row }">
            <span v-if="row.cert_date" class="va-cert-done">✓ {{ row.cert_date }}</span>
            <span v-else class="va-empty-cell">待完成</span>
          </template>

          <!-- 进度步骤（7 列共用模板） -->
          <template
            v-for="step in CAR_PROGRESS_STEPS"
            :key="step.field"
            #[`progress_${step.field}`]="{ row }"
          >
            <div class="va-progress-cell">
              <span
                class="va-progress-mark"
                :class="row.progress?.[step.field] ? 'is-done' : 'is-pending'"
              >
                {{ row.progress?.[step.field] ? '✓' : '—' }}
              </span>
              <span
                class="va-progress-sub"
                :class="row.progress?.[step.field] ? 'is-date' : 'is-wait'"
              >
                {{ row.progress?.[step.field] || '待完成' }}
              </span>
            </div>
          </template>

          <template #empty>
            <span class="va-empty-text">暂无数据</span>
          </template>
        </vxe-grid>
      </div>

      <!-- 分页 -->
      <div class="va-pagination">
        <span class="va-pagination-info">
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
  import type { VxeGridInstance } from 'vxe-table'
  import { ElMessage } from 'element-plus'
  import { fetchVehicleArchive } from '@/api/recycle/report'
  import type { VehicleArchiveResult } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { buildCarColumns, buildMotoColumns, CAR_PROGRESS_STEPS } from './grid-columns'
  import { useVehicleArchiveExport } from './grid-export'
  import { defaultReportDateRange } from '../../utils'

  const dateRange = ref<[string, string]>(defaultReportDateRange())
  const queryRange = ref<[string, string]>(defaultReportDateRange())

  const loading = ref(false)
  const gridRef = ref<VxeGridInstance | null>(null)
  const result = ref<VehicleArchiveResult | null>(null)
  const { exporting, exportReport, getVehicleArchiveReportTitle } = useVehicleArchiveExport()

  const list = computed(() => result.value?.list || [])
  const count = computed(() => result.value?.count || 0)
  const tabs = computed(() => result.value?.tabs || { car: 0, moto: 0 })
  const totalPages = computed(() => Math.max(1, Math.ceil(count.value / limit.value)))

  const keyword = ref('')
  const activeType = ref<'car' | 'moto'>('car')
  const progressStatus = ref('')
  const page = ref(1)
  const limit = ref(20)

  const PROGRESS_OPTIONS = CAR_PROGRESS_STEPS.map((s) => ({
    label: s.label,
    value: s.field
  }))

  const reportTitle = computed(() => getVehicleArchiveReportTitle(activeType.value))

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
    rowConfig: { isHover: true, height: 44 }
  }

  const gridColumns = computed(() =>
    activeType.value === 'car' ? buildCarColumns() : buildMotoColumns()
  )

  function switchType(type: 'car' | 'moto') {
    activeType.value = type
    progressStatus.value = ''
    keyword.value = ''
    page.value = 1
    loadData()
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

  const debouncedHandleSearch = useDebounceFn(handleSearch, 300)
  watch([dateRange, progressStatus], debouncedHandleSearch, { deep: true })

  function handleReset() {
    dateRange.value = defaultReportDateRange()
    queryRange.value = defaultReportDateRange()
    keyword.value = ''
    progressStatus.value = ''
    page.value = 1
    loadData()
  }

  function onPageSizeChange() {
    page.value = 1
    loadData()
  }

  async function loadData() {
    loading.value = true
    try {
      result.value = await fetchVehicleArchive({
        keyword: keyword.value || undefined,
        start_date: queryRange.value[0],
        end_date: queryRange.value[1],
        type: activeType.value,
        progress_status: progressStatus.value || undefined,
        page: page.value,
        limit: limit.value
      })
    } finally {
      loading.value = false
    }
  }

  /** 导出全部数据 */
  async function exportExcel() {
    await exportReport({
      type: activeType.value,
      startDate: queryRange.value[0],
      endDate: queryRange.value[1],
      keyword: keyword.value || undefined,
      progress_status: progressStatus.value || undefined
    })
  }

  function handleExport() {
    exportExcel()
  }

  onMounted(() => {
    loadData()
  })
</script>

<style lang="scss">
  @use './index';
</style>
