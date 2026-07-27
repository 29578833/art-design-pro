<template>
  <div class="decision-trends-page art-full-height">
    <div class="decision-header">
      <div>
        <div class="decision-title">数据决策中心</div>
        <div class="decision-desc">报表中心 · 趋势分析 · 经营决策</div>
      </div>
      <div class="decision-nav">
        <button type="button" class="decision-nav-btn" @click="goReports">报表中心</button>
        <button type="button" class="decision-nav-btn is-active">趋势分析</button>
      </div>
    </div>

    <div v-loading="loading" class="trends-body">
      <div class="trends-toolbar">
        <span class="trends-toolbar-label">时间粒度：</span>
        <button
          v-for="item in GRAIN_OPTIONS"
          :key="item.key"
          type="button"
          class="trends-grain"
          :class="{ 'is-active': granularity === item.key }"
          @click="handleGrainChange(item.key)"
        >
          {{ item.label }}
        </button>
        <span class="trends-hint">{{ grainHint }}</span>
      </div>

      <div class="trends-chart-card">
        <div class="trends-chart-head">
          <span class="trends-chart-title">收车量趋势</span>
          <div class="trends-chart-extra">
            <span class="trends-chart-dot" style="background: #1890ff" />
            <span>{{ grainUnitLabel }} · 辆</span>
          </div>
        </div>
        <ArtLineChart
          height="220px"
          :data="vehicleTrend"
          :x-axis-data="chartLabels"
          :show-area-color="true"
          :colors="['#1890FF']"
          symbol="circle"
          :symbol-size="6"
          :smooth="true"
          :enable-animation="false"
        />
      </div>

      <div class="trends-chart-card">
        <div class="trends-chart-head">
          <span class="trends-chart-title">结算金额趋势（万元）</span>
          <div class="trends-chart-extra">
            <span class="trends-chart-dot" style="background: #52c41a" />
            <span>{{ grainUnitLabel }} · 万</span>
          </div>
        </div>
        <ArtLineChart
          height="220px"
          :data="settlementTrend"
          :x-axis-data="chartLabels"
          :show-area-color="true"
          :colors="['#52C41A']"
          symbol="circle"
          :symbol-size="6"
          :smooth="true"
          :enable-animation="false"
        />
      </div>

      <div class="trends-chart-card">
        <div class="trends-chart-head">
          <span class="trends-chart-title">产物入库趋势（吨）</span>
          <div class="trends-chart-extra">
            <span class="trends-chart-dot" style="background: #722ed1" />
            <span>{{ grainUnitLabel }} · 吨</span>
          </div>
        </div>
        <ArtLineChart
          height="220px"
          :data="productTrend"
          :x-axis-data="chartLabels"
          :show-area-color="true"
          :colors="['#722ED1']"
          symbol="circle"
          :symbol-size="6"
          :smooth="true"
          :enable-animation="false"
        />
      </div>

      <div v-if="alerts.length" class="trends-alerts">
        <div class="trends-alerts-title">预警指标</div>
        <div class="trends-alert-list">
          <div
            v-for="item in alerts"
            :key="item.label"
            class="trends-alert-item"
            :class="{ 'is-error': item.level === 'error' }"
          >
            <span class="trends-alert-dot" />
            <div>
              <div class="trends-alert-label">{{ item.label }}</div>
              <div class="trends-alert-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { fetchReportTrend } from '@/api/recycle/report'
  import type { ReportTrendResult } from '@/types/recycle/decision/reports/report'
  import ArtLineChart from '@/components/core/charts/art-line-chart/index.vue'

  defineOptions({ name: 'RecycleDecisionTrends' })

  type Grain = 'day' | 'week' | 'month'

  const GRAIN_OPTIONS: { key: Grain; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' }
  ]

  const GRAIN_HINT: Record<Grain, string> = {
    day: '默认展示近30天数据',
    week: '默认展示近12周数据',
    month: '默认展示近12个月数据'
  }

  const GRAIN_UNIT: Record<Grain, string> = {
    day: '近30天',
    week: '近12周',
    month: '近12月'
  }

  const router = useRouter()
  const loading = ref(false)
  const granularity = ref<Grain>('month')
  const trendData = ref<ReportTrendResult | null>(null)

  const grainHint = computed(() => GRAIN_HINT[granularity.value])
  const grainUnitLabel = computed(() => GRAIN_UNIT[granularity.value])
  const chartLabels = computed(() => trendData.value?.labels || [])

  const vehicleTrend = computed(() =>
    (trendData.value?.vehicle_data || []).map((n) => Number(n || 0))
  )
  const settlementTrend = computed(() =>
    (trendData.value?.settlement_data || []).map((n) => Number(n || 0))
  )
  const productTrend = computed(() =>
    (trendData.value?.product_data || []).map((n) => Number(n || 0))
  )

  const alerts = computed(() =>
    (trendData.value?.warnings || []).map((item) => ({
      label: item.label,
      desc: item.desc,
      level: item.type === 'danger' ? ('error' as const) : ('warning' as const)
    }))
  )

  function handleGrainChange(key: Grain) {
    if (granularity.value === key) return
    granularity.value = key
    loadData()
  }

  async function loadData() {
    loading.value = true
    try {
      trendData.value = await fetchReportTrend({ time_granularity: granularity.value })
    } catch {
      trendData.value = null
      ElMessage.error('加载趋势数据失败')
    } finally {
      loading.value = false
    }
  }

  function goReports() {
    router.push('/recycle/decision/reports')
  }

  onMounted(loadData)
</script>

<style lang="scss">
  @use './trends';
</style>
