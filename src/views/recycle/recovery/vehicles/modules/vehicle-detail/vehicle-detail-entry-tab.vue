<template>
  <div class="vd-tab-panel">
    <div class="vd-panel-label">入厂拆解 · V20 五步流转</div>
    <div v-if="factorySteps.length" class="vd-v20-list">
      <div v-for="(step, idx) in factorySteps" :key="idx" class="vd-v20-card" :class="step.status">
        <div class="vd-v20-left">
          <div class="vd-v20-circle" :class="step.status">
            {{ step.status === 'done' ? '✓' : idx + 1 }}
          </div>
          <div class="vd-v20-text">
            <div class="vd-v20-title-row">
              <span class="vd-v20-title" :class="{ muted: step.status === 'pending' }">{{
                step.label
              }}</span>
              <span class="vd-v20-badge" :class="step.status">{{ step.badge }}</span>
            </div>
            <div v-if="step.desc" class="vd-v20-desc">{{ step.desc }}</div>
            <div v-if="step.time" class="vd-v20-time">{{ step.time }}</div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="vd-empty-panel">
      <ArtSvgIcon icon="ri:building-2-line" class="vd-empty-icon" />
      <p>暂无入厂拆解进度</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ScrapVehicleDetail } from '@/types/recycle/recovery/vehicles/vehicle'
  import { buildFactorySteps } from './vehicle-detail-utils'

  defineOptions({ name: 'VehicleDetailEntryTab' })

  const props = defineProps<{
    detail: ScrapVehicleDetail
  }>()

  const factorySteps = computed(() => buildFactorySteps(props.detail.factory_flow))
</script>

<style scoped lang="scss">
  @use './vehicle-detail-tab' as *;
</style>
