<!-- ERP 数据看板 -->
<template>
  <div v-loading="loading" class="erp-dashboard">
    <!-- 页头 -->
    <div class="erp-dashboard-header erp-section">
      <div class="erp-dashboard-header-left">
        <h1 class="erp-dashboard-title">数据看板</h1>
        <p class="erp-dashboard-subtitle">鑫广汽车拆解管理系统 · 经营数据一览</p>
      </div>
      <div class="erp-dashboard-period-group">
        <span class="erp-dashboard-period is-active">本月</span>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <ErpKpiCards :kpi-list="kpiList" class="erp-section" />

    <!-- 趋势图表 -->
    <ErpTrendCharts
      :purchase-trend="purchaseTrend"
      :settlement-trend="settlementTrend"
      :month-labels="monthLabels"
      class="erp-section"
    />

    <!-- 分析面板：漏斗 + 状态分布 -->
    <ErpAnalysisPanels
      :funnel-steps="funnelSteps"
      :funnel-max="funnelMax"
      :status-items="statusItems"
      :status-colors="statusColors"
      :status-total="statusTotal"
      class="erp-section"
    />

    <!-- 待办 + 排行 -->
    <ErpWorkPanels
      :todos="todos"
      :total-todos="totalTodos"
      :salesmen="salesmen"
      class="erp-section"
    />

    <!-- 最近操作 -->
    <ErpRecentActivity :activities="activities" />
  </div>
</template>

<script setup lang="ts">
  import ErpAnalysisPanels from './modules/erp-analysis-panels.vue'
  import ErpKpiCards from './modules/erp-kpi-cards.vue'
  import ErpRecentActivity from './modules/erp-recent-activity.vue'
  import ErpTrendCharts from './modules/erp-trend-charts.vue'
  import ErpWorkPanels from './modules/erp-work-panels.vue'
  import { useDashboardData } from './use-dashboard-data'

  defineOptions({ name: 'Console' })

  const {
    loading,
    kpiList,
    funnelSteps,
    funnelMax,
    statusItems,
    statusColors,
    statusTotal,
    todos,
    totalTodos,
    salesmen,
    activities,
    purchaseTrend,
    settlementTrend,
    monthLabels
  } = useDashboardData()
</script>

<style lang="scss" scoped>
  @use './dashboard';

  .erp-dashboard {
    min-height: 100%;
    padding-bottom: 16px;
  }

  .erp-dashboard-header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .erp-dashboard-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--art-gray-900);
  }

  .erp-dashboard-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--art-gray-500);
  }

  .erp-dashboard-period-group {
    padding: 3px;
    background: var(--art-gray-100);
    border-radius: 8px;
  }

  .erp-dashboard-period {
    display: inline-block;
    padding: 5px 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--art-gray-600);
    border-radius: 6px;
  }

  .erp-dashboard-period.is-active {
    color: var(--el-color-primary);
    background: var(--default-box-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
  }
</style>
