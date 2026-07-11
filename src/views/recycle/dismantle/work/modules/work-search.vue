<template>
  <div class="work-search-panel">
    <div class="work-toolbar">
      <ElInput
        v-model="keyword"
        class="work-toolbar-search"
        placeholder="搜索车牌号 / 档案号 / 车主姓名"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="work-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="work-status-tabs">
        <button
          v-for="tab in PLATE_STATUS_FILTER_TABS"
          :key="String(tab.value)"
          type="button"
          class="work-status-tab"
          :class="{ 'is-active': localStatus === tab.value }"
          @click="handleTabChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <ElButton class="work-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PlateSearchParams, PlateStatusFilter } from '@/types/recycle/plate'
  import { PLATE_STATUS_FILTER_TABS } from '@/types/recycle/plate'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: PlateSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: PlateSearchParams): void
    (e: 'search', form: PlateSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localStatus = ref<PlateStatusFilter>('')

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localStatus.value = props.searchForm.status !== undefined ? props.searchForm.status : ''
  }

  watch(
    () => props.searchForm,
    () => syncFromProps(),
    { deep: true, immediate: true }
  )

  function buildForm(): PlateSearchParams {
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

  function handleTabChange(value: PlateStatusFilter) {
    localStatus.value = value
    emitSearch()
  }

  function handleReset() {
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .work-search-panel {
    flex-shrink: 0;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .work-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
  }

  .work-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .work-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .work-status-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .work-status-tab {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #595959;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
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

  .work-toolbar-reset {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--art-gray-500);

    &:hover {
      color: #1677ff;
    }
  }
</style>
