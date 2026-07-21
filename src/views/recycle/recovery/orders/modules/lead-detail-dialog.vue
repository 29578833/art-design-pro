<template>
  <ElDialog
    v-model="dialogVisible"
    width="880px"
    align-center
    destroy-on-close
    :show-close="false"
    class="lead-detail-dialog"
    @closed="handleClosed"
  >
    <!-- 标题 -->
    <template #header>
      <div class="ldg-header">
        <div class="ldg-header-left">
          <span class="ldg-title">线索详情</span>
          <span v-if="!loading" class="ldg-type-tag" :style="typeTagStyle">{{ typeTagLabel }}</span>
          <span v-if="!loading" class="ldg-status-tag" :style="statusBadgeStyle">{{
            statusBadgeLabel
          }}</span>
        </div>
        <button type="button" class="ldg-close-btn" @click="dialogVisible = false">
          <ArtSvgIcon icon="ri:close-line" />
        </button>
      </div>
    </template>

    <!-- 内容区 -->
    <div v-loading="loading" class="ldg-body">
      <!-- 指派状态横幅 -->
      <div v-if="isAssigned && !loading" class="ldg-assigned-banner">
        <div class="ldg-assigned-icon-wrap">
          <ArtSvgIcon icon="ri:user-shared-line" />
        </div>
        <div>
          <div class="ldg-assigned-title">线索已指派</div>
          <div class="ldg-assigned-sub">
            已指派给 {{ detail.assign_name || '业务员' }}
            <template v-if="detail.assign_phone">（{{ detail.assign_phone }}）</template
            >，已推送线索通知
          </div>
        </div>
      </div>

      <!-- 车辆线索：车辆信息 + 回收用户信息 -->
      <template v-if="detail.lead_type === 1">
        <div class="ldg-card">
          <div class="ldg-card-title">车辆信息</div>
          <ElRow :gutter="24">
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">车牌号</div>
                <div class="ldg-value ldg-value--bold ldg-value--plate">
                  {{ vehicle?.plate_no || '—' }}
                </div>
              </div>
            </ElCol>
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">VIN码</div>
                <div class="ldg-value ldg-value--mono">{{ vehicle?.vin || '—' }}</div>
              </div>
            </ElCol>
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">品牌车型</div>
                <div class="ldg-value">{{ brandModel }}</div>
              </div>
            </ElCol>
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">送厂方式</div>
                <div class="ldg-value">
                  <span
                    v-if="detail.delivery_type === 'tow'"
                    class="ldg-delivery-tag ldg-delivery-tag--tow"
                  >
                    <ArtSvgIcon icon="ri:truck-line" />
                    预约拖车
                  </span>
                  <span v-else-if="detail.delivery_type === 'self'" class="ldg-delivery-tag">
                    自行送厂
                  </span>
                  <span v-else>—</span>
                </div>
              </div>
            </ElCol>
            <ElCol v-if="vehicle?.fuel_type" :span="8">
              <div class="ldg-item">
                <div class="ldg-label">燃料类型</div>
                <div class="ldg-value">{{ vehicle.fuel_type }}</div>
              </div>
            </ElCol>
            <ElCol v-if="vehicle?.reg_date" :span="8">
              <div class="ldg-item">
                <div class="ldg-label">注册日期</div>
                <div class="ldg-value">{{ vehicle.reg_date }}</div>
              </div>
            </ElCol>
          </ElRow>
        </div>

        <div class="ldg-card">
          <div class="ldg-card-title">回收用户信息</div>
          <ElRow :gutter="24">
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">姓名</div>
                <div class="ldg-value">{{ detail.real_name || '—' }}</div>
              </div>
            </ElCol>
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">联系电话</div>
                <div class="ldg-value ldg-value--bold ldg-value--phone">
                  {{ detail.phone || '—' }}
                </div>
              </div>
            </ElCol>
            <ElCol v-if="detail.address || detail.pickup_address" :span="24">
              <div class="ldg-item">
                <div class="ldg-label">取车地址</div>
                <div class="ldg-value">
                  {{ detail.address || detail.pickup_address || '—' }}
                </div>
              </div>
            </ElCol>
          </ElRow>
        </div>
      </template>

      <!-- 客户线索：客户信息 -->
      <template v-else-if="detail.lead_type === 2">
        <div class="ldg-card">
          <div class="ldg-card-title">客户信息</div>
          <ElRow :gutter="24">
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">联系电话</div>
                <div class="ldg-value ldg-value--bold ldg-value--phone">
                  {{ detail.phone || '—' }}
                </div>
              </div>
            </ElCol>
            <ElCol :span="8">
              <div class="ldg-item">
                <div class="ldg-label">提交时间</div>
                <div class="ldg-value">{{ addTimeText }}</div>
              </div>
            </ElCol>
          </ElRow>
          <div class="ldg-customer-tip">
            <ArtSvgIcon icon="ri:information-line" class="ldg-tip-icon" />
            客户线索仅含基本联系信息，请联系客户了解详细需求后创建回收订单。
          </div>
        </div>
      </template>

      <!-- 跟进信息 -->
      <div class="ldg-card">
        <div class="ldg-card-title">跟进信息</div>
        <ElRow :gutter="24">
          <ElCol :span="8">
            <div class="ldg-item">
              <div class="ldg-label">提交时间</div>
              <div class="ldg-value">{{ addTimeText }}</div>
            </div>
          </ElCol>
          <ElCol :span="8">
            <div class="ldg-item">
              <div class="ldg-label">跟进状态</div>
              <span class="ldg-inline-badge" :style="statusBadgeStyle">{{ statusBadgeLabel }}</span>
            </div>
          </ElCol>
          <ElCol v-if="detail.follow_time" :span="8">
            <div class="ldg-item">
              <div class="ldg-label">跟进时间</div>
              <div class="ldg-value">{{ detail.follow_time }}</div>
            </div>
          </ElCol>
          <ElCol v-if="followPersonName" :span="8">
            <div class="ldg-item">
              <div class="ldg-label">{{ isAssigned ? '指派跟进人' : '跟进人' }}</div>
              <div class="ldg-value ldg-value--bold ldg-value--person">{{ followPersonName }}</div>
            </div>
          </ElCol>
          <ElCol v-if="detail.remark" :span="24">
            <div class="ldg-item">
              <div class="ldg-label">备注</div>
              <div class="ldg-value ldg-value--remark">{{ detail.remark }}</div>
            </div>
          </ElCol>
        </ElRow>
      </div>
    </div>

    <!-- 底栏 -->
    <template #footer>
      <div class="ldg-footer">
        <div class="ldg-footer-left">
          <span v-if="isAssigned && detail.assign_name" class="ldg-footer-assign">
            已指派给
            <span class="ldg-footer-assign-name">{{ detail.assign_name }}</span>
            <template v-if="detail.assign_phone">（{{ detail.assign_phone }}）</template>
          </span>
        </div>
        <div class="ldg-footer-right">
          <ElButton size="large" @click="dialogVisible = false">关闭</ElButton>
          <ElButton v-if="isPending" size="large" @click="assignDialogVisible = true">
            <ArtSvgIcon icon="ri:user-shared-line" class="mr-1" />
            指派跟进人
          </ElButton>
          <ElButton size="large" type="primary" @click="handleCreateOrder">
            <ArtSvgIcon icon="ri:add-line" class="mr-1" />
            创建订单
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>

  <!-- 指派跟进人弹窗 -->
  <LeadAssignDialog
    v-model:visible="assignDialogVisible"
    :order-id="props.orderId"
    @success="handleAssignSuccess"
  />
