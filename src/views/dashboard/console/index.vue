<!-- ERP 数据看板 -->
<template>
  <div class="erp-dashboard">
    <!-- 页头 -->
    <div class="erp-dashboard-header erp-section">
      <div class="erp-dashboard-header-left">
        <h1 class="erp-dashboard-title">数据看板</h1>
        <p class="erp-dashboard-subtitle">鑫广汽车拆解管理系统 · 经营数据一览</p>
      </div>
      <ElSegmented v-model="period" :options="periodOptions" />
    </div>

    <!-- KPI 卡片 -->
    <ErpKpiCards :key="period" class="erp-section" />

    <!-- 趋势图表 -->
    <ErpTrendCharts :key="period" class="erp-section" />

    <!-- 分析面板：漏斗 + 状态分布 -->
    <ErpAnalysisPanels :key="period" class="erp-section" />

    <!-- 待办 + 排行 -->
    <ErpWorkPanels :key="period" class="erp-section" />

    <!-- 最近操作 -->
    <ErpRecentActivity />
  </div>
</template>

<script setup lang="ts">
  import ErpKpiCards from './modules/erp-kpi-cards.vue'
  import ErpTrendCharts from './modules/erp-trend-charts.vue'
  import ErpAnalysisPanels from './modules/erp-analysis-panels.vue'
  import ErpWorkPanels from './modules/erp-work-panels.vue'
  import ErpRecentActivity from './modules/erp-recent-activity.vue'

  defineOptions({ name: 'Console' })

  const period = ref('month')

  const periodOptions = [
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' }
  ]
</script>

<style lang="scss" scoped>
  @use './dashboard';

  .erp-dashboard {
    min-height: 100%;
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

  :deep(.el-segmented) {
    --el-border-radius-base: 8px;

    padding: 3px;
    background: var(--art-gray-100);
  }
</style>
