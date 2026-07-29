<template>
  <ElRow :gutter="16">
    <ElCol v-for="(item, index) in kpiList" :key="item.label" :xs="12" :sm="12" :md="6" :xl="6">
      <div class="erp-kpi-card">
        <div class="erp-kpi-left">
          <div class="erp-kpi-label">{{ item.label }}</div>
          <ArtCountTo
            class="erp-kpi-value"
            :target="item.num"
            :duration="1500"
            :prefix="item.prefix"
            :suffix="item.suffix"
            :decimals="item.decimals ?? 0"
          />
          <div class="erp-kpi-sub">
            <template v-if="item.subNum !== undefined">
              {{ item.subPrefix }}
              <ArtCountTo
                :target="item.subNum"
                :duration="1500"
                :suffix="item.subSuffix"
                class="erp-kpi-sub-num"
              />
            </template>
            <template v-else>{{ item.sub }}</template>
          </div>
          <span class="erp-kpi-trend" :class="item.up ? 'up' : 'down'">
            <ArtSvgIcon
              :icon="item.up ? 'ri:arrow-up-line' : 'ri:arrow-down-line'"
              class="text-xs"
            />
            <ArtCountTo
              v-if="item.trendNum !== undefined"
              :target="item.trendNum"
              :duration="1200"
              :decimals="item.trendDecimals ?? 0"
              :suffix="item.trendSuffix"
            />
            <template v-else>{{ item.trend }}</template>
          </span>
        </div>

        <div class="erp-kpi-right">
          <div class="erp-kpi-icon" :style="{ background: item.bg, color: item.color }">
            <ArtSvgIcon :icon="item.icon" class="text-lg" />
          </div>
          <div
            class="erp-chart-reveal erp-kpi-spark-wrap"
            :style="{ animationDelay: `${0.1 + index * 0.06}s`, animationDuration: '1s' }"
          >
            <svg viewBox="0 0 200 40" class="erp-kpi-spark" preserveAspectRatio="none">
              <polyline
                :points="getSparkLine(item.sparkData)"
                fill="none"
                :stroke="item.color"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import type { DashboardKpiItem } from '../use-dashboard-data'

  defineProps<{
    kpiList: DashboardKpiItem[]
  }>()

  const getSparkLine = (data: number[]) => {
    if (!data.length) return '0,20 200,20'
    const max = Math.max(...data, 1)
    const w = 200
    const h = 40
    const toY = (v: number) => h - (v / max) * (h - 8) - 4
    if (data.length === 1) {
      const y = toY(data[0])
      return `0,${y} 200,${y}`
    }
    return data.map((v, i) => `${(i / (data.length - 1)) * w},${toY(v)}`).join(' ')
  }
</script>

<style lang="scss" scoped>
  .erp-kpi-card {
    display: flex;
    gap: 12px;
    align-items: stretch;
    justify-content: space-between;
    min-height: 118px;
    padding: 16px 18px;
    margin-bottom: 16px;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
    transition:
      box-shadow 0.25s,
      transform 0.25s;
  }

  .erp-kpi-card:hover {
    box-shadow: 0 4px 16px rgb(0 0 0 / 6%);
    transform: translateY(-2px);
  }

  .erp-kpi-left {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .erp-kpi-right {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    align-items: flex-end;
    justify-content: space-between;
    width: 88px;
  }

  .erp-kpi-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }

  .erp-kpi-label {
    margin-bottom: 4px;
    font-size: 13px;
    color: var(--art-gray-600);
  }

  :deep(.erp-kpi-value) {
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--art-gray-900);
  }

  .erp-kpi-sub {
    margin-top: 4px;
    font-size: 12px;
    color: var(--art-gray-500);
  }

  :deep(.erp-kpi-sub-num) {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .erp-kpi-trend {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    padding-top: 8px;
    margin-top: auto;
    font-size: 12px;
    font-weight: 500;
  }

  .erp-kpi-trend.up {
    color: #52c41a;
  }

  .erp-kpi-trend.down {
    color: #ff4d4f;
  }

  .erp-kpi-spark-wrap {
    width: 100%;
  }

  .erp-kpi-spark {
    display: block;
    width: 100%;
    height: 36px;
  }
</style>

<style lang="scss" scoped>
  @use '../dashboard';
</style>
