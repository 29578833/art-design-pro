<template>
  <ElRow :gutter="16">
    <ElCol :xs="24" :lg="12">
      <div class="erp-card">
        <div class="erp-card-header">
          <span class="erp-card-title">月度收车趋势</span>
          <span class="erp-card-extra">近12个月 · 辆</span>
        </div>
        <div class="erp-chart-reveal" :style="{ animationDelay: '0.1s' }">
          <ArtLineChart
            height="240px"
            :data="vehicleData"
            :x-axis-data="months"
            :show-area-color="true"
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
          <span class="erp-card-extra">近12个月 · 万元</span>
        </div>
        <div class="erp-chart-reveal" :style="{ animationDelay: '0.25s' }">
          <ArtLineChart
            height="240px"
            :data="settleData"
            :x-axis-data="months"
            :show-area-color="true"
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
  const months = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月'
  ]
  const vehicleData = [28, 32, 25, 40, 38, 45, 42, 50, 48, 55, 52, 60]
  const settleData = [84, 96, 75, 120, 114, 135, 126, 150, 144, 165, 156, 180]
</script>
<style lang="scss" scoped>
  @use '../dashboard';
</style>
