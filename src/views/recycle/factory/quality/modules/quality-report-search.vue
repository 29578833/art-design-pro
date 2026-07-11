<template>
  <div class="quality-search-panel">
    <ElTabs :model-value="activeTab" class="quality-tabs" @update:model-value="handleTabChange">
      <ElTabPane v-for="item in tabs" :key="item.tab" :name="item.tab">
        <template #label>
          <span class="quality-tab-label">
            <ArtSvgIcon :icon="item.icon" class="quality-tab-icon" />
            {{ item.label }}
          </span>
        </template>
      </ElTabPane>
    </ElTabs>

    <div class="quality-toolbar">
      <ElInput
        v-model="keyword"
        class="quality-toolbar-search"
        :placeholder="searchPlaceholder"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="quality-toolbar-search-icon" />
        </template>
      </ElInput>

      <div v-if="activeTab === 'queue'" class="quality-filter-item">
        <span class="quality-filter-label">队列状态</span>
        <ElSelect
          v-model="localQueueStatus"
          class="quality-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="handleFilterChange"
        >
          <ElOption
            v-for="opt in QUEUE_STATUS_FILTER_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </div>

      <div v-else class="quality-filter-item">
        <span class="quality-filter-label">质检结果</span>
        <ElSelect
          v-model="localResult"
          class="quality-toolbar-select"
          clearable
          placeholder="全部结果"
          @change="handleFilterChange"
        >
          <ElOption
            v-for="opt in QC_RESULT_FILTER_OPTIONS"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </div>

      <ElButton class="quality-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    QualityTab,
    QualityQueueParams,
    QualitySearchParams,
    QueueStatus,
    QcResult
  } from '@/types/recycle/quality'
  import {
    QUALITY_TAB_CONFIG,
    QUEUE_STATUS_FILTER_OPTIONS,
    QC_RESULT_FILTER_OPTIONS
  } from '@/types/recycle/quality'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    activeTab: QualityTab
    queueForm: QualityQueueParams
    reportForm: QualitySearchParams
  }

  interface Emits {
    (e: 'update:activeTab', value: QualityTab): void
    (e: 'update:queueForm', value: QualityQueueParams): void
    (e: 'update:reportForm', value: QualitySearchParams): void
    (e: 'tabChange', value: QualityTab): void
    (e: 'search', form: QualityQueueParams | QualitySearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const tabs = QUALITY_TAB_CONFIG

  const searchPlaceholder = computed(() =>
    props.activeTab === 'queue'
      ? '搜索车牌号 / 车主 / VIN / 订单号'
      : '搜索车牌号 / 车主 / 质检编号 / 订单号'
  )

  const keyword = ref('')
  const localQueueStatus = ref<QueueStatus | undefined>()
  const localResult = ref<QcResult | undefined>()

  function syncFromProps() {
    if (props.activeTab === 'queue') {
      keyword.value = props.queueForm.keyword || ''
      localQueueStatus.value = props.queueForm.queue_status || undefined
    } else {
      keyword.value = props.reportForm.keyword || ''
      localResult.value =
        props.reportForm.result !== undefined && props.reportForm.result !== ''
          ? (props.reportForm.result as QcResult)
          : undefined
    }
  }

  watch(
    () => [props.activeTab, props.queueForm, props.reportForm] as const,
    () => syncFromProps(),
    { deep: true, immediate: true }
  )

  function handleTabChange(tab: string | number) {
    const nextTab = tab as QualityTab
    if (nextTab === props.activeTab) return
    emit('update:activeTab', nextTab)
    emit('tabChange', nextTab)
    syncFromProps()
  }

  function buildQueueForm(): QualityQueueParams {
    return {
      keyword: keyword.value.trim() || undefined,
      queue_status: localQueueStatus.value
    }
  }

  function buildReportForm(): QualitySearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      result: localResult.value
    }
  }

  function emitSearch() {
    if (props.activeTab === 'queue') {
      const form = buildQueueForm()
      emit('update:queueForm', form)
      emit('search', form)
      return
    }
    const form = buildReportForm()
    emit('update:reportForm', form)
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
  .quality-search-panel {
    flex-shrink: 0;
    overflow: hidden;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .quality-tabs {
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

  .quality-tab-label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .quality-tab-icon {
    font-size: 16px;
  }

  .quality-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
  }

  .quality-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .quality-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }

  .quality-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .quality-filter-label {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--art-gray-600);
    white-space: nowrap;
  }

  .quality-toolbar-select {
    width: 130px;
  }

  .quality-toolbar-reset {
    flex-shrink: 0;
    margin-left: auto;
    color: var(--art-gray-500);

    &:hover {
      color: var(--art-gray-700);
    }
  }
</style>
