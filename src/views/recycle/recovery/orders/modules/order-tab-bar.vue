<template>
  <ElTabs :model-value="modelValue" class="order-tabs" @update:model-value="handleTabChange">
    <ElTabPane v-for="item in tabItems" :key="item.tab" :name="item.tab">
      <template #label>
        <span class="order-tab-label">
          <ArtSvgIcon :icon="item.icon" class="order-tab-icon" />
          {{ item.label }}
          <span v-if="item.count > 0" class="order-tab-badge">{{ item.count }}</span>
        </span>
      </template>
    </ElTabPane>
  </ElTabs>
</template>

<script setup lang="ts">
  import type { OrderTab, OrderTabCount } from '@/types/recycle/order'
  import { ORDER_TAB_CONFIG } from '@/types/recycle/order'

  interface Props {
    modelValue: OrderTab
    counts?: OrderTabCount[]
  }

  interface Emits {
    (e: 'update:modelValue', value: OrderTab): void
    (e: 'change', value: OrderTab): void
  }

  const props = withDefaults(defineProps<Props>(), {
    counts: () => []
  })

  const emit = defineEmits<Emits>()

  const tabItems = computed(() =>
    ORDER_TAB_CONFIG.map((cfg) => {
      const stat = props.counts.find((c) => c.tab === cfg.tab)
      return { ...cfg, count: stat?.count ?? 0 }
    })
  )

  function handleTabChange(tab: string | number) {
    const nextTab = tab as OrderTab
    if (nextTab === props.modelValue) return
    emit('update:modelValue', nextTab)
    emit('change', nextTab)
  }
</script>

<style scoped lang="scss">
  .order-tabs {
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

  .order-tab-label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .order-tab-icon {
    font-size: 16px;
  }

  .order-tab-badge {
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
