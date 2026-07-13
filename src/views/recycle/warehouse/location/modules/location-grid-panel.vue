<template>
  <div v-loading="loading" class="loc-grid-panel">
    <div class="loc-grid-panel-header">
      <span class="loc-grid-panel-title">库位分布图</span>
      <div class="loc-grid-legend">
        <span class="loc-grid-legend-item"> <i class="loc-grid-legend-box is-free" />可用 </span>
        <span class="loc-grid-legend-item">
          <i class="loc-grid-legend-box is-occupied" />已占用
        </span>
        <span class="loc-grid-legend-item">
          <i class="loc-grid-legend-box is-hazard" />危废专区
        </span>
      </div>
    </div>

    <div v-if="!loading && !gridAreas.length" class="loc-grid-empty">暂无库位数据</div>
    <div v-else class="loc-grid-map">
      <div v-for="(areaItem, areaIndex) in gridAreas" :key="areaItem.area" class="loc-grid-area">
        <div class="loc-grid-area-header" :style="getAreaHeaderStyle(areaItem.area, areaIndex)">
          {{ areaItem.area }}
          <span class="loc-grid-area-count">
            {{ getOccupiedCount(areaItem) }}/{{ areaItem.slots?.length || 0 }} 已用
          </span>
        </div>
        <div class="loc-grid-slots">
          <ElTooltip
            v-for="slot in areaItem.slots"
            :key="slot.id"
            :content="getSlotTooltip(slot)"
            placement="top"
          >
            <div class="loc-grid-slot" :style="getSlotStyle(areaItem.area, slot)">
              {{ getSlotLabel(slot) }}
            </div>
          </ElTooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { fetchWarehouseLocationGrid } from '@/api/recycle/warehouse'
  import type {
    WarehouseLocationGridArea,
    WarehouseLocationGridSlot
  } from '@/types/recycle/warehouse'

  const AREA_COLORS = ['#1677ff', '#52C41A', '#FF4D4F', '#8C8C8C', '#722ED1', '#FA8C16']

  const loading = ref(false)
  const gridAreas = ref<WarehouseLocationGridArea[]>([])

  function isHazardArea(area: string) {
    return /危废|危险|hazard/i.test(area)
  }

  function getAreaColor(area: string, index: number) {
    if (isHazardArea(area)) return '#FF4D4F'
    return AREA_COLORS[index % AREA_COLORS.length]
  }

  function getAreaHeaderStyle(area: string, index: number) {
    const color = getAreaColor(area, index)
    return { color, background: `${color}14` }
  }

  function getOccupiedCount(area: WarehouseLocationGridArea) {
    return (area.slots || []).filter((s) => s.status === 1).length
  }

  function getSlotStyle(area: string, slot: WarehouseLocationGridSlot) {
    const occupied = slot.status === 1
    const hazard = isHazardArea(area)
    if (hazard) {
      return { background: '#FFF1F0', color: '#FF4D4F', borderColor: '#FFA39E' }
    }
    if (occupied) {
      return { background: '#E6F7FF', color: '#1677ff', borderColor: '#91CAFF' }
    }
    return { background: '#F6FFED', color: '#52C41A', borderColor: '#B7EB8F' }
  }

  function getSlotLabel(slot: WarehouseLocationGridSlot) {
    if (slot.location_no) {
      const parts = slot.location_no.split('-')
      return parts[parts.length - 1] || slot.location_no
    }
    return slot.shelf || '—'
  }

  function getSlotTooltip(slot: WarehouseLocationGridSlot) {
    const no = slot.location_no || '—'
    const status = slot.status === 1 ? '已占用' : '可用'
    const count = slot.vehicle_count ?? 0
    const capacity = slot.max_capacity ?? 1
    return `${no} · ${status} · ${count}/${capacity}`
  }

  async function loadGrid() {
    loading.value = true
    try {
      gridAreas.value = (await fetchWarehouseLocationGrid()) || []
    } catch {
      gridAreas.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    loadGrid()
  })

  defineExpose({ reload: loadGrid })
</script>
