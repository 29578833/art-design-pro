<template>
  <div class="entry-search-panel">
    <div class="entry-toolbar">
      <ElInput
        v-model="keyword"
        class="entry-toolbar-search"
        placeholder="搜索车牌号 / 车主 / 订单号 / VIN"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="entry-toolbar-search-icon" />
        </template>
      </ElInput>

      <ElButton class="entry-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { WarehouseEntrySearchParams } from '@/types/recycle/warehouse'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: WarehouseEntrySearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: WarehouseEntrySearchParams): void
    (e: 'search', form: WarehouseEntrySearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
  }

  watch(
    () => props.searchForm,
    () => syncFromProps(),
    { deep: true, immediate: true }
  )

  function buildForm(): WarehouseEntrySearchParams {
    return {
      keyword: keyword.value.trim() || undefined
    }
  }

  function emitSearch() {
    const form = buildForm()
    emit('update:searchForm', form)
    emit('search', form)
  }

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .entry-search-panel {
    flex-shrink: 0;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .entry-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
  }

  .entry-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .entry-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .entry-toolbar-reset {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--art-gray-500);

    &:hover {
      color: #1677ff;
    }
  }
</style>
