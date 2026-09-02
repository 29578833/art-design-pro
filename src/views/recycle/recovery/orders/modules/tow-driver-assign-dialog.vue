<template>
  <ElDialog
    v-model="dialogVisible"
    width="540px"
    align-center
    destroy-on-close
    :show-close="false"
    class="tow-driver-assign-dialog"
    style="padding: 0 !important;"
    @open="handleOpen"
    @closed="handleClosed"
  >
    <!-- ===== 标题栏：标题 + 车牌 + 关闭 ===== -->
    <template #header>
      <div class="tda-header">
        <div class="tda-header-left">
          <span class="tda-title">指派拖车司机</span>
          <span v-if="plateNo" class="tda-subtitle">车牌：{{ plateNo }}</span>
        </div>
        <button type="button" class="tda-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- ===== 取车地址栏 ===== -->
    <div v-if="plateNo || pickupAddress" class="tda-pickup">
      <div class="tda-pickup-info">
        <ArtSvgIcon icon="ri:truck-line" class="tda-pickup-icon" />
        <span v-if="plateNo" class="tda-pickup-plate">{{ plateNo }}</span>
      </div>
      <div class="tda-pickup-info">
        <span v-if="pickupAddress" class="tda-pickup-address">取车地址：{{ pickupAddress }}</span>
      </div>
    </div>

    <!-- ===== 搜索栏 ===== -->
    <div class="tda-search">
      <ElInput
        v-model="searchText"
        placeholder="搜索司机姓名、手机号、车牌..."
        clearable
        size="large"
      >
        <template #prefix>
          <ArtSvgIcon icon="ri:search-line" />
        </template>
      </ElInput>
    </div>

    <!-- ===== 司机列表 ===== -->
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
        :class="{ selected: isCardSelected(driver) }"
        @click="toggleDriver(driver)"
      >
        <div class="tda-avatar">
          <ArtSvgIcon icon="ri:user-fill" />
        </div>
        <div class="tda-driver-info">
          <div class="tda-driver-name-row">
            <span class="tda-driver-name">{{ driver.driver_name || '—' }}</span>
            <span
              class="tda-status-tag"
              :class="driverStatus(driver).type === 'idle' ? 'idle' : 'busy'"
            >
              {{ driverStatus(driver).label }}
            </span>
          </div>
          <div class="tda-driver-meta">
            <span class="tda-driver-meta-item">
              <ArtSvgIcon icon="ri:phone-line" class="tda-driver-meta-icon" />
              {{ driver.driver_phone || '—' }}
            </span>
            <span v-if="driver.truck_plate" class="tda-driver-meta-item">
              <ArtSvgIcon icon="ri:truck-line" class="tda-driver-meta-icon" />
              {{ driver.truck_plate }}
            </span>
          </div>
        </div>
        <div v-if="isCardSelected(driver)" class="tda-check">
          <ArtSvgIcon icon="ri:check-line" />
        </div>
      </button>
    </div>

    <!-- ===== 手动输入司机信息 ===== -->
    <div class="tda-manual">
      <div class="tda-manual-label">或手动输入司机信息</div>
      <div class="tda-manual-inputs">
        <ElInput v-model="manualName" placeholder="司机姓名（可选）" />
        <ElInput v-model="manualPhone" placeholder="手机号（必填）" clearable />
      </div>
      <div class="tda-manual-hint">输入手机号后系统将自动匹配或创建司机账号</div>
    </div>

    <!-- ===== 已选择 ===== -->
    <div v-if="selectionText" class="tda-selected">
      <ArtSvgIcon icon="ri:check-line" class="tda-selected-icon" />
      <span>{{ selectionText }}</span>
    </div>

    <template #footer>
      <ElButton size="large" @click="dialogVisible = false">取消</ElButton>
      <ElButton
        type="primary"
        size="large"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleConfirm"
      >
        确认指派
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchDispatchTowDriver, fetchTowDriverList } from '@/api/recycle/order'
  import type { TowDriverRecord } from '@/types/recycle/recovery/orders/order'

  interface Props {
    visible: boolean
    orderId: number | null
    currentDriverId?: number | null
    /** 关联订单车牌号（显示在标题与取车地址栏） */
    plateNo?: string
    /** 取车地址（显示在顶部地址栏） */
    pickupAddress?: string
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
  const manualName = ref('')
  const manualPhone = ref('')
  const submitting = ref(false)

  const selectedDriver = computed(
    () => drivers.value.find((driver) => driver.id === selectedDriverId.value) ?? null
  )

  /** 手动手机号命中列表中的司机（用于高亮与复用其车牌/公司） */
  const manualMatchedDriver = computed(() => {
    const phone = manualPhone.value.trim()
    if (!phone) return null
    return (
      drivers.value.find((driver) => driver.driver_phone && driver.driver_phone === phone) ?? null
    )
  })

  /**
   * 最终生效的司机：
   * 1. 列表选中的司机（优先）
   * 2. 手动手机号命中的司机（复用其车牌/公司）
   * 3. 纯手动填写的司机（手机号必填）
   */
  const effectiveDriver = computed(() => {
    if (selectedDriver.value) return selectedDriver.value
    if (manualMatchedDriver.value) return manualMatchedDriver.value
    if (manualPhone.value.trim()) {
      return {
        id: 0,
        driver_name: manualName.value.trim(),
        driver_phone: manualPhone.value.trim(),
        truck_plate: '',
        tow_company: ''
      }
    }
    return null
  })

  const canSubmit = computed(() => Boolean(effectiveDriver.value?.driver_phone))

  /** 顶部绿色已选择文案 */
  const selectionText = computed(() => {
    const driver = effectiveDriver.value
    if (!driver?.driver_phone && !driver?.driver_name) return ''
    return `已选择：${driver.driver_name || '未填写'}（${driver.driver_phone}）`
  })

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

  /** 卡片选中态：列表选中 或 手动手机号命中该司机 */
  function isCardSelected(driver: TowDriverRecord) {
    return (
      selectedDriverId.value === driver.id ||
      (manualMatchedDriver.value?.id === driver.id && !selectedDriver.value)
    )
  }

  /** 空闲 / 执行中 N 单 */
  function driverStatus(driver: TowDriverRecord) {
    const count = Number(driver.active_order_count ?? 0)
    if (count > 0) return { label: `执行中${count}单`, type: 'busy' }
    return { label: '空闲', type: 'idle' }
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
    if (!props.orderId) return
    const driver = effectiveDriver.value
    const driverPhone = driver?.driver_phone || ''
    if (!driverPhone) return
    submitting.value = true
    try {
      await fetchDispatchTowDriver({
        id: props.orderId,
        driver_id: driver?.id ?? 0,
        driver_name: driver?.driver_name || manualName.value.trim(),
        driver_phone: driverPhone,
        truck_plate: driver?.truck_plate || '',
        tow_company: driver?.tow_company || '',
        delivery_address: props.pickupAddress || ''
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
    manualName.value = ''
    manualPhone.value = ''
  }
</script>

<style lang="scss">
  .tow-driver-assign-dialog {
    border-radius: 10px;

    .el-dialog__header {
      padding: 16px 20px 8px;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 14px 20px 18px;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== 标题栏 ===== */
  .tda-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 4px;
  }

  .tda-header-left {
    display: flex;
    gap: 10px;
    align-items: baseline;
  }

  .tda-title {
    font-size: 17px;
    font-weight: 700;
    color: #1f1f1f;
  }

  .tda-subtitle {
    font-size: 13px;
    color: #8c8c8c;
  }

  .tda-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    font-size: 18px;
    color: #8c8c8c;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 6px;
    transition: all 0.15s;

    &:hover {
      color: #1f1f1f;
      background: #f0f0f0;
    }
  }

  /* ===== 取车地址栏 ===== */
  .tda-pickup {
    display: flex;
    // gap: 8px;
    flex-direction: column;
    align-items: flex-start;
    padding: 10px 16px;
    margin: 0;
    font-size: 13px;
    background: #e6f4ff;
  }
  .tda-pickup-info {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .tda-pickup-icon {
    font-size: 16px;
    color: #1677ff;
    margin-right: 4px;
  }

  .tda-pickup-plate {
    font-weight: 600;
    color: #262626;
  }

  .tda-pickup-address {
    color: #575757;
  }

  /* ===== 搜索栏 ===== */
  .tda-search {
    padding: 14px 16px 4px;
  }

  /* ===== 司机列表 ===== */
  .tda-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 368px;
    padding: 8px 16px;
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
    flex-shrink: 0;
    gap: 12px;
    align-items: center;
    width: 100%;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    transition: all 0.15s;

    &:hover {
      border-color: #b7d9ff;
    }

    &.selected {
      background: #f0f7ff;
      border-color: #1677ff;
    }
  }

  .tda-avatar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 20px;
    color: #c0c0c0;
    background: #f0f0f0;
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
    font-size: 14px;
    font-weight: 600;
    color: #262626;
  }

  .tda-status-tag {
    height: 20px;
    padding: 0 7px;
    font-size: 12px;
    line-height: 20px;
    border-radius: 4px;

    &.idle {
      color: #52c41a;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
    }

    &.busy {
      color: #fa8c16;
      background: #fff7e6;
      border: 1px solid #ffd591;
    }
  }

  .tda-driver-meta {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-top: 4px;
    font-size: 13px;
    color: #595959;
  }

  .tda-driver-meta-item {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .tda-driver-meta-icon {
    font-size: 13px;
    color: #8c8c8c;
  }

  .tda-check {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    font-size: 13px;
    color: #fff;
    background: #1677ff;
    border-radius: 50%;
  }

  /* ===== 手动输入 ===== */
  .tda-manual {
    padding: 12px 14px;
    margin: 6px 16px 0;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
  }

  .tda-manual-label {
    margin-bottom: 10px;
    font-size: 13px;
    color: #595959;
  }

  .tda-manual-inputs {
    display: flex;
    gap: 10px;
  }

  .tda-manual-hint {
    margin-top: 8px;
    font-size: 12px;
    color: #8c8c8c;
  }

  /* ===== 已选择 ===== */
  .tda-selected {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 14px;
    margin: 10px 16px 0;
    font-size: 14px;
    color: #262626;
    background: #f0f9eb;
    border: 1px solid #b7eb8f;
    border-radius: 6px;
  }

  .tda-selected-icon {
    font-size: 16px;
    color: #52c41a;
  }
</style>
