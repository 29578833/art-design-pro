<template>
  <div class="pickup-search-panel">
    <div class="pickup-toolbar">
      <ElInput
        v-model="keyword"
        class="pickup-toolbar-search"
        placeholder="搜索车牌号 / 档案号 / 车主"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="pickup-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="pickup-filter-item">
        <span class="pickup-filter-label">状态</span>
        <ElSelect
          v-model="localStatus"
          class="pickup-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="handleFilterChange"
        >
          <ElOption
            v-for="opt in MATERIAL_STATUS_FILTER_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </div>

      <ElButton class="pickup-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { MaterialSearchParams, MaterialStatus } from '@/types/recycle/material'
  import { MATERIAL_STATUS_FILTER_OPTIONS } from '@/types/recycle/material'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: MaterialSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: MaterialSearchParams): void
    (e: 'search', form: MaterialSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localStatus = ref<MaterialStatus | undefined>()

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localStatus.value =
      props.searchForm.status !== undefined && props.searchForm.status !== ''
        ? (props.searchForm.status as MaterialStatus)
        : undefined
  }

  watch(
    () => props.searchForm,
    () => syncFromProps(),
    { deep: true, immediate: true }
  )

  function buildForm(): MaterialSearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      status: localStatus.value
    }
  }

  function emitSearch() {
    const form = buildForm()
    emit('update:searchForm', form)
    emit('search', form)
  }

  function handleFilterChange() {
    emitSearch()
  }

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .pickup-search-panel {
    flex-shrink: 0;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .pickup-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
  }

  .pickup-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .pickup-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .pickup-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .pickup-filter-label {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--art-gray-600);
    white-space: nowrap;
  }

  .pickup-toolbar-select {
    width: 130px;
  }

  .pickup-toolbar-reset {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--art-gray-500);

    &:hover {
      color: #1677ff;
    }
  }
</style>
