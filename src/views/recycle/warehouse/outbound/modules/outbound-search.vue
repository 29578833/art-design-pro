<template>
  <div class="ob-search-panel">
    <div class="ob-toolbar">
      <ElInput
        v-model="keyword"
        class="ob-toolbar-search"
        placeholder="搜索出库单号 / 客户名称"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="ob-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="ob-filter-item">
        <span class="ob-filter-label">类型</span>
        <ElSelect
          v-model="localType"
          class="ob-toolbar-select"
          clearable
          placeholder="全部类型"
          @change="emitSearch"
        >
          <ElOption
            v-for="opt in SALE_OUTBOUND_TYPE_FILTERS"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value === '' ? undefined : opt.value"
          />
        </ElSelect>
      </div>

      <div class="ob-filter-item">
        <span class="ob-filter-label">状态</span>
        <ElSelect
          v-model="localStatus"
          class="ob-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="emitSearch"
        >
          <ElOption
            v-for="opt in SALE_OUTBOUND_STATUS_FILTERS"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value === '' ? undefined : opt.value"
          />
        </ElSelect>
      </div>

      <ElButton class="ob-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type {
    SaleOutboundSearchParams,
    SaleOutboundStatus,
    SaleOutboundType
  } from '@/types/recycle/sale-outbound'
  import {
    SALE_OUTBOUND_STATUS_FILTERS,
    SALE_OUTBOUND_TYPE_FILTERS
  } from '@/types/recycle/sale-outbound'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: SaleOutboundSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: SaleOutboundSearchParams): void
    (e: 'search', form: SaleOutboundSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localType = ref<SaleOutboundType | undefined>()
  const localStatus = ref<SaleOutboundStatus | undefined>()

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localType.value =
      props.searchForm.exit_type !== undefined && props.searchForm.exit_type !== ''
        ? (props.searchForm.exit_type as SaleOutboundType)
        : undefined
    localStatus.value =
      props.searchForm.status !== undefined && props.searchForm.status !== ''
        ? (props.searchForm.status as SaleOutboundStatus)
        : undefined
  }

  watch(() => props.searchForm, syncFromProps, { deep: true, immediate: true })

  function buildForm(): SaleOutboundSearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      exit_type: localType.value,
      status: localStatus.value
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
  .ob-search-panel {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .ob-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
  }

  .ob-toolbar-search {
    flex: 1;
    min-width: 200px;
    max-width: 320px;
  }

  .ob-toolbar-search-icon {
    font-size: 14px;
    color: #9ca3af;
  }

  .ob-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ob-filter-label {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }

  .ob-toolbar-select {
    width: 140px;
  }
</style>
