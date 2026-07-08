<template>
  <div class="order-tab-bar">
    <div
      v-for="item in tabItems"
      :key="item.tab"
      class="order-tab-item"
      :class="{ active: modelValue === item.tab }"
      @click="handleSelect(item.tab)"
    >
      <ArtSvgIcon :icon="item.icon" class="order-tab-icon" />
      <span class="order-tab-label">{{ item.label }}</span>
      <span v-if="item.count > 0" class="order-tab-badge">{{ item.count }}</span>
    </div>
  </div>
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

  function handleSelect(tab: OrderTab) {
    if (tab === props.modelValue) return
    emit('update:modelValue', tab)
    emit('change', tab)
  }
</script>

<style scoped lang="scss">
  .order-tab-bar {
    display: flex;
    gap: 8px;
    padding: 4px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .order-tab-item {
    display: flex;
    flex: 1;
    gap: 6px;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--art-gray-600);
    cursor: pointer;
    border-radius: calc(var(--custom-radius));
    transition: all 0.2s;

    &:hover {
      color: var(--art-gray-800);
      background: var(--art-gray-100);
    }

    &.active {
      font-weight: 600;
      color: #1890ff;
      background: #e6f7ff;
      box-shadow: 0 1px 4px rgb(24 144 255 / 12%);
    }
  }

  .order-tab-icon {
    flex-shrink: 0;
    font-size: 16px;
  }

  .order-tab-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .order-tab-badge {
    flex-shrink: 0;
    min-width: 18px;
    padding: 0 6px;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    color: #fff;
    text-align: center;
    background: #1890ff;
    border-radius: 999px;

    .active & {
      background: #096dd9;
    }
  }
</style>
