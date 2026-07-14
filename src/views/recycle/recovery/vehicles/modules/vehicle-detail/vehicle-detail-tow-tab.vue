<template>
  <div class="vd-tab-panel">
    <div class="vd-panel-label">拖车进度记录</div>
    <div v-if="towSteps.length" class="vd-timeline">
      <div v-for="(step, idx) in towSteps" :key="idx" class="vd-timeline-item">
        <div class="vd-timeline-rail">
          <div class="vd-timeline-dot" :class="{ done: step.done }">
            <ArtSvgIcon v-if="step.done" icon="ri:check-line" class="vd-check-icon" />
          </div>
          <div
            v-if="idx < towSteps.length - 1"
            class="vd-timeline-line"
            :class="{ done: step.done }"
          />
        </div>
        <div class="vd-timeline-content">
          <div class="vd-timeline-label" :class="{ muted: !step.done }">{{ step.label }}</div>
          <div v-if="step.time && step.time !== '—'" class="vd-timeline-time">{{ step.time }}</div>
          <div v-if="step.note" class="vd-timeline-note">{{ step.note }}</div>
        </div>
      </div>
    </div>
    <div v-else class="vd-empty-panel">
      <ArtSvgIcon icon="ri:truck-line" class="vd-empty-icon" />
      <p>暂无拖车进度</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ScrapVehicleDetail } from '@/types/recycle/vehicle'
  import { mapFlowSteps } from './vehicle-detail-utils'

  defineOptions({ name: 'VehicleDetailTowTab' })

  const props = defineProps<{
    detail: ScrapVehicleDetail
  }>()

  const towSteps = computed(() => mapFlowSteps(props.detail.tow_progress))
</script>

<style scoped lang="scss">
  @use './vehicle-detail-tab' as *;
</style>
