<template>
  <div class="vehicle-toolbar" :class="{ embedded: props.embedded }">
    <ElInput
      v-model="keyword"
      class="vehicle-toolbar-search"
      placeholder="搜索车牌号 / VIN / 车主 / 档案号 / 关联订单"
      clearable
      @input="debouncedEmitSearch"
    >
      <template #prefix>
        <ArtSvgIcon icon="ri:search-line" class="vehicle-toolbar-search-icon" />
      </template>
    </ElInput>
    <ElSelect
      v-model="listType"
      class="vehicle-toolbar-link-filter"
      placeholder="关联订单"
      @change="emitSearch"
    >
      <ElOption label="关联订单：全部" value="" />
      <ElOption label="待补关联订单" value="no_order" />
      <ElOption label="已关联订单" value="has_order" />
    </ElSelect>
    <ElButton type="primary" @click="emitSearch">搜索</ElButton>
    <ElButton @click="handleReset">重置</ElButton>
  </div>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { VehicleSearchParams } from '@/types/recycle/recovery/vehicles/vehicle'

  interface Props {
    modelValue: VehicleSearchParams
    /** 嵌入 Tab 面板内时不重复外框 */
    embedded?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: VehicleSearchParams): void
    (e: 'search'): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    embedded: false
  })
  const emit = defineEmits<Emits>()

  const keyword = computed({
    get: () => props.modelValue.keyword || '',
    set: (val: string) => {
      emit('update:modelValue', { ...props.modelValue, keyword: val })
    }
  })

  const listType = computed({
    get: () => props.modelValue.type ?? '',
    set: (val: VehicleSearchParams['type']) => {
      emit('update:modelValue', { ...props.modelValue, type: val })
    }
  })

  function emitSearch() {
    emit('search')
  }

  const debouncedEmitSearch = useDebounceFn(emitSearch, 300)

  function handleReset() {
    emit('update:modelValue', { ...props.modelValue, keyword: '', type: '' })
    emit('reset')
  }
</script>

<style scoped lang="scss">
  .vehicle-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
    border-radius: calc(var(--custom-radius) + 2px);

    &.embedded {
      background: transparent;
      border: none;
      border-radius: 0;
    }
  }

  .vehicle-toolbar-search {
    flex: 1;
    min-width: 260px;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .vehicle-toolbar-link-filter {
    width: 160px;
  }

  .vehicle-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }
</style>
