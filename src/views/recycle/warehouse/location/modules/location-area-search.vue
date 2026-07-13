<template>
  <div class="loc-search-panel">
    <div class="loc-toolbar">
      <ElInput
        v-model="keyword"
        class="loc-toolbar-search"
        placeholder="搜索仓库名称/编码"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="loc-toolbar-search-icon" />
        </template>
      </ElInput>

      <div class="loc-filter-item">
        <span class="loc-filter-label">状态</span>
        <ElSelect
          v-model="localStatus"
          class="loc-toolbar-select"
          clearable
          placeholder="全部状态"
          @change="emitSearch"
        >
          <ElOption label="启用" :value="1" />
          <ElOption label="禁用" :value="0" />
        </ElSelect>
      </div>

      <ElButton class="loc-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { WarehouseAreaSearchParams } from '@/types/recycle/warehouse-location'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: WarehouseAreaSearchParams
  }

  interface Emits {
    (e: 'update:searchForm', value: WarehouseAreaSearchParams): void
    (e: 'search', form: WarehouseAreaSearchParams): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const localStatus = ref<number | undefined>()

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    localStatus.value =
      props.searchForm.status !== undefined && props.searchForm.status !== ''
        ? (props.searchForm.status as number)
        : undefined
  }

  watch(() => props.searchForm, syncFromProps, { deep: true, immediate: true })

  function buildForm(): WarehouseAreaSearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      status: localStatus.value !== undefined ? localStatus.value : ''
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
