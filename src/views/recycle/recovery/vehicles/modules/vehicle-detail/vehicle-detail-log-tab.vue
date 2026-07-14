<template>
  <div class="vd-tab-panel">
    <div class="vd-panel-label">操作日志</div>
    <div v-if="logItems.length" class="vd-log-list">
      <div v-for="(item, idx) in logItems" :key="idx" class="vd-log-item">
        <div class="vd-log-rail">
          <div class="vd-log-dot" />
          <div v-if="idx < logItems.length - 1" class="vd-log-line" />
        </div>
        <div class="vd-log-content">
          <div class="vd-log-action">
            <span class="vd-log-title">{{ item.title }}</span>
            <span v-if="item.operator_name" class="vd-log-op">{{ item.operator_name }}</span>
          </div>
          <div v-if="item.time" class="vd-timeline-time">{{ item.time }}</div>
        </div>
      </div>
    </div>
    <div v-else class="vd-empty-panel">
      <ArtSvgIcon icon="ri:clipboard-line" class="vd-empty-icon" />
      <p>暂无操作日志</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ScrapVehicleDetail } from '@/types/recycle/vehicle'
  import { buildLogItems } from './vehicle-detail-utils'

  defineOptions({ name: 'VehicleDetailLogTab' })

  const props = defineProps<{
    detail: ScrapVehicleDetail
  }>()

  const logItems = computed(() => buildLogItems(props.detail))
</script>

<style scoped lang="scss">
  @use './vehicle-detail-tab' as *;
</style>
