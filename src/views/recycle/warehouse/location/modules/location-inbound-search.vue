<template>
  <div class="loc-search-panel">
    <div class="loc-toolbar">
      <ElInput
        v-model="keyword"
        class="loc-toolbar-search"
        placeholder="搜索车牌号 / 档案号 / 订单号"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" class="loc-toolbar-search-icon" />
        </template>
      </ElInput>

      <ElInput
        v-model="vin"
        class="loc-toolbar-input"
        placeholder="VIN"
        clearable
        @keyup.enter="emitSearch"
        @clear="emitSearch"
      />

      <ElSelect
        v-model="warehouseName"
        class="loc-toolbar-select"
        clearable
        placeholder="全部仓库"
        @change="emitSearch"
      >
        <ElOption
          v-for="opt in warehouseOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </ElSelect>

      <ElButton class="loc-toolbar-reset" text @click="handleReset">重置</ElButton>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { WarehouseInboundVehicleSearchParams } from '@/types/recycle/warehouse-location'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'

  interface Props {
    searchForm: WarehouseInboundVehicleSearchParams
    warehouseOptions?: { label: string; value: string }[]
  }

  interface Emits {
    (e: 'update:searchForm', value: WarehouseInboundVehicleSearchParams): void
    (e: 'search', form: WarehouseInboundVehicleSearchParams): void
    (e: 'reset'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    warehouseOptions: () => []
  })
  const emit = defineEmits<Emits>()

  const keyword = ref('')
  const vin = ref('')
  const warehouseName = ref<string | undefined>()

  function syncFromProps() {
    keyword.value = props.searchForm.keyword || ''
    vin.value = props.searchForm.vin || ''
    warehouseName.value = props.searchForm.warehouse_name || undefined
  }

  watch(() => props.searchForm, syncFromProps, { deep: true, immediate: true })

  function buildForm(): WarehouseInboundVehicleSearchParams {
    return {
      keyword: keyword.value.trim() || undefined,
      vin: vin.value.trim() || undefined,
      warehouse_name: warehouseName.value || undefined
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
