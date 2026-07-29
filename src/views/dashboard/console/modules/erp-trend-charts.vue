<template>
  <ElRow :gutter="16">
    <ElCol :xs="24" :lg="12">
      <div class="erp-card">
        <div class="erp-card-header">
          <span class="erp-card-title">月度收车趋势</span>
          <span class="erp-card-extra">当年 · 辆</span>
        </div>
        <div class="erp-chart-reveal" :style="{ animationDelay: '0.1s' }">
          <ArtLineChart
            height="240px"
            :data="purchaseTrend"
            :x-axis-data="monthLabels"
            :show-area-color="false"
            :colors="['#1890FF']"
            symbol="circle"
            :symbol-size="6"
            :smooth="true"
            :enable-animation="false"
          />
        </div>
      </div>
    </ElCol>
    <ElCol :xs="24" :lg="12">
      <div class="erp-card" style="margin-bottom: 16px">
        <div class="erp-card-header">
          <span class="erp-card-title">月度结算金额</span>
          <span class="erp-card-extra">当年 · 万元</span>
        </div>
        <div class="erp-chart-reveal" :style="{ animationDelay: '0.25s' }">
          <ArtLineChart
            height="240px"
            :data="settlementTrend"
            :x-axis-data="monthLabels"
            :show-area-color="false"
            :colors="['#52C41A']"
            symbol="circle"
            :symbol-size="6"
            :smooth="true"
            :enable-animation="false"
          />
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  defineProps<{
    purchaseTrend: number[]
    settlementTrend: number[]
    monthLabels: string[]
  }>()
</script>
<style lang="scss" scoped>
  @use '../dashboard';
</style>
