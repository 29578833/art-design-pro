<template>
  <div class="decision-reports-page art-full-height">
    <div v-if="!activeReport" class="decision-header">
      <div>
        <div class="decision-title">数据决策中心</div>
        <div class="decision-desc">报表中心 · 趋势分析 · 经营决策</div>
      </div>
    </div>

    <!-- 报表列表 -->
    <div v-if="!activeReport" class="report-list">
      <div
        v-for="item in REPORT_CARDS"
        :key="item.key"
        class="report-card"
        :class="{ 'is-disabled': !item.available }"
        @click="openReport(item)"
      >
        <div class="report-card-left">
          <div
            class="report-card-icon"
            :style="{ background: `${item.color}15`, color: item.color }"
          >
            <ArtSvgIcon :icon="item.icon" />
          </div>
          <div>
            <div class="report-card-name">{{ item.label }}</div>
            <div class="report-card-desc">{{ item.desc }}</div>
          </div>
        </div>
        <div class="report-card-right">
          <ArtSvgIcon icon="ri:arrow-right-s-line" class="report-card-arrow" />
        </div>
      </div>
    </div>

    <!-- 报表详情 -->
    <div v-else class="report-detail">
      <div class="report-detail-bar">
        <button type="button" class="report-back" @click="activeReport = null">
          ← 返回报表列表
        </button>
        <span class="report-detail-sep">/</span>
        <span class="report-detail-title">{{ activeReportMeta?.label }}</span>
      </div>

      <ScrapSummaryPanel v-if="activeReport === 'vehicle-summary'" />
      <SalesPerfPanel v-else-if="activeReport === 'salesman-perf'" />
      <VehicleArchivePanel v-else-if="activeReport === 'vehicle-archive-summary'" />
      <QcSummaryPanel v-else-if="activeReport === 'qc-summary'" />
      <MaterialInoutPanel v-else-if="activeReport === 'raw-material-inout'" />
      <MaterialDailyPanel v-else-if="activeReport === 'raw-material'" />
      <div v-else class="report-empty">该报表暂未开放</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import type { ReportKey } from '@/types/recycle/decision/reports/report'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import ScrapSummaryPanel from './modules/panel-scrap-summary/index.vue'
  import SalesPerfPanel from './modules/panel-sale-perf/index.vue'
  import VehicleArchivePanel from './modules/panel-vehicle-archive/index.vue'
  import QcSummaryPanel from './modules/panel-qc-summary/index.vue'
  import MaterialInoutPanel from './modules/panel-material-inout/index.vue'
  import MaterialDailyPanel from './modules/panel-material-daily/index.vue'

  defineOptions({ name: 'RecycleDecisionReports' })

  const REPORT_CARDS: {
    key: ReportKey
    label: string
    desc: string
    icon: string
    color: string
    available: boolean
  }[] = [
    {
      key: 'vehicle-archive-summary',
      label: '车辆档案信息汇总表',
      desc: '报废汽车及轻摩摩托车档案汇总，含进度状态与注销办证流程',
      icon: 'ri:file-list-3-line',
      color: '#531DAB',
      available: true
    },
    {
      key: 'qc-summary',
      label: '报废车辆质检汇总表',
      desc: '质检单汇总，支持多维筛选与导出',
      icon: 'ri:search-eye-line',
      color: '#13C2C2',
      available: true
    },
    {
      key: 'raw-material-inout',
      label: '原料出入库清单',
      desc: '报废车辆（商用车、轻摩、私家车）出入库明细，多维筛选导出',
      icon: 'ri:folder-chart-line',
      color: '#08979C',
      available: true
    },
    {
      key: 'raw-material',
      label: '原料日报表',
      desc: '各车型原料初期库数、本日/本月入库出库及结存统计',
      icon: 'ri:archive-2-line',
      color: '#096DD9',
      available: true
    },
    {
      key: 'vehicle-summary',
      label: '收车汇总报表',
      desc: '按时间段统计收车数量、车辆类型分布',
      icon: 'ri:car-line',
      color: '#1890FF',
      available: true
    },
    {
      key: 'dismantle-output',
      label: '拆解产物统计',
      desc: '各类产物（回用件/废金属/危废）数量和重量',
      icon: 'ri:settings-3-line',
      color: '#722ED1',
      available: false
    },
    {
      key: 'settlement-summary',
      label: '结算汇总报表',
      desc: '按客户/时间段汇总结算金额和付款状态',
      icon: 'ri:money-cny-circle-line',
      color: '#52C41A',
      available: false
    },
    {
      key: 'salesman-perf',
      label: '业务员绩效报表',
      desc: '各业务员收车量、结算金额排行',
      icon: 'ri:user-star-line',
      color: '#FA8C16',
      available: true
    },
    {
      key: 'waste-stat',
      label: '废料管理报表',
      desc: '废铁/废铜/废铝等废料的重量和收益统计',
      icon: 'ri:recycle-line',
      color: '#13C2C2',
      available: false
    }
  ]

  const activeReport = ref<ReportKey | null>(null)

  const activeReportMeta = computed(() =>
    REPORT_CARDS.find((item) => item.key === activeReport.value)
  )

  function openReport(item: (typeof REPORT_CARDS)[number]) {
    if (!item.available) {
      ElMessage.info('该报表暂未开放')
      return
    }
    activeReport.value = item.key
  }
</script>

<style lang="scss">
  @use './reports';
</style>
