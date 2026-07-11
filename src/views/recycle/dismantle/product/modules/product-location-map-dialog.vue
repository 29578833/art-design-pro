<template>
  <ElDialog
    v-model="dialogVisible"
    title="库位分布图"
    width="720px"
    class="product-location-map-dialog"
    destroy-on-close
    @open="loadGrid"
  >
    <div class="product-location-map-desc">绿色=可用 · 灰色=已占用 · 红色=危废专区</div>

    <div v-loading="loading" class="product-location-map-body">
      <div v-if="!loading && !gridAreas.length" class="product-location-map-empty"
        >暂无库位数据</div
      >
      <div v-else class="product-location-map-grid">
        <div
          v-for="(areaItem, areaIndex) in gridAreas"
          :key="areaItem.area"
          class="product-location-area"
        >
          <div
            class="product-location-area-header"
            :style="getAreaHeaderStyle(areaItem.area, areaIndex)"
          >
            {{ areaItem.area }}
          </div>
          <div class="product-location-slots">
            <ElTooltip
              v-for="slot in areaItem.slots"
              :key="slot.id"
              :content="getSlotTooltip(slot)"
              placement="top"
            >
              <div class="product-location-slot" :style="getSlotStyle(areaItem.area, slot)">
                {{ getSlotLabel(slot) }}
              </div>
            </ElTooltip>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchWarehouseLocationGrid } from '@/api/recycle/warehouse'
  import type {
    WarehouseLocationGridArea,
    WarehouseLocationGridSlot
  } from '@/types/recycle/warehouse'

  interface Props {
    visible: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const AREA_COLORS = ['#1677ff', '#52C41A', '#FF4D4F', '#8C8C8C', '#722ED1', '#FA8C16']

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

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

  function getSlotStyle(area: string, slot: WarehouseLocationGridSlot) {
    const occupied = slot.status === 1
    const hazard = isHazardArea(area)
    if (hazard) {
      return {
        background: '#FFF1F0',
        color: '#FF4D4F',
        borderColor: '#FFA39E'
      }
    }
    if (occupied) {
      return {
        background: '#F0F0F0',
        color: '#8C8C8C',
        borderColor: '#D9D9D9'
      }
    }
    return {
      background: '#F6FFED',
      color: '#52C41A',
      borderColor: '#B7EB8F'
    }
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
</script>
