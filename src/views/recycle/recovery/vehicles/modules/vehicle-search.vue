<template>
  <div class="vehicle-toolbar">
    <ElInput
      v-model="keyword"
      class="vehicle-toolbar-search"
      placeholder="搜索车牌号 / VIN / 车主 / 档案号 / 关联订单"
      clearable
      @keyup.enter="emitSearch"
      @clear="emitSearch"
    >
      <template #prefix>
        <ArtSvgIcon icon="ri:search-line" class="vehicle-toolbar-search-icon" />
      </template>
    </ElInput>
    <ElButton type="primary" @click="emitSearch">搜索</ElButton>
    <ElButton @click="handleReset">重置</ElButton>
  </div>
</template>

<script setup lang="ts">
  import type { VehicleSearchParams } from '@/types/recycle/vehicle'

  interface Props {
    modelValue: VehicleSearchParams
  }

  interface Emits {
    (e: 'update:modelValue', value: VehicleSearchParams): void
    (e: 'search'): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const keyword = computed({
    get: () => props.modelValue.keyword || '',
    set: (val: string) => {
      emit('update:modelValue', { ...props.modelValue, keyword: val })
    }
  })

  function emitSearch() {
    emit('search')
  }

  function handleReset() {
    emit('update:modelValue', { ...props.modelValue, keyword: '' })
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .vehicle-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);
  }

  .vehicle-toolbar-search {
    flex: 1;
    min-width: 240px;
    max-width: 420px;
  }

  .vehicle-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }
</style>