</template>

<script setup lang="ts">
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import { fetchOrderDetail } from '@/api/recycle/order'
  import type { OrderDetail } from '@/types/recycle/order'
  import LeadAssignDialog from './lead-assign-dialog.vue'

  interface Props {
    visible: boolean
    orderId: number | null
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{
    (e: 'update:visible', v: boolean): void
    (e: 'create-order', orderId: number): void
    (e: 'refresh'): void
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  // ========== 详情数据 ==========
  const loading = ref(false)
  const detail = ref<Partial<OrderDetail>>({})

  const vehicle = computed(() => detail.value.vehicle ?? detail.value.vehicles?.[0])

  const addTimeText = computed(() => {
    const t = detail.value.add_time
    if (!t) return '—'
    return new Date(Number(t) * 1000).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  })

  const brandModel = computed(() => {
    const v = vehicle.value
    if (!v) return '—'
    const parts = [v.brand, v.model].filter(Boolean).join(' ')
    const year = v.vehicle_year || (v.reg_date ? v.reg_date.slice(0, 4) : '')
    return parts ? (year ? `${parts} · ${year}年` : parts) : '—'
  })

  // ========== 状态/类型标签 ==========
  const typeTagLabel = computed(() => (detail.value.lead_type === 1 ? '车辆线索' : '客户线索'))

  const typeTagStyle = computed(() =>
    detail.value.lead_type === 1
      ? { background: '#FFF7E6', color: '#FA8C16' }
      : { background: '#FFF0F6', color: '#EB2F96' }
  )

  const isPending = computed(
    () => !Number(detail.value.is_follow) && !Number(detail.value.business_id)
  )
  const isAssigned = computed(
    () => Number(detail.value.business_id) > 0 && !Number(detail.value.is_follow)
  )
  const isViewed = computed(() => Number(detail.value.is_follow) === 1)

  const statusBadgeLabel = computed(() => {
    if (isViewed.value) return '已跟进'
    if (isAssigned.value) return '线索指派'
    return '待跟进'
  })
  const statusBadgeStyle = computed(() => {
    if (isViewed.value) return { background: '#F6FFED', color: '#52C41A' }
    if (isAssigned.value) return { background: '#EEF5FF', color: '#1677ff' }
    return { background: '#FFF7E6', color: '#FA8C16' }
  })

  const followPersonName = computed(
    () => detail.value.assign_name || detail.value.follow_person_name || ''
  )

  // ========== 指派弹窗 ==========
  const assignDialogVisible = ref(false)

  async function handleAssignSuccess() {
    emit('refresh')
    await loadDetail()
  }

  // ========== 创建订单 ==========
  function handleCreateOrder() {
    if (props.orderId) emit('create-order', props.orderId)
    dialogVisible.value = false
  }

  // ========== 数据加载 ==========
  async function loadDetail() {
    if (!props.orderId) return
    loading.value = true
    try {
      const res = await fetchOrderDetail(props.orderId)
      detail.value = res as Partial<OrderDetail>
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    detail.value = {}
    assignDialogVisible.value = false
  }

  watch(
    () => props.visible,
    (v) => {
      if (v && props.orderId) loadDetail()
    },
    { immediate: true }
  )
</script>

<style lang="scss">
  .lead-detail-dialog {
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

    .el-button {
      font-size: 14px;
    }
  }
</style>

<style scoped lang="scss">
  /* ===== Header ===== */
  .ldg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  .ldg-header-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .ldg-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f1f1f;
  }

  .ldg-type-tag,
  .ldg-status-tag {
    padding: 4px 12px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 20px;
  }

  .ldg-close-btn {
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

  /* ===== Body ===== */
  .ldg-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 200px;
    max-height: calc(90vh - 168px);
    padding: 16px 20px;
    overflow-y: auto;
  }

  /* ===== 指派横幅 ===== */
  .ldg-assigned-banner {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
    background: #e6f4ff;
    border: 1px solid #91caff;
    border-radius: 8px;
  }

  .ldg-assigned-icon-wrap {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #1677ff;
    background: rgb(22 119 255 / 12%);
    border-radius: 50%;
  }

  .ldg-assigned-title {
    font-size: 14px;
    font-weight: 600;
    color: #1677ff;
  }

  .ldg-assigned-sub {
    margin-top: 2px;
    font-size: 13px;
    color: #4096ff;
  }

  /* ===== 信息卡片 ===== */
  .ldg-card {
    padding: 14px 16px 10px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  .ldg-card-title {
    padding-bottom: 10px;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #434343;
    letter-spacing: 0.02em;
    border-bottom: 1px solid #f0f0f0;
  }

  .ldg-item {
    padding-bottom: 12px;
  }

  .ldg-label {
    margin-bottom: 4px;
    font-size: 13px;
    color: #595959;
  }

  .ldg-value {
    font-size: 15px;
    color: #1f1f1f;

    &--bold {
      font-weight: 600;
    }

    &--mono {
      font-size: 14px;
      color: #434343;
    }

    &--plate {
      font-size: 16px;
      color: #1677ff;
    }

    &--phone {
      color: #262626;
    }

    &--person {
      color: #1677ff;
    }

    &--remark {
      padding: 8px 10px;
      font-size: 14px;
      line-height: 1.6;
      color: #434343;
      background: #f8f9fb;
      border-radius: 6px;
    }
  }

  /* ===== 客户线索提示 ===== */
  .ldg-customer-tip {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    padding: 10px 12px;
    margin-top: 8px;
    font-size: 13px;
    color: #3d7eff;
    background: #e6f4ff;
    border: 1px solid #bae0ff;
    border-radius: 6px;
  }

  .ldg-tip-icon {
    flex-shrink: 0;
    margin-top: 1px;
    font-size: 14px;
  }

  /* ===== 内联状态徽章 ===== */
  .ldg-inline-badge {
    display: inline-block;
    padding: 3px 11px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 20px;
  }

  /* ===== 送厂方式标签 ===== */
  .ldg-delivery-tag {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 3px 10px;
    font-size: 13px;
    color: #595959;
    background: #f5f5f5;
    border-radius: 4px;

    &--tow {
      color: #13c2c2;
      background: #e6fffb;
    }
  }

  /* ===== Footer ===== */
  .ldg-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
  }

  .ldg-footer-left {
    flex: 1;
  }

  .ldg-footer-assign {
    font-size: 13px;
    color: #595959;
  }

  .ldg-footer-assign-name {
    font-weight: 600;
    color: #1677ff;
  }

  .ldg-footer-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
