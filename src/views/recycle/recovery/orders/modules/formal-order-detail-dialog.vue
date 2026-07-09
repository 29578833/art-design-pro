<template>
  <ElDialog
    v-model="dialogVisible"
    width="1000px"
    align-center
    destroy-on-close
    :show-close="false"
    class="fo-detail-dialog"
    @closed="handleClosed"
  >
    <!-- 标题 -->
    <template #header>
      <div class="fo-header">
        <div class="fo-header-left">
          <span class="fo-title">正式回收订单详情</span>
          <span v-if="!loading" class="fo-order-type-tag" :style="orderTypeStyle">
            {{ orderTypeLabel }}
          </span>
          <span v-if="!loading" class="fo-status-badge" :style="orderStatusStyle">
            {{ orderStatusLabel }}
          </span>
        </div>
        <button type="button" class="fo-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- Tab 栏 -->
    <div class="fo-tab-bar">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        class="fo-tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <ArtSvgIcon :icon="tab.icon" class="fo-tab-icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 批次车辆切换条 -->
    <div v-if="isBatch && !loading && detail.vehicles?.length" class="fo-batch-bar">
      <span class="fo-batch-label">批次车辆</span>
      <div class="fo-batch-list">
        <button
          v-for="(v, idx) in detail.vehicles"
          :key="v.id ?? idx"
          type="button"
          class="fo-batch-item"
          :class="{ active: selectedVehicleIdx === idx }"
          @click="selectedVehicleIdx = idx"
        >
          <span class="fo-batch-idx">车辆 {{ idx + 1 }}</span>
          <span class="fo-batch-plate">{{ v.plate_no || '—' }}</span>
          <span class="fo-batch-vstatus" :style="vehicleStatusStyle(v)">
            {{ v.status_text || '—' }}
          </span>
        </button>
      </div>
      <span class="fo-batch-count">共 {{ detail.vehicles.length }} 台</span>
    </div>

    <!-- 内容区 -->
    <div v-loading="loading" class="fo-body">
      <FormalOrderBasicTab
        v-if="activeTab === 'basic'"
        :detail="detail"
        :selected-vehicle-idx="selectedVehicleIdx"
      />
      <FormalOrderProgressTab
        v-else-if="activeTab === 'progress'"
        :detail="detail"
        :selected-vehicle-idx="selectedVehicleIdx"
      />
      <FormalOrderAttachmentsTab
        v-else-if="activeTab === 'attachments'"
        :detail="detail"
        :order-id="props.orderId ?? undefined"
        @signed="loadDetail"
      />
    </div>

    <!-- 底栏 -->
    <template #footer>
      <div class="fo-footer">
        <div class="fo-footer-left">
          <span v-if="detail.order_no" class="fo-footer-no">
            <ArtSvgIcon icon="ri:file-list-3-line" class="fo-footer-no-icon" />
            {{ detail.order_no }}
          </span>
        </div>
        <div class="fo-footer-right">
          <ElButton @click="dialogVisible = false">关闭</ElButton>

          <!-- 客户申请 + 待审核：审核操作 -->
          <template v-if="isPendingReview">
            <ElButton class="fo-btn-reject" :loading="submitting" @click="handleReject">
              审核驳回
            </ElButton>
            <ElButton type="success" :loading="submitting" @click="handleApprove">
              审核通过
            </ElButton>
          </template>

          <!-- 已完成：查看结算详情 -->
          <ElButton v-else-if="detail.status === 3" @click="activeTab = 'basic'">
            <ArtSvgIcon icon="ri:money-cny-circle-line" class="mr-1" />
            查看结算详情
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>

  <!-- 驳回原因弹窗 -->
  <ElDialog
    v-model="rejectDialogVisible"
    title="驳回订单"
    width="480px"
    align-center
    destroy-on-close
    class="fo-reject-dialog"
  >
    <ElForm label-position="top" class="fo-reject-form">
      <ElFormItem label="驳回原因">
        <ElInput v-model="rejectReason" type="textarea" :rows="4" placeholder="请填写驳回原因..." />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="rejectDialogVisible = false">取消</ElButton>
      <ElButton type="danger" :loading="submitting" @click="confirmReject">确认驳回</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchAuditOrder, fetchOrderDetail } from '@/api/recycle/order'
  import type { OrderDetail, OrderVehicle } from '@/types/recycle/order'
  import FormalOrderBasicTab from './formal-order-basic-tab.vue'
  import FormalOrderProgressTab from './formal-order-progress-tab.vue'
  import FormalOrderAttachmentsTab from './formal-order-attachments-tab.vue'

  type TabKey = 'basic' | 'progress' | 'attachments'

  interface Props {
    visible: boolean
    orderId: number | null
  }

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'basic', label: '基本信息', icon: 'ri:file-text-line' },
    { key: 'progress', label: '流程与日志', icon: 'ri:git-branch-line' },
    { key: 'attachments', label: '附件与签署', icon: 'ri:attachment-2' }
  ]

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'refresh'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  // ========== 数据 ==========
  const loading = ref(false)
  const detail = ref<Partial<OrderDetail>>({})
  const activeTab = ref<TabKey>('basic')
  const selectedVehicleIdx = ref(0)
  const isBatch = computed(() => Number(detail.value.is_batch) === 1)

  async function loadDetail() {
    if (!props.orderId) return
    loading.value = true
    try {
      const res = await fetchOrderDetail(props.orderId)
      detail.value = res as Partial<OrderDetail>
      selectedVehicleIdx.value = 0
    } finally {
      loading.value = false
    }
  }

  watch(
    () => props.visible,
    (v) => {
      if (v && props.orderId) loadDetail()
    },
    { immediate: true }
  )

  function handleClosed() {
    detail.value = {}
    activeTab.value = 'basic'
    selectedVehicleIdx.value = 0
    rejectReason.value = ''
    rejectDialogVisible.value = false
  }

  // ========== 标签样式 ==========
  const orderTypeLabel = computed(() => {
    const src = detail.value.source || ''
    return ['miniapp', 'mini_program'].includes(src) ? '客户申请' : '员工创建'
  })

  const orderTypeStyle = computed(() => {
    const src = detail.value.source || ''
    return ['miniapp', 'mini_program'].includes(src)
      ? { background: '#F9F0FF', color: '#722ED1' }
      : { background: '#E6F7FF', color: '#1677ff' }
  })

  const ORDER_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
    1: { label: '待审核', color: '#1890FF', bg: '#E6F7FF' },
    2: { label: '审核通过', color: '#52C41A', bg: '#F6FFED' },
    [-1]: { label: '审核驳回', color: '#FF4D4F', bg: '#FFF1F0' },
    3: { label: '已完成', color: '#87D068', bg: '#F6FFED' }
  }

  const orderStatusCfg = computed(() => {
    const s = detail.value.status
    return s !== undefined
      ? (ORDER_STATUS_MAP[s] ?? { label: '未知', color: '#8C8C8C', bg: '#F5F5F5' })
      : { label: '—', color: '#8C8C8C', bg: '#F5F5F5' }
  })
  const orderStatusLabel = computed(() => orderStatusCfg.value.label)
  const orderStatusStyle = computed(() => ({
    background: orderStatusCfg.value.bg,
    color: orderStatusCfg.value.color
  }))

  // ========== 批次车辆状态颜色 ==========
  const VEHICLE_STATUS_COLOR: Record<number, { color: string; bg: string }> = {
    0: { color: '#FA8C16', bg: '#FFF7E6' },
    1: { color: '#1890FF', bg: '#E6F7FF' },
    2: { color: '#1890FF', bg: '#E6F7FF' },
    3: { color: '#722ED1', bg: '#F9F0FF' },
    4: { color: '#FA8C16', bg: '#FFF7E6' },
    5: { color: '#D4380D', bg: '#FFF2E8' },
    6: { color: '#52C41A', bg: '#F6FFED' },
    [-1]: { color: '#FF4D4F', bg: '#FFF1F0' }
  }

  function vehicleStatusStyle(v: OrderVehicle) {
    const cfg = VEHICLE_STATUS_COLOR[v.status as number] ?? { color: '#8C8C8C', bg: '#F5F5F5' }
    return { background: cfg.bg, color: cfg.color }
  }

  // ========== Footer 动作 ==========
  const isPendingReview = computed(() => {
    const src = detail.value.source || ''
    return detail.value.status === 1 && ['miniapp', 'mini_program'].includes(src)
  })

  const submitting = ref(false)
  const rejectDialogVisible = ref(false)
  const rejectReason = ref('')

  async function handleApprove() {
    if (!props.orderId) return
    await ElMessageBox.confirm('确认审核通过该订单？', '审核通过', {
      type: 'warning',
      confirmButtonText: '确认通过',
      cancelButtonText: '取消'
    })
    submitting.value = true
    try {
      await fetchAuditOrder({ id: props.orderId, approved: true })
      dialogVisible.value = false
      emit('refresh')
    } finally {
      submitting.value = false
    }
  }

  function handleReject() {
    rejectReason.value = ''
    rejectDialogVisible.value = true
  }

  async function confirmReject() {
    if (!rejectReason.value.trim()) {
      ElMessage.warning('请填写驳回原因')
      return
    }
    if (!props.orderId) return
    submitting.value = true
    try {
      await fetchAuditOrder({ id: props.orderId, approved: false, remark: rejectReason.value })
      rejectDialogVisible.value = false
      dialogVisible.value = false
      emit('refresh')
    } finally {
      submitting.value = false
    }
  }
