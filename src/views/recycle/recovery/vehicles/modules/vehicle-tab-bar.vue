<template>
  <ElTabs :model-value="modelValue" class="vehicle-tabs" @update:model-value="handleTabChange">
    <ElTabPane v-for="item in tabItems" :key="item.tab" :name="item.tab">
      <template #label>
        <span class="vehicle-tab-label">
          <ArtSvgIcon :icon="item.icon" class="vehicle-tab-icon" />
          {{ item.label }}
          <span v-if="item.count > 0" class="vehicle-tab-badge">{{ item.count }}</span>
        </span>
      </template>
    </ElTabPane>
  </ElTabs>
</template>

<script setup lang="ts">
  import type { VehicleTab, VehicleTabCount } from '@/types/recycle/vehicle'
  import { VEHICLE_TAB_CONFIG } from '@/types/recycle/vehicle'

  interface Props {
    modelValue: VehicleTab
    counts?: VehicleTabCount[]
  }

  interface Emits {
    (e: 'update:modelValue', value: VehicleTab): void
    (e: 'change', value: VehicleTab): void
  }

  const props = withDefaults(defineProps<Props>(), {
    counts: () => []
  })

  const emit = defineEmits<Emits>()

  const tabItems = computed(() =>
    VEHICLE_TAB_CONFIG.map((cfg) => {
      const stat = props.counts.find((c) => c.tab === cfg.tab)
      return { ...cfg, count: stat?.count ?? 0 }
    })
  )

  function handleTabChange(tab: string | number) {
    const nextTab = tab as VehicleTab
    if (nextTab === props.modelValue) return
    emit('update:modelValue', nextTab)
    emit('change', nextTab)
  }
</script>

<style scoped lang="scss">
  .vehicle-tabs {
    padding-left: 16px !important;

    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid var(--art-card-border);
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.el-tabs__item) {
      height: 44px;
      padding: 0 20px;
      font-size: 14px;
      color: var(--art-gray-600);

      &.is-active {
        font-weight: 600;
        color: #1677ff;
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      background: #1677ff;
    }
  }

  .vehicle-tab-label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .vehicle-tab-icon {
    font-size: 16px;
  }

  .vehicle-tab-badge {
    min-width: 18px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    color: #fff;
    text-align: center;
    background: #1677ff;
    border-radius: 999px;
  }
</style>
