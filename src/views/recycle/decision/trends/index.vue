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
        <span class="trends-hint">当前接口仅支持按月近12个月数据</span>
      </div>

      <div class="trends-chart-card">
        <div class="trends-chart-head">
          <span class="trends-chart-title">收车量趋势</span>
          <div class="trends-chart-extra">
            <span class="trends-chart-dot" style="background: #1890ff" />
            <span>近12月 · 辆</span>
          </div>
        </div>
        <ArtLineChart
          height="220px"
          :data="purchaseTrend"
          :x-axis-data="monthLabels"
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
            <span>近12月 · 万</span>
          </div>
        </div>
        <ArtLineChart
          height="220px"
          :data="settlementTrend"
          :x-axis-data="monthLabels"
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
        </div>
        <div class="trends-empty">接口暂未提供</div>
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
  import { fetchDecisionStatistics } from '@/api/recycle/report'
  import type { DecisionStatistics } from '@/types/recycle/report'
  import ArtLineChart from '@/components/core/charts/art-line-chart/index.vue'

  defineOptions({ name: 'RecycleDecisionTrends' })

  type Grain = 'day' | 'week' | 'month'

  const GRAIN_OPTIONS: { key: Grain; label: string }[] = [
    { key: 'day', label: '日' },
    { key: 'week', label: '周' },
    { key: 'month', label: '月' }
  ]

  const router = useRouter()
  const loading = ref(false)
  const granularity = ref<Grain>('month')
  const stats = ref<DecisionStatistics | null>(null)

  const monthLabels = computed(() => {
    const labels: string[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      labels.push(`${d.getMonth() + 1}月`)
    }
    return labels
  })

  const purchaseTrend = computed(() =>
    (stats.value?.purchase_trend || []).map((n) => Number(n || 0))
  )
  const settlementTrend = computed(() =>
    (stats.value?.settlement_trend_data || []).map((n) => Number(n || 0))
  )

  const alerts = computed(() => {
    const s = stats.value
    if (!s) return []
    const list: { label: string; desc: string; level: 'warning' | 'error' }[] = []
    const overdue = Number(s.overdue_count || 0)
    if (overdue > 0) {
      list.push({
        label: '库存积压预警',
        desc: `当前在库车辆超过预警天数未处理：${overdue}辆`,
        level: 'warning'
      })
    }
    const pendingSettle = Number(s.pending_settlement_count || 0)
    if (pendingSettle > 0) {
      list.push({
        label: '待结算预警',
        desc: `待完成结算：${pendingSettle}条`,
        level: 'error'
      })
    }
    return list
  })

  function handleGrainChange(key: Grain) {
    if (key !== 'month') {
      ElMessage.info('暂仅支持按月查看')
      return
    }
    granularity.value = key
  }

  async function loadData() {
    loading.value = true
    try {
      stats.value = await fetchDecisionStatistics('month')
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
