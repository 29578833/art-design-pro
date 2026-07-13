<template>
  <div class="inv-search-panel">
    <div class="inv-category-tabs">
      <button
        v-for="tab in categoryTabs"
        :key="String(tab.value)"
        type="button"
        class="inv-category-tab"
        :class="{ 'is-active': localCategory === tab.value }"
        :style="
          localCategory === tab.value && tab.color
            ? { background: tab.color, borderColor: tab.color, color: '#fff' }
            : tab.color
              ? { color: tab.color, borderColor: '#D9D9D9' }
              : undefined
        "
        @click="handleCategoryChange(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="inv-category-count">({{ tab.count }})</span>
      </button>
    </div>

    <div class="inv-toolbar">
      <ElInput
        v-model="keyword"
        class="inv-toolbar-search"
        placeholder="搜索物品名称 / 编号 / 库位 / 来源VIN"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="inv-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="inv-filter-item">
        <span class="inv-filter-label">状态</span>
        <ElSelect
          v-model="localStatus"
          class="inv-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="handleFilterChange"
        >
          <ElOption
            v-for="opt in INVENTORY_STATUS_FILTER_OPTIONS"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value === '' ? undefined : opt.value"
          />
        </ElSelect>
      </div>

      <ElButton class="inv-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { ProductStoreCategory } from '@/types/recycle/product-store'
  import { PRODUCT_STORE_CATEGORY_CONFIG } from '@/types/recycle/product-store'
  import type {
    InventoryCategoryCounts,
    InventoryItemSearchParams,
    InventoryItemStatus
  } from '@/types/recycle/inventory-item'
  import {
    INVENTORY_CATEGORY_FILTERS,
    INVENTORY_STATUS_FILTER_OPTIONS
  } from '@/types/recycle/inventory-item'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: InventoryItemSearchParams
    categoryCounts?: InventoryCategoryCounts
  }

  interface Emits {
    (e: 'update:searchForm', value: InventoryItemSearchParams): void
    (e: 'search', form: InventoryItemSearchParams): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    categoryCounts: () => ({ total: 0, reusable: 0, metal: 0, hazardous: 0, general: 0 })
  })
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localCategory = ref<ProductStoreCategory | ''>('')
  const localStatus = ref<InventoryItemStatus | undefined>()

  const categoryTabs = computed(() =>
    INVENTORY_CATEGORY_FILTERS.map((item) => {
      const cfg = item.value ? PRODUCT_STORE_CATEGORY_CONFIG[item.value] : null
      return {
        ...item,
        color: cfg?.color,
        count:
          item.value === ''
            ? props.categoryCounts.total
            : (props.categoryCounts[item.value as ProductStoreCategory] ?? 0)
      }
    })
  )

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localCategory.value = props.searchForm.category !== undefined ? props.searchForm.category : ''
    localStatus.value =
      props.searchForm.status !== undefined && props.searchForm.status !== ''
        ? (props.searchForm.status as InventoryItemStatus)
        : undefined
  }

  watch(() => props.searchForm, syncFromProps, { deep: true, immediate: true })

  function buildForm(): InventoryItemSearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      category: localCategory.value,
      status: localStatus.value
    }
  }

  function emitSearch() {
    const form = buildForm()
    emit('update:searchForm', form)
    emit('search', form)
  }

  function handleCategoryChange(value: ProductStoreCategory | '') {
    localCategory.value = value
    emitSearch()
  }

  function handleFilterChange() {
    emitSearch()
  }

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .inv-search-panel {
    flex-shrink: 0;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .inv-category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px 0;
  }

  .inv-category-tab {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #595959;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 20px;
    transition: all 0.2s;

    &.is-active {
      color: #fff;
      background: #1677ff;
      border-color: #1677ff;
    }
  }

  .inv-category-count {
    opacity: 0.8;
  }

  .inv-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
  }

  .inv-toolbar-search {
    flex: 1;
    min-width: 220px;
    max-width: 360px;
  }

  .inv-toolbar-search-icon {
    font-size: 14px;
    color: #9ca3af;
  }

  .inv-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .inv-filter-label {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }

  .inv-toolbar-select {
    width: 140px;
  }
</style>
