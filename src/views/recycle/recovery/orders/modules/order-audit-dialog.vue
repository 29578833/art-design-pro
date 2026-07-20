<template>
  <ElDialog
    v-model="dialogVisible"
    width="1200px"
    align-center
    destroy-on-close
    class="order-audit-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="audit-header">
        <div>
          <div class="audit-header-title">客户申请报废 - 审核</div>
          <div class="audit-header-sub">{{ detail.order_no || '—' }}</div>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="audit-body">
      <div v-if="isBatch && detail.vehicles?.length" class="audit-card">
        <div class="batch-head">
          <span class="batch-tag">
            <ArtSvgIcon icon="ri:truck-line" />
            批次回收
          </span>
          <span class="batch-hint">
            共 <em>{{ detail.vehicles.length }}</em> 辆车，点击查看各车辆信息
          </span>
        </div>
        <div class="batch-tabs">
          <button
            v-for="(v, idx) in detail.vehicles"
            :key="v.id ?? idx"
            type="button"
            class="batch-tab"
            :class="{ active: selectedVehicleIdx === idx }"
            @click="selectedVehicleIdx = idx"
          >
            <ArtSvgIcon icon="ri:car-line" />
            车辆 {{ idx + 1 }}
            <span class="batch-tab-plate">{{ v.plate_no || '—' }}</span>
          </button>
        </div>
      </div>

      <div class="audit-card">
        <div class="card-title-row">
          <span class="card-title">车辆信息</span>
          <span v-if="isBatch" class="card-badge"
            >车辆 {{ selectedVehicleIdx + 1 }} / {{ detail.vehicles?.length }}</span
          >
          <span v-else class="card-badge card-badge--green">单台回收</span>
        </div>
        <ElRow :gutter="24">
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">车牌号</div>
              <div class="info-value info-value--bold">{{ currentVehicle?.plate_no || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">车架号(VIN)</div>
              <div class="info-value info-value--mono">{{ currentVehicle?.vin || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">车辆型号</div>
              <div class="info-value">
                {{
                  [currentVehicle?.brand, currentVehicle?.model].filter(Boolean).join(' ') || '—'
                }}
              </div>
            </div>
          </ElCol>
          <ElCol v-if="currentVehicle?.vehicle_year" :span="8">
            <div class="info-item">
              <div class="info-label">出厂年份</div>
              <div class="info-value">{{ currentVehicle.vehicle_year }}年</div>
            </div>
          </ElCol>
          <ElCol v-if="currentVehicle?.status_text" :span="8">
            <div class="info-item">
              <div class="info-label">车辆物流状态</div>
              <div class="info-value">{{ currentVehicle.status_text }}</div>
            </div>
          </ElCol>
        </ElRow>
      </div>

      <div class="audit-card">
        <div class="card-title">客户信息</div>
        <ElRow :gutter="24">
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">客户姓名</div>
              <div class="info-value info-value--bold">{{ detail.real_name || '—' }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">联系电话</div>
              <div class="info-value">{{ detail.phone || '—' }}</div>
            </div>
          </ElCol>
          <ElCol v-if="detail.address" :span="8">
            <div class="info-item">
              <div class="info-label">地址</div>
              <div class="info-value">{{ detail.address }}</div>
            </div>
          </ElCol>
        </ElRow>
      </div>

      <div class="audit-card audit-card--highlight">
        <div class="card-title-row">
          <ArtSvgIcon icon="ri:file-check-line" class="highlight-icon" />
          <span class="card-title card-title--highlight">订单信息（审核重点）</span>
        </div>
        <ElRow :gutter="24">
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">回收类型</div>
              <div class="info-value info-value--bold">
                {{
                  isBatch
                    ? `批次回收（共 ${detail.vehicles?.length || detail.batch_vehicle_count || 0} 辆）`
                    : '单台回收'
                }}
              </div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">托运方式</div>
              <div class="info-value info-value--bold">
                {{ detail.delivery_type === 'tow' ? '预约拖车' : '自行送厂' }}
              </div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="info-item">
              <div class="info-label">预估残值/结算金额</div>
              <div class="info-value info-value--price">
                {{
                  detail.settlement_amount != null && detail.settlement_amount !== ''
                    ? `¥${detail.settlement_amount}`
                    : detail.unit_price != null && detail.unit_price !== ''
                      ? `¥${detail.unit_price}`
                      : '待评估'
                }}
              </div>
            </div>
          </ElCol>
        </ElRow>
      </div>

      <div class="audit-card">
        <ElFormItem label="驳回原因（可选）" label-position="top">
          <ElInput
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="若选择驳回，请填写驳回原因..."
          />
        </ElFormItem>
      </div>
    </div>

    <template #footer>
      <div class="audit-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton class="btn-reject" :loading="submitting" @click="handleReject">驳回</ElButton>
        <ElButton class="btn-approve" :loading="submitting" @click="handleApprove">通过</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchAuditOrder, fetchOrderDetail } from '@/api/recycle/order'
  import type { OrderDetail, OrderVehicle } from '@/types/recycle/order'

  interface Props {
    visible: boolean
    orderId: number | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'refresh'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const loading = ref(false)
  const submitting = ref(false)
  const detail = ref<Partial<OrderDetail>>({})
  const selectedVehicleIdx = ref(0)
  const rejectReason = ref('')

  const isBatch = computed(() => Number(detail.value.is_batch) === 1)

  const currentVehicle = computed<OrderVehicle | undefined>(() => {
    if (isBatch.value && detail.value.vehicles?.length) {
      return detail.value.vehicles[selectedVehicleIdx.value]
    }
    return detail.value.vehicles?.[0] || detail.value.vehicle
  })

  async function loadDetail() {
    if (!props.orderId) return
    loading.value = true
    try {
      detail.value = (await fetchOrderDetail(props.orderId)) as Partial<OrderDetail>
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
    selectedVehicleIdx.value = 0
    rejectReason.value = ''
  }

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

  async function handleReject() {
    if (!props.orderId) return
    if (!rejectReason.value.trim()) {
      ElMessage.warning('请填写驳回原因')
      return
    }
    submitting.value = true
    try {
      await fetchAuditOrder({
        id: props.orderId,
        approved: false,
        remark: rejectReason.value.trim()
      })
      dialogVisible.value = false
      emit('refresh')
    } finally {
      submitting.value = false
    }
  }
</script>

<style lang="scss">
  .order-audit-dialog {
    padding: 0 !important;

    .el-dialog__header {
      padding: 0;
      margin: 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .el-dialog__body {
      padding: 0;
      background: #fafafa;
    }

    .el-dialog__footer {
      padding: 0;
      border-top: 1px solid #e5e7eb;
    }
  }
</style>

<style scoped lang="scss">
  .audit-header {
    padding: 16px 24px;
  }

  .audit-header-title {
    font-size: 18px;
    font-weight: 600;
    color: #262626;
  }

  .audit-header-sub {
    margin-top: 4px;
    font-size: 13px;
    color: #8c8c8c;
  }

  .audit-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: calc(90vh - 160px);
    padding: 24px;
    overflow-y: auto;
  }

  .audit-card {
    padding: 20px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    &--highlight {
      background: #fff7e6;
      border-color: #ffd591;
    }
  }

  .card-title {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #262626;

    &--highlight {
      margin-bottom: 0;
      color: #fa8c16;
    }
  }

  .card-title-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
  }

  .highlight-icon {
    font-size: 20px;
    color: #fa8c16;
  }

  .card-badge {
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #1890ff;
    background: #e6f7ff;
    border-radius: 4px;

    &--green {
      color: #52c41a;
      background: #f6ffed;
    }
  }

  .info-item {
    margin-bottom: 8px;
  }

  .info-label {
    margin-bottom: 4px;
    font-size: 12px;
    color: #8c8c8c;
  }

  .info-value {
    font-size: 14px;
    color: #262626;

    &--bold {
      font-weight: 600;
    }

    &--mono {
      font-family: ui-monospace, monospace;
    }

    &--price {
      font-size: 15px;
      font-weight: 600;
      color: #fa8c16;
    }
  }

  .batch-head {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 12px;
  }

  .batch-tag {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 600;
    color: #1890ff;
    background: #e6f7ff;
    border-radius: 12px;
  }

  .batch-hint {
    font-size: 12px;
    color: #8c8c8c;

    em {
      font-style: normal;
      font-weight: 600;
      color: #595959;
    }
  }

  .batch-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .batch-tab {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #595959;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 6px;

    &.active {
      color: #fff;
      background: #1890ff;
      border-color: #1890ff;
    }
  }

  .batch-tab-plate {
    opacity: 0.85;
  }

  .audit-footer {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: flex-end;
    padding: 16px 24px;
  }

  .btn-reject {
    color: #fff !important;
    background: #ff4d4f !important;
    border-color: #ff4d4f !important;

    &:hover {
      background: #d9363e !important;
      border-color: #d9363e !important;
    }
  }

  .btn-approve {
    color: #fff !important;
    background: #52c41a !important;
    border-color: #52c41a !important;

    &:hover {
      background: #449a19 !important;
      border-color: #449a19 !important;
    }
  }
</style>
