<template>
  <div class="product-stats-panel">
    <div class="product-stats-card">
      <div class="product-stats-card-title">产物分类分布</div>
      <div class="product-donut-wrap">
        <svg viewBox="0 0 120 120" class="product-donut-svg w-200px h-200px">
          <path v-for="(seg, index) in donutPaths" :key="index" :d="seg.d" :fill="seg.color" />
          <text x="60" y="55" text-anchor="middle" class="product-donut-total">
            {{ totalCount }}
          </text>
          <text x="60" y="70" text-anchor="middle" class="product-donut-unit">件/批</text>
        </svg>
        <div class="product-donut-legend">
          <div v-for="seg in categorySegments" :key="seg.label" class="product-donut-legend-item">
            <span class="product-donut-dot" :style="{ background: seg.color }" />
            <span class="product-donut-label">{{ seg.label }}</span>
            <span class="product-donut-value">{{ seg.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="product-stats-card">
      <div class="product-stats-card-title">废金属分类</div>
      <div v-if="metalItems.length" class="product-metal-list">
        <div v-for="item in metalItems" :key="item.name" class="product-metal-item">
          <div class="product-metal-row">
            <span class="product-metal-name">{{ item.name }}</span>
            <span class="product-metal-weight">{{ formatMetalWeight(item.weight) }}</span>
          </div>
          <div class="product-metal-bar-track">
            <div
              class="product-metal-bar-fill"
              :style="{ width: `${item.percent}%`, background: item.color }"
            />
          </div>
        </div>
      </div>
      <div v-else class="product-stats-empty">暂无废金属数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ProductStoreStats } from '@/types/recycle/product-store'
  import {
    PRODUCT_STORE_CATEGORY_CONFIG,
    type ProductStoreCategory
  } from '@/types/recycle/product-store'

  interface Props {
    stats: ProductStoreStats
  }

  const props = defineProps<Props>()

  const METAL_COLORS = ['#8C8C8C', '#1677ff', '#FA8C16', '#52C41A', '#722ED1']

  const categorySegments = computed(() => {
    const dist = props.stats.category_distribution
    return (['reusable', 'metal', 'hazardous', 'general'] as ProductStoreCategory[]).map((cat) => ({
      label: PRODUCT_STORE_CATEGORY_CONFIG[cat].label,
      value: dist?.[cat] ?? 0,
      color: PRODUCT_STORE_CATEGORY_CONFIG[cat].color
    }))
  })

  const totalCount = computed(() =>
    categorySegments.value.reduce((sum, item) => sum + item.value, 0)
  )

  const donutPaths = computed(() => {
    const total = totalCount.value || 1
    const R = 45
    const r = 28
    const cx = 60
    const cy = 60
    let cum = -90

    const toXY = (angle: number, radius: number) => ({
      x: cx + radius * Math.cos((angle * Math.PI) / 180),
      y: cy + radius * Math.sin((angle * Math.PI) / 180)
    })

    return categorySegments.value
      .map((seg) => {
        if (seg.value <= 0) return null
        const angle = (seg.value / total) * 360
        const start = cum
        cum += angle
        const end = cum
        const large = angle > 180 ? 1 : 0
        const s1 = toXY(start, R)
        const e1 = toXY(end, R)
        const s2 = toXY(end, r)
        const e2 = toXY(start, r)
        return {
          color: seg.color,
          d: `M${s1.x},${s1.y} A${R},${R} 0 ${large},1 ${e1.x},${e1.y} L${s2.x},${s2.y} A${r},${r} 0 ${large},0 ${e2.x},${e2.y} Z`
        }
      })
      .filter(Boolean) as { color: string; d: string }[]
  })

  const metalItems = computed(() => {
    const list = props.stats.metal_subcategories || []
    const maxWeight = Math.max(...list.map((item) => item.weight), 0)
    return list.map((item, index) => ({
      ...item,
      color: METAL_COLORS[index % METAL_COLORS.length],
      percent: maxWeight > 0 ? Math.round((item.weight / maxWeight) * 100) : 0
    }))
  })

  function formatMetalWeight(weight: number) {
    if (weight >= 1000) return `${(weight / 1000).toFixed(2)} 吨`
    return `${weight} kg`
  }
</script>
