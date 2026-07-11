<template>
  <div class="product-search-panel">
    <div class="product-category-tabs">
      <button
        v-for="tab in categoryTabs"
        :key="String(tab.value)"
        type="button"
        class="product-category-tab"
        :class="{ 'is-active': localCategory === tab.value }"
        @click="handleCategoryChange(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="product-category-count">({{ tab.count }})</span>
      </button>
    </div>

    <div class="product-toolbar">
      <ElInput
        v-model="keyword"
        class="product-toolbar-search"
        placeholder="搜索物品名称 / 入库单号 / 库位"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="product-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="product-filter-item">
        <span class="product-filter-label">状态</span>
        <ElSelect
          v-model="localStatus"
          class="product-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="handleFilterChange"
        >
          <ElOption
            v-for="opt in PRODUCT_STORE_STATUS_FILTER_OPTIONS"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value === '' ? undefined : opt.value"
          />
        </ElSelect>
      </div>

      <ElButton class="product-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    ProductStoreCategory,
    ProductStoreCategoryCounts,
    ProductStoreSearchParams,
    ProductStoreStatus
  } from '@/types/recycle/product-store'
  import {
    PRODUCT_STORE_CATEGORY_FILTERS,
    PRODUCT_STORE_STATUS_FILTER_OPTIONS
  } from '@/types/recycle/product-store'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: ProductStoreSearchParams
    categoryCounts?: ProductStoreCategoryCounts
  }

  interface Emits {
    (e: 'update:searchForm', value: ProductStoreSearchParams): void
    (e: 'search', form: ProductStoreSearchParams): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    categoryCounts: () => ({ reusable: 0, metal: 0, hazardous: 0, general: 0 })
  })
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localCategory = ref<ProductStoreCategory | ''>('')
  const localStatus = ref<ProductStoreStatus | undefined>()

  const categoryTabs = computed(() => {
    const total =
      props.categoryCounts.reusable +
      props.categoryCounts.metal +
      props.categoryCounts.hazardous +
      props.categoryCounts.general
    return PRODUCT_STORE_CATEGORY_FILTERS.map((item) => ({
      ...item,
      count:
        item.value === '' ? total : (props.categoryCounts[item.value as ProductStoreCategory] ?? 0)
    }))
  })

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localCategory.value = props.searchForm.category !== undefined ? props.searchForm.category : ''
    localStatus.value =
      props.searchForm.status !== undefined && props.searchForm.status !== ''
        ? (props.searchForm.status as ProductStoreStatus)
        : undefined
  }

  watch(
    () => props.searchForm,
    () => syncFromProps(),
    { deep: true, immediate: true }
  )

  function buildForm(): ProductStoreSearchParams {
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
  .product-search-panel {
    flex-shrink: 0;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .product-category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 16px 0;
  }

  .product-category-tab {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 6px 12px;
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

    &:hover:not(.is-active) {
      color: #1677ff;
      border-color: #1677ff;
    }
  }

  .product-category-count {
    opacity: 0.85;
  }

  .product-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px 16px;
  }

  .product-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .product-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .product-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .product-filter-label {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--art-gray-600);
    white-space: nowrap;
  }

  .product-toolbar-select {
    width: 130px;
  }

  .product-toolbar-reset {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--art-gray-500);

    &:hover {
      color: #1677ff;
    }
  }
</style>
