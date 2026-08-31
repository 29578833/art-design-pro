<template>
  <div class="quality-page art-full-height">
    <div class="quality-page-header">
      <div>
        <div class="quality-page-title">质检管理</div>
        <div class="quality-page-desc">车辆入厂质检查验，记录缺件扣款，生成质检报告</div>
      </div>
      <div class="quality-header-actions">
        <ElButton :loading="reportExporting" @click="handleExportReport">
          <ArtSvgIcon icon="ri:download-line" class="quality-export-icon" />
          导出报告
        </ElButton>
        <ElButton type="primary" @click="byPlateVisible = true">
          <ArtSvgIcon icon="ri:add-line" class="quality-create-icon" />
          新建质检单
        </ElButton>
      </div>
    </div>

    <div class="quality-stats">
      <div v-for="item in statCards" :key="item.label" class="quality-stat-card">
        <div class="quality-stat-label">{{ item.label }}</div>
        <div class="quality-stat-value" :style="{ color: item.color }">{{ item.value }}</div>
      </div>
    </div>

    <QualityReportSearch
      v-model:active-tab="activeTab"
      v-model:queue-form="queueSearchForm"
      v-model:report-form="reportSearchForm"
      @tab-change="handleTabChange"
      @search="handleToolbarSearch"
      @reset="handleToolbarReset"
    />

    <QualityQueuePage
      v-if="activeTab === 'queue'"
      ref="queuePageRef"
      :search-form="queueSearchForm"
      @start-inspection="handleStartInspection"
      @view-report="handleViewReport"
    />
    <QualityReportPage
      v-if="activeTab === 'reports'"
      ref="reportPageRef"
      :search-form="reportSearchForm"
      @view-report="handleViewReport"
    />

    <QualityCreateDialog
      v-model:visible="createVisible"
      :queue-item="selectedQueueItem"
      @success="handleCreateSuccess"
    />

    <QualityCreateByPlateDialog v-model:visible="byPlateVisible" @created="handleByPlateCreated" />

    <QualityReportDialog v-model:visible="reportVisible" :check-id="reportCheckId" />
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import * as XLSX from 'xlsx'
  import { ElMessage } from 'element-plus'
  import { fetchQualityStats, fetchQualityReportList } from '@/api/recycle/quality'
  import type {
    QualityStats,
    QualityQueueItem,
    QualityTab,
    QualityQueueParams,
    QualitySearchParams,
    QcResult
  } from '@/types/recycle/factory/quality/quality'
  import QualityReportSearch from './modules/quality-report-search.vue'
  import QualityQueuePage from './modules/quality-queue-page.vue'
  import QualityReportPage from './modules/quality-report-page.vue'
  import QualityCreateDialog from './modules/quality-create-dialog.vue'
  import QualityCreateByPlateDialog from './modules/quality-create-by-plate-dialog.vue'
  import QualityReportDialog from './modules/quality-report-dialog.vue'

  defineOptions({ name: 'RecycleFactoryQuality' })

  const activeTab = ref<QualityTab>('queue')

  const queueSearchForm = ref<QualityQueueParams>({
    keyword: undefined,
    queue_status: undefined
  })

  const reportSearchForm = ref<QualitySearchParams>({
    keyword: undefined,
    result: undefined
  })

  const stats = ref<QualityStats>({
    pending: 0,
    overdue: 0,
    in_progress: 0,
    today_completed: 0,
    avg_hours: 0
  })

  const statCards = computed(() => [
    { label: '待查验', value: stats.value.pending, color: '#FA8C16' },
    { label: '超时待检', value: stats.value.overdue, color: '#FF4D4F' },
    { label: '质检中', value: stats.value.in_progress, color: '#1677ff' },
    { label: '今日完成', value: stats.value.today_completed, color: '#52C41A' },
    { label: '平均耗时(h)', value: stats.value.avg_hours, color: '#13C2C2' }
  ])

  const createVisible = ref(false)
  const byPlateVisible = ref(false)
  const selectedQueueItem = ref<QualityQueueItem | null>(null)
  const queuePageRef = ref<{
    refreshData?: () => void
    handleSearch?: (form?: QualityQueueParams) => void
    handleReset?: () => void
  } | null>(null)
  const reportPageRef = ref<{
    refreshData?: () => void
    handleSearch?: (form?: QualitySearchParams) => void
    handleReset?: () => void
  } | null>(null)

  const reportVisible = ref(false)
  const reportCheckId = ref(0)
  const reportExporting = ref(false)

  async function handleExportReport() {
    if (activeTab.value !== 'reports') {
      ElMessage.warning('请先切换到「质检报告」标签页后再导出')
      return
    }
    reportExporting.value = true
    try {
      const list = await fetchQualityReportList({
        keyword: reportSearchForm.value.keyword,
        result: reportSearchForm.value.result,
        page: 1,
        limit: 10000
      })
      const records = list.records || []
      if (!records.length) {
        ElMessage.warning('暂无数据可导出')
        return
      }
      const resultMap: Record<QcResult, string> = {
        0: '待查验',
        1: '合格',
        2: '不合格'
      }
      const rows = records.map((item) => ({
        质检编号: item.check_no || '',
        车牌号: item.plate_no || '',
        品牌车型: item.brand_model || '',
        车主: item.owner_name || '',
        质检员: item.inspector || '--',
        缺件项数: `${item.missing_count ?? 0}项`,
        缺件扣款: `¥${(item.missing_deduction ?? 0).toFixed(2)}`,
        质检时间: item.check_time || '',
        质检结果: resultMap[item.result] || '未知'
      }))
      const sheet = XLSX.utils.json_to_sheet(rows)
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, sheet, '质检报告')
      const filename = `质检报告_${new Date().getTime()}.xlsx`
      XLSX.writeFile(book, filename)
      ElMessage.success('导出成功')
    } finally {
      reportExporting.value = false
    }
  }

  async function loadStats() {
    try {
      stats.value = await fetchQualityStats()
    } catch {
      // 统计失败不阻断页面
    }
  }

  function handleTabChange(tab: QualityTab) {
    activeTab.value = tab
  }

  function handleToolbarSearch(form: QualityQueueParams | QualitySearchParams) {
    if (activeTab.value === 'queue') {
      const queueForm = form as QualityQueueParams
      queueSearchForm.value = queueForm
      queuePageRef.value?.handleSearch?.(queueForm)
      return
    }
    const reportForm = form as QualitySearchParams
    reportSearchForm.value = reportForm
    reportPageRef.value?.handleSearch?.(reportForm)
  }

  function handleToolbarReset() {
    if (activeTab.value === 'queue') {
      queueSearchForm.value = { keyword: undefined, queue_status: undefined }
      queuePageRef.value?.handleReset?.()
    } else {
      reportSearchForm.value = { keyword: undefined, result: undefined }
      reportPageRef.value?.handleReset?.()
    }
  }

  function handleStartInspection(item: QualityQueueItem) {
    selectedQueueItem.value = item
    createVisible.value = true
  }

  function handleByPlateCreated(item: QualityQueueItem) {
    selectedQueueItem.value = item
    createVisible.value = true
    loadStats()
    queuePageRef.value?.refreshData?.()
  }

  function handleViewReport(id: number) {
    reportCheckId.value = id
    reportVisible.value = true
  }

  function handleCreateSuccess() {
    createVisible.value = false
    selectedQueueItem.value = null
    // 队列与统计由 createVisible 的 watcher 统一刷新，这里只处理成功提交后才会变化的数据
    reportPageRef.value?.refreshData?.()
  }

  // 质检弹窗关闭（成功提交/取消/关闭）后重新请求下列表，保证队列状态及时更新
  watch(createVisible, (visible) => {
    if (!visible) {
      loadStats()
      queuePageRef.value?.refreshData?.()
    }
  })

  onMounted(() => {
    loadStats()
  })
</script>

<style lang="scss">
  @use './quality';
</style>