</script>

<style lang="scss">
  .fo-detail-dialog {
    padding: 0 0 16px !important;

    .el-dialog__header {
      padding: 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .el-dialog__body {
      padding: 0;
      background: #fafafa;
    }

    .el-dialog__footer {
      padding: 0;
      border-top: 1px solid #f0f0f0;
    }
  }

  .fo-reject-dialog {
    .el-dialog__body {
      padding: 20px 24px 0;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== Header ===== */
  .fo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  .fo-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .fo-title {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
  }

  .fo-order-type-tag,
  .fo-status-badge {
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
  }

  .fo-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #8c8c8c;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      color: #262626;
      background: #f5f5f5;
    }
  }

  /* ===== Tab 栏 ===== */
  .fo-tab-bar {
    display: flex;
    gap: 0;
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #f0f0f0;
  }

  .fo-tab-btn {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #595959;
    cursor: pointer;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;

    &:hover {
      color: #1677ff;
    }

    &.active {
      color: #1677ff;
      border-bottom-color: #1677ff;
    }
  }

  .fo-tab-icon {
    font-size: 14px;
  }

  /* ===== 批次车辆条 ===== */
  .fo-batch-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 20px;
    background: #e6f4ff;
    border-bottom: 1px solid #bae0ff;
  }

  .fo-batch-label {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: #595959;
  }

  .fo-batch-list {
    display: flex;
    flex: 1;
    gap: 8px;
    overflow-x: auto;
  }

  .fo-batch-item {
    display: flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
    transition: all 0.15s;

    &:hover {
      border-color: #91caff;
    }

    &.active {
      background: #fff;
      border-color: #1677ff;
      box-shadow: 0 0 0 2px rgb(22 119 255 / 10%);
    }
  }

  .fo-batch-idx {
    font-size: 11px;
    color: #8c8c8c;
  }

  .fo-batch-plate {
    font-size: 13px;
    font-weight: 700;
    color: #262626;
    letter-spacing: 0.03em;

    .fo-batch-item.active & {
      color: #1677ff;
    }
  }

  .fo-batch-vstatus {
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
  }

  .fo-batch-count {
    flex-shrink: 0;
    font-size: 12px;
    color: #8c8c8c;
    white-space: nowrap;
  }

  /* ===== 内容区 ===== */
  .fo-body {
    min-height: 300px;
    max-height: calc(90vh - 220px);
    padding: 16px 20px;
    overflow-y: auto;
  }

  /* ===== Footer ===== */
  .fo-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
  }

  .fo-footer-left {
    flex: 1;
  }

  .fo-footer-no {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    color: #8c8c8c;
  }

  .fo-footer-no-icon {
    font-size: 13px;
  }

  .fo-footer-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .fo-btn-reject {
    color: #ff4d4f;
    background: #fff;
    border-color: #ff4d4f;

    &:hover {
      color: #ff7875;
      background: #fff1f0;
      border-color: #ff7875;
    }
  }

  .fo-reject-form {
    padding: 0;
  }
</style>
