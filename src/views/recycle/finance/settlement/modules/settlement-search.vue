<template>
  <div class="stl-search-panel">
    <div class="stl-toolbar">
      <ElInput
        v-model="keyword"
        class="stl-toolbar-search"
        placeholder="搜索结算单号 / 订单号 / 车牌 / 车主"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="stl-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="stl-filter-item">
        <span class="stl-filter-label">状态</span>
        <ElSelect
          v-model="localStatus"
          class="stl-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="emitSearch"
        >
          <ElOption
            v-for="opt in SETTLEMENT_STATUS_FILTERS.filter((o) => o.value !== '')"
            :key="String(opt.value)"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </div>

      <ElButton class="stl-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { SettlementSearchParams, SettlementStatus } from '@/types/recycle/settlement'
  import { SETTLEMENT_STATUS_FILTERS } from '@/types/recycle/settlement'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: SettlementSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: SettlementSearchParams): void
    (e: 'search', form: SettlementSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localStatus = ref<SettlementStatus | undefined>()

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localStatus.value =
      props.searchForm.settlement_status !== undefined && props.searchForm.settlement_status !== ''
        ? (props.searchForm.settlement_status as SettlementStatus)
        : undefined
  }

  watch(() => props.searchForm, syncFromProps, { deep: true, immediate: true })

  function buildForm(): SettlementSearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      settlement_status: localStatus.value
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
  .stl-search-panel {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .stl-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
  }

  .stl-toolbar-search {
    flex: 1;
    min-width: 220px;
    max-width: 360px;
  }

  .stl-toolbar-search-icon {
    font-size: 14px;
    color: #9ca3af;
  }

  .stl-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .stl-filter-label {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }

  .stl-toolbar-select {
    width: 150px;
  }
</style>
