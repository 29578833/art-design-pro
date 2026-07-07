<template>
  <ElRow :gutter="16">
    <ElCol v-for="(item, index) in kpiList" :key="item.label" :xs="12" :sm="12" :md="6" :xl="6">
      <div class="erp-kpi-card">
        <div class="erp-kpi-top">
          <div class="erp-kpi-icon" :style="{ background: item.bg, color: item.color }">
            <ArtSvgIcon :icon="item.icon" class="text-lg" />
          </div>
          <div class="erp-kpi-meta">
            <div class="erp-kpi-label">{{ item.label }}</div>
            <ArtCountTo
              class="erp-kpi-value"
              :target="item.num"
              :duration="1500"
              :prefix="item.prefix"
              :suffix="item.suffix"
              :decimals="item.decimals ?? 0"
            />
          </div>
        </div>
        <div class="erp-kpi-bottom">
          <span class="erp-kpi-sub">
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
          </span>
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
        <div
          class="erp-chart-reveal"
          :style="{ animationDelay: `${0.1 + index * 0.06}s`, animationDuration: '1s' }"
        >
          <svg viewBox="0 0 200 40" class="erp-kpi-spark" preserveAspectRatio="none">
            <defs>
              <linearGradient :id="`grad-${item.label}`" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="item.color" stop-opacity="0.2" />
                <stop offset="100%" :stop-color="item.color" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon :points="getSparkArea(item.sparkData)" :fill="`url(#grad-${item.label})`" />
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
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  interface KpiItem {
    label: string
    num: number
    prefix?: string
    suffix?: string
    decimals?: number
    sub?: string
    subPrefix?: string
    subNum?: number
    subSuffix?: string
    trend?: string
    trendNum?: number
    trendSuffix?: string
    trendDecimals?: number
    up: boolean
    icon: string
    color: string
    bg: string
    sparkData: number[]
  }

  const kpiList: KpiItem[] = [
    {
      label: '今日收车',
      num: 8,
      suffix: '辆',
      subPrefix: '本月共 ',
      subNum: 368,
      subSuffix: '辆',
      trendNum: 12.5,
      trendSuffix: '%',
      trendDecimals: 1,
      up: true,
      icon: 'ri:car-line',
      color: '#1890FF',
      bg: '#E6F7FF',
      sparkData: [3, 5, 4, 7, 6, 8, 8]
    },
    {
      label: '本月收车',
      num: 368,
      suffix: '辆',
      subPrefix: '上月 ',
      subNum: 328,
      subSuffix: '辆',
      trendNum: 12.2,
      trendSuffix: '%',
      trendDecimals: 1,
      up: true,
      icon: 'ri:line-chart-line',
      color: '#52C41A',
      bg: '#F6FFED',
      sparkData: [280, 300, 290, 320, 315, 340, 368]
    },
    {
      label: '在库车辆',
      num: 47,
      suffix: '辆',
      subPrefix: '超30天 ',
      subNum: 3,
      subSuffix: '辆',
      trendNum: 5,
      trendSuffix: '辆',
      up: false,
      icon: 'ri:archive-line',
      color: '#722ED1',
      bg: '#F9F0FF',
      sparkData: [52, 55, 50, 49, 51, 48, 47]
    },
    {
      label: '待拆解',
      num: 12,
      suffix: '辆',
      subPrefix: '今日完成 ',
      subNum: 4,
      subSuffix: '辆',
      trendNum: 3,
      trendSuffix: '辆',
      up: true,
      icon: 'ri:tools-line',
      color: '#FA8C16',
      bg: '#FFF7E6',
      sparkData: [15, 14, 16, 13, 15, 12, 12]
    },
    {
      label: '今日拆解',
      num: 4,
      suffix: '辆',
      subPrefix: '本月已拆 ',
      subNum: 96,
      subSuffix: '辆',
      trendNum: 1,
      trendSuffix: '辆',
      up: true,
      icon: 'ri:checkbox-circle-line',
      color: '#13C2C2',
      bg: '#E6FFFB',
      sparkData: [3, 4, 3, 5, 4, 4, 4]
    },
    {
      label: '本月结算',
      num: 180,
      prefix: '¥',
      suffix: '万',
      subPrefix: '共 ',
      subNum: 52,
      subSuffix: ' 笔',
      trendNum: 15.4,
      trendSuffix: '%',
      trendDecimals: 1,
      up: true,
      icon: 'ri:money-cny-circle-line',
      color: '#52C41A',
      bg: '#F6FFED',
      sparkData: [120, 135, 125, 150, 145, 165, 180]
    },
    {
      label: '待结算',
      num: 18,
      suffix: '辆',
      sub: '约 ¥14.4万',
      trendNum: 2,
      trendSuffix: '辆',
      up: false,
      icon: 'ri:time-line',
      color: '#FF7A00',
      bg: '#FFF2E8',
      sparkData: [12, 14, 15, 16, 17, 17, 18]
    },
    {
      label: '商务部待受理',
      num: 5,
      suffix: '件',
      subPrefix: '本月已受理 ',
      subNum: 43,
      subSuffix: '件',
      trendNum: 2,
      trendSuffix: '件',
      up: true,
      icon: 'ri:file-text-line',
      color: '#1890FF',
      bg: '#E6F7FF',
      sparkData: [8, 7, 6, 7, 5, 6, 5]
    }
  ]

  const getSparkLine = (data: number[]) => {
    const max = Math.max(...data, 1)
    const w = 200
    const h = 40
    return data
      .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`)
      .join(' ')
  }

  const getSparkArea = (data: number[]) => {
    const line = getSparkLine(data)
    return `0,40 ${line} 200,40`
  }
</script>

<style lang="scss" scoped>
  .erp-kpi-card {
    position: relative;
    padding: 18px 18px 12px;
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

  .erp-kpi-top {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .erp-kpi-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
  }

  .erp-kpi-label {
    margin-bottom: 2px;
    font-size: 13px;
    color: var(--art-gray-600);
  }

  :deep(.erp-kpi-value) {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--art-gray-900);
  }

  .erp-kpi-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .erp-kpi-sub {
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
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 10px;
  }

  .erp-kpi-trend.up {
    color: #52c41a;
    background: #f6ffed;
  }

  .erp-kpi-trend.down {
    color: #ff4d4f;
    background: #fff1f0;
  }

  .erp-kpi-spark {
    display: block;
    width: 100%;
    height: 40px;
    margin-top: 4px;
  }
</style>

<style lang="scss" scoped>
  @use '../dashboard';
</style>
