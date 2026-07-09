<template>
  <ElDialog
    v-model="dialogVisible"
    title="指派拖车司机"
    width="520px"
    align-center
    destroy-on-close
    class="tow-driver-assign-dialog"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <div class="tda-search">
      <ElInput v-model="searchText" placeholder="搜索司机姓名 / 手机号 / 车牌 / 公司" clearable>
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" />
        </template>
      </ElInput>
    </div>

    <div v-loading="driversLoading" class="tda-list">
      <div v-if="!filteredDrivers.length && !driversLoading" class="tda-empty">
        <ArtSvgIcon icon="ri:truck-line" class="tda-empty-icon" />
        <p>未找到匹配司机</p>
      </div>
      <button
        v-for="driver in filteredDrivers"
        :key="driver.id"
        type="button"
        class="tda-driver-item"
        :class="{ selected: selectedDriverId === driver.id }"
        @click="toggleDriver(driver)"
      >
        <div class="tda-avatar">{{ getDriverInitial(driver) }}</div>
        <div class="tda-driver-info">
          <div class="tda-driver-name-row">
            <span class="tda-driver-name">{{ driver.driver_name || '—' }}</span>
            <span v-if="driver.truck_plate" class="tda-driver-plate">{{ driver.truck_plate }}</span>
          </div>
          <div class="tda-driver-meta">
            <span>{{ driver.driver_phone || '—' }}</span>
            <span v-if="driver.tow_company">/ {{ driver.tow_company }}</span>
          </div>
        </div>
        <div class="tda-check" :class="{ checked: selectedDriverId === driver.id }">
          <ArtSvgIcon v-if="selectedDriverId === driver.id" icon="ri:check-line" />
        </div>
      </button>
    </div>

    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton
        type="primary"
        :disabled="!selectedDriver"
        :loading="submitting"
        @click="handleConfirm"
      >
        {{ selectedDriver ? `确认指派给 ${selectedDriver.driver_name || '司机'}` : '请选择司机' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchDispatchTowDriver, fetchTowDriverList } from '@/api/recycle/order'
  import type { TowDriverRecord } from '@/types/recycle/order'

  interface Props {
    visible: boolean
    orderId: number | null
    currentDriverId?: number | null
    deliveryAddress?: string
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'success'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const searchText = ref('')
  const drivers = ref<TowDriverRecord[]>([])
  const driversLoading = ref(false)
  const selectedDriverId = ref<number | null>(null)
  const submitting = ref(false)

  const selectedDriver = computed(
    () => drivers.value.find((driver) => driver.id === selectedDriverId.value) ?? null
  )

  const filteredDrivers = computed(() => {
    const kw = searchText.value.trim().toLowerCase()
    if (!kw) return drivers.value
    return drivers.value.filter((driver) =>
      [
        driver.driver_name,
        driver.driver_phone,
        driver.truck_plate,
        driver.tow_company,
        driver.label
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(kw))
    )
  })

  function getDriverInitial(driver: TowDriverRecord) {
    return (driver.driver_name || '?')[0]
  }

  function toggleDriver(driver: TowDriverRecord) {
    selectedDriverId.value = selectedDriverId.value === driver.id ? null : driver.id
  }

  async function loadDrivers() {
    driversLoading.value = true
    try {
      drivers.value = await fetchTowDriverList()
      if (props.currentDriverId) selectedDriverId.value = Number(props.currentDriverId)
    } finally {
      driversLoading.value = false
    }
  }

  async function handleConfirm() {
    if (!props.orderId || !selectedDriver.value) return
    submitting.value = true
    try {
      await fetchDispatchTowDriver({
        id: props.orderId,
        driver_id: selectedDriver.value.id,
        driver_name: selectedDriver.value.driver_name || '',
        driver_phone: selectedDriver.value.driver_phone || '',
        truck_plate: selectedDriver.value.truck_plate || '',
        tow_company: selectedDriver.value.tow_company || '',
        delivery_address: props.deliveryAddress || ''
      })
      dialogVisible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }

  function handleOpen() {
    loadDrivers()
  }

  function handleClosed() {
    searchText.value = ''
    selectedDriverId.value = null
    drivers.value = []
  }
</script>

<style lang="scss">
  .tow-driver-assign-dialog {
    .el-dialog__body {
      padding: 0;
    }
  }
</style>

<style scoped lang="scss">
  .tda-search {
    padding: 14px 20px 10px;
    border-bottom: 1px solid #f0f0f0;
  }

  .tda-list {
    min-height: 220px;
    max-height: 380px;
    padding: 10px 12px;
    overflow-y: auto;
  }

  .tda-empty {
    padding: 44px 0;
    font-size: 13px;
    color: #bfbfbf;
    text-align: center;

    p {
      margin-top: 8px;
    }
  }

  .tda-empty-icon {
    font-size: 34px;
  }

  .tda-driver-item {
    display: flex;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 6px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 10px;
    transition: all 0.15s;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f5f5f5;
    }

    &.selected {
      background: #e6f4ff;
      border-color: #1677ff;
    }
  }

  .tda-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #13c2c2 0%, #1677ff 100%);
    border-radius: 50%;
  }

  .tda-driver-info {
    flex: 1;
    min-width: 0;
  }

  .tda-driver-name-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .tda-driver-name {
    font-size: 13px;
    font-weight: 600;
    color: #262626;
  }

  .tda-driver-plate {
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 600;
    color: #0e7490;
    background: #e6fffb;
    border: 1px solid #87e8de;
    border-radius: 4px;
  }

  .tda-driver-meta {
    display: flex;
    gap: 4px;
    margin-top: 2px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .tda-check {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    font-size: 12px;
    color: #fff;
    border: 2px solid #d9d9d9;
    border-radius: 50%;
    transition: all 0.15s;

    &.checked {
      background: #1677ff;
      border-color: #1677ff;
    }
  }
</style>
