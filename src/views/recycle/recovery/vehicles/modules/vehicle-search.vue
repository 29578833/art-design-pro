<template>
  <div class="vehicle-toolbar" :class="{ embedded: props.embedded }">
    <div class="vehicle-filter-item vehicle-filter-search">
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
    </div>

    <div class="vehicle-filter-item">
      <span class="vehicle-filter-label">车型</span>
      <ElSelect
        v-model="vehicleType"
        class="vehicle-toolbar-filter"
        placeholder="全部"
        clearable
        filterable
        @change="emitSearch"
      >
        <ElOption label="全部车型" value="" />
        <ElOption
          v-for="item in vehicleTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </div>

    <div v-if="showTowFilter" class="vehicle-filter-item">
      <span class="vehicle-filter-label">拖车</span>
      <ElSelect
        v-model="towStatus"
        class="vehicle-toolbar-filter"
        placeholder="全部"
        clearable
        @change="emitSearch"
      >
        <ElOption label="全部" value="" />
        <ElOption
          v-for="item in VEHICLE_TOW_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </div>

    <div v-if="showFactoryFilter" class="vehicle-filter-item">
      <span class="vehicle-filter-label">入厂拆解</span>
      <ElSelect
        v-model="factoryStatus"
        class="vehicle-toolbar-filter"
        placeholder="全部"
        clearable
        @change="emitSearch"
      >
        <ElOption label="全部" value="" />
        <ElOption
          v-for="item in VEHICLE_FACTORY_STATUS_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </div>

    <div v-if="showCancelFilter" class="vehicle-filter-item">
      <span class="vehicle-filter-label">注销办证</span>
      <ElSelect
        v-model="cancelFilter"
        class="vehicle-toolbar-filter"
        placeholder="全部"
        clearable
        @change="emitSearch"
      >
        <ElOption label="全部" value="" />
        <ElOption
          v-for="item in VEHICLE_CANCEL_FILTER_OPTIONS"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </div>

    <div class="vehicle-filter-item">
      <span class="vehicle-filter-label">关联订单</span>
      <ElSelect
        v-model="listType"
        class="vehicle-toolbar-link-filter"
        :class="{ 'is-alert': listType === 'no_order' }"
        placeholder="全部"
        @change="emitSearch"
      >
        <ElOption label="全部" value="" />
        <ElOption label="待补关联订单" value="no_order" />
        <ElOption label="已关联订单" value="has_order" />
      </ElSelect>
    </div>

    <ElButton type="primary" @click="emitSearch">搜索</ElButton>
    <ElButton @click="handleReset">重置</ElButton>
  </div>
</template>

<script setup lang="ts">
  import { fetchCllxCascade } from '@/api/recycle/data-dict'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { VehicleSearchParams, VehicleTab } from '@/types/recycle/recovery/vehicles/vehicle'
  import {
    VEHICLE_CANCEL_FILTER_OPTIONS,
    VEHICLE_FACTORY_STATUS_OPTIONS,
    VEHICLE_TOW_STATUS_OPTIONS
  } from '@/types/recycle/recovery/vehicles/vehicle'
  import { flattenCllxCascade, type CllxFlatOption } from '@/types/recycle/system/data-dict'

  interface Props {
    modelValue: VehicleSearchParams
    activeTab?: VehicleTab
    /** 嵌入 Tab 面板内时不重复外框 */
    embedded?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: VehicleSearchParams): void
    (e: 'search'): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    activeTab: 'all',
    embedded: false
  })
  const emit = defineEmits<Emits>()

  const showTowFilter = computed(
    () => props.activeTab === 'all' || props.activeTab === 'transport'
  )
  const showFactoryFilter = computed(
    () => props.activeTab === 'all' || props.activeTab === 'factory'
  )
  const showCancelFilter = computed(
    () => props.activeTab === 'all' || props.activeTab === 'cancellation'
  )

  function patchModelValue(patch: Partial<VehicleSearchParams>) {
    emit('update:modelValue', { ...props.modelValue, ...patch })
  }

  const keyword = computed({
    get: () => props.modelValue.keyword || '',
    set: (val: string) => patchModelValue({ keyword: val })
  })

  const vehicleTypeOptions = ref<CllxFlatOption[]>([])

  const vehicleType = computed({
    get: () => props.modelValue.vehicle_type || '',
    set: (val: string) => patchModelValue({ vehicle_type: val })
  })

  async function loadVehicleTypeOptions() {
    const cascade = (await fetchCllxCascade().catch(() => [])) || []
    vehicleTypeOptions.value = flattenCllxCascade(cascade)
  }

  onMounted(loadVehicleTypeOptions)

  const towStatus = computed({
    get: () => props.modelValue.tow_status || '',
    set: (val: string) => patchModelValue({ tow_status: val })
  })

  const factoryStatus = computed({
    get: () => props.modelValue.factory_status || '',
    set: (val: string) => patchModelValue({ factory_status: val })
  })

  const cancelFilter = computed({
    get: () => props.modelValue.cancel_filter || '',
    set: (val: string) => patchModelValue({ cancel_filter: val })
  })

  const listType = computed({
    get: () => props.modelValue.type ?? '',
    set: (val: VehicleSearchParams['type']) => patchModelValue({ type: val })
  })

  function emitSearch() {
    emit('search')
  }

  const debouncedEmitSearch = useDebounceFn(emitSearch, 300)

  function handleReset() {
    emit('update:modelValue', {
      ...props.modelValue,
      keyword: '',
      vehicle_type: '',
      tow_status: '',
      factory_status: '',
      cancel_filter: '',
      type: ''
    })
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

  .vehicle-filter-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .vehicle-filter-search {
    flex: 1;
    min-width: 260px;
  }

  .vehicle-filter-label {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--art-gray-600);
    white-space: nowrap;
  }

  .vehicle-toolbar-search {
    flex: 1;
    min-width: 0;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--art-card-border) inset;
    }
  }

  .vehicle-toolbar-filter {
    width: 140px;
  }

  .vehicle-toolbar-link-filter {
    width: 160px;

    &.is-alert {
      :deep(.el-select__wrapper) {
        box-shadow: 0 0 0 1px #ff4d4f inset;
      }

      :deep(.el-select__selected-item) {
        color: #ff4d4f;
      }
    }
  }

  .vehicle-toolbar-search-icon {
    font-size: 16px;
    color: var(--art-gray-400);
  }
</style>
