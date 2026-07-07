<template>
  <ElRow :gutter="16">
    <!-- 业务漏斗 -->
    <ElCol :xs="24" :lg="12">
      <div class="erp-card" style="margin-bottom: 16px">
        <div class="erp-card-header">
          <span class="erp-card-title">业务漏斗</span>
          <span class="erp-card-extra">本月转化</span>
        </div>
        <div class="erp-funnel">
          <div v-for="(step, i) in funnelSteps" :key="step.label" class="erp-funnel-item">
            <div class="erp-funnel-row">
              <span class="erp-funnel-index">{{ i + 1 }}</span>
              <span class="erp-funnel-label">{{ step.label }}</span>
              <span class="erp-funnel-value">
                <ArtCountTo :target="step.value" :duration="1500" />
              </span>
              <span class="erp-funnel-pct">{{ Math.round((step.value / funnelMax) * 100) }}%</span>
            </div>
            <div class="erp-funnel-track">
              <div
                class="erp-funnel-bar erp-bar-fill"
                :class="{ 'is-active': barReady }"
                :style="{
                  width: `${Math.max(8, (step.value / funnelMax) * 100)}%`,
                  background: step.color,
                  animationDelay: `${0.2 + i * 0.12}s`
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </ElCol>

    <!-- 车辆状态分布 -->
    <ElCol :xs="24" :lg="12">
      <div class="erp-card" style="margin-bottom: 16px">
        <div class="erp-card-header">
          <span class="erp-card-title">车辆状态分布</span>
          <span class="erp-card-extra">
            在库
            <ArtCountTo
              :target="vehicleTotal"
              :duration="1500"
              suffix=" 辆"
              class="erp-inline-count"
            />
          </span>
        </div>
        <div class="erp-status-layout">
          <div class="erp-status-chart-wrap erp-chart-reveal" :style="{ animationDelay: '0.15s' }">
            <ArtRingChart
              height="200px"
              :data="vehicleStatusData"
              :colors="vehicleStatusColors"
              :radius="['50%', '70%']"
              :show-legend="false"
            />
            <div class="erp-status-center">
              <ArtCountTo class="erp-status-center-num" :target="vehicleTotal" :duration="1500" />
              <span class="erp-status-center-label">在库总量</span>
            </div>
          </div>
          <div class="erp-status-legend">
            <div
              v-for="(item, i) in vehicleStatusData"
              :key="item.name"
              class="erp-status-legend-item"
            >
              <span class="erp-status-dot" :style="{ background: vehicleStatusColors[i] }" />
              <span class="erp-status-name">{{ item.name }}</span>
              <span class="erp-status-count">
                <ArtCountTo :target="item.value" :duration="1500" />
              </span>
              <span class="erp-status-pct"
                >{{ Math.round((item.value / vehicleTotal) * 100) }}%</span
              >
            </div>
          </div>
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  const barReady = ref(false)

  onMounted(() => {
    requestAnimationFrame(() => {
      barReady.value = true
    })
  })

  const funnelSteps = [
    { label: '收车', value: 368, color: '#1890FF' },
    { label: '质检完成', value: 342, color: '#722ED1' },
    { label: '拆解完成', value: 318, color: '#FA8C16' },
    { label: '注销完成', value: 295, color: '#52C41A' },
    { label: '结算完成', value: 270, color: '#13C2C2' }
  ]

  const funnelMax = funnelSteps[0].value

  const vehicleStatusData = [
    { name: '拖车中', value: 8 },
    { name: '入厂待查', value: 12 },
    { name: '拆解中', value: 15 },
    { name: '注销中', value: 6 },
    { name: '已完成', value: 6 }
  ]

  const vehicleStatusColors = ['#13C2C2', '#FA8C16', '#722ED1', '#1890FF', '#52C41A']
  const vehicleTotal = vehicleStatusData.reduce((sum, item) => sum + item.value, 0)
</script>

<style lang="scss" scoped>
  @use '../dashboard';

  .erp-funnel {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .erp-funnel-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 6px;
  }

  .erp-funnel-index {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 11px;
    font-weight: 600;
    color: var(--art-gray-600);
    background: var(--art-gray-100);
    border-radius: 6px;
  }

  .erp-funnel-label {
    flex: 1;
    font-size: 13px;
    color: var(--art-gray-700);
  }

  .erp-funnel-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .erp-funnel-pct {
    width: 36px;
    font-size: 12px;
    color: var(--art-gray-500);
    text-align: right;
  }

  .erp-funnel-track {
    height: 8px;
    overflow: hidden;
    background: var(--art-gray-100);
    border-radius: 4px;
  }

  .erp-funnel-bar {
    height: 100%;
    border-radius: 4px;
  }

  .erp-status-layout {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .erp-status-layout > .erp-status-chart-wrap {
    flex: 0 0 200px;
  }

  .erp-status-chart-wrap {
    position: relative;
    width: 200px;
    height: 200px;
  }

  .erp-status-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  :deep(.erp-status-center-num) {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--art-gray-900);
  }

  .erp-status-center-label {
    margin-top: 2px;
    font-size: 11px;
    color: var(--art-gray-500);
  }

  :deep(.erp-inline-count) {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .erp-status-legend {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 12px;
  }

  .erp-status-legend-item {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 13px;
  }

  .erp-status-dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .erp-status-name {
    flex: 1;
    color: var(--art-gray-700);
  }

  .erp-status-count {
    width: 28px;
    font-weight: 600;
    color: var(--art-gray-900);
    text-align: right;
  }

  .erp-status-pct {
    width: 36px;
    font-size: 12px;
    color: var(--art-gray-500);
    text-align: right;
  }

  @media (width <= 768px) {
    .erp-status-layout {
      flex-direction: column;
    }

    .erp-status-layout > .erp-status-chart-wrap {
      flex: none;
      width: 100%;
    }
  }
</style>
